"""
VentVault Backend API
Privacy-first emotional venting platform

Features:
- Streaming LLM responses
- Anonymous analytics (no content stored)
- Consent-based location tracking
- GDPR/CCPA compliant data handling
"""

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import redis.asyncio as redis
import uuid
import time
import logging
from contextlib import asynccontextmanager
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings, Settings
from app.models import (
    VentRequest, 
    VentResponse, 
    HealthResponse, 
    UsageResponse,
    ErrorResponse,
    ConsentRequest,
    ConsentResponse,
    LocationResponse,
    AnalyticsResponse,
    DataExportResponse
)
from app.pii_scrubber import PIIScrubber
from app.rate_limiter import RateLimiter
from app.llm_service import LLMService
from app.database import init_database, close_database, get_db
from app.analytics_service import AnalyticsService
from app.location_service import LocationService
from app.consent_service import ConsentService
from app.db_models import ConsentType
from app.auth_service import ClerkAuthService, ClerkUser, get_auth_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


# Application state
class AppState:
    """Global application state"""
    redis_client: Optional[redis.Redis] = None
    rate_limiter: Optional[RateLimiter] = None
    llm_service: Optional[LLMService] = None
    analytics_service: Optional[AnalyticsService] = None
    location_service: Optional[LocationService] = None
    consent_service: Optional[ConsentService] = None
    auth_service: Optional[ClerkAuthService] = None
    settings: Optional[Settings] = None


state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle"""
    settings = get_settings()
    state.settings = settings
    
    logger.info(f"Starting VentVault Backend ({settings.environment})")
    
    # Initialize Database
    try:
        await init_database()
        logger.info("✅ Database connected")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
    
    # Initialize Redis with connection pool
    try:
        state.redis_client = await redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=settings.redis_pool_size
        )
        await state.redis_client.ping()
        logger.info("✅ Redis connected")
    except Exception as e:
        logger.error(f"❌ Redis connection failed: {e}")
        state.redis_client = None
    
    # Initialize rate limiter
    if state.redis_client:
        state.rate_limiter = RateLimiter(
            state.redis_client,
            anon_limit=settings.anon_daily_limit,
            signed_in_limit=settings.signed_in_daily_limit,
            premium_limit=settings.premium_daily_limit
        )
        logger.info("✅ Rate limiter initialized")
    
    # Initialize LLM service
    state.llm_service = LLMService(settings)
    if state.llm_service.is_healthy():
        logger.info(f"✅ LLM service initialized ({settings.llm_provider})")
    else:
        logger.warning("⚠️ LLM service not properly configured")
    
    # Initialize analytics, location, and consent services
    state.analytics_service = AnalyticsService()
    state.location_service = LocationService()
    state.consent_service = ConsentService()
    logger.info("✅ Analytics, Location, and Consent services initialized")
    
    # Initialize Clerk auth service
    state.auth_service = ClerkAuthService(settings.clerk_publishable_key)
    if state.auth_service.is_configured():
        logger.info("✅ Clerk authentication initialized")
    else:
        logger.warning("⚠️ Clerk not configured - auth features disabled")
    
    logger.info("🚀 VentVault Backend Ready")
    
    yield
    
    # Cleanup
    if state.redis_client:
        await state.redis_client.close()
        logger.info("Redis connection closed")
    
    if state.location_service:
        await state.location_service.close()
    
    await close_database()
    
    logger.info("👋 VentVault Backend Stopped")


# Create FastAPI app
app = FastAPI(
    title="VentVault API",
    description="Privacy-first emotional venting platform",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if get_settings().environment != "production" else None,
    redoc_url="/redoc" if get_settings().environment != "production" else None
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Session-ID", "X-Remaining-Vents", "X-Reset-Seconds", "X-User-ID"]
)


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            code=f"HTTP_{exc.status_code}"
        ).model_dump()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {type(exc).__name__}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            code="INTERNAL_ERROR"
        ).model_dump()
    )


# Helper functions
def get_client_info(request: Request) -> tuple[str, str]:
    """Extract client IP and user agent from request"""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    
    user_agent = request.headers.get("user-agent", "")
    return ip, user_agent


def get_user_id(request: Request) -> Optional[str]:
    """Extract user ID from auth header (future implementation)"""
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        pass
    return None


async def get_authenticated_user(request: Request) -> Optional[ClerkUser]:
    """
    Extract and verify authenticated user from Clerk JWT.
    Returns None for anonymous users.
    """
    auth_header = request.headers.get("authorization")
    if not auth_header:
        return None
    
    if not state.auth_service:
        return None
    
    return await state.auth_service.verify_token(auth_header)


# Routes
@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint"""
    return {"status": "ok", "service": "VentVault API", "version": "2.0.0"}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring."""
    redis_status = "disconnected"
    if state.redis_client:
        try:
            await state.redis_client.ping()
            redis_status = "connected"
        except:
            redis_status = "disconnected"
    
    llm_status = "configured" if state.llm_service and state.llm_service.is_healthy() else "not_configured"
    
    # Check database
    db_status = "connected"
    try:
        from app.database import _engine
        if _engine:
            async with _engine.connect() as conn:
                await conn.execute("SELECT 1")
        else:
            db_status = "disconnected"
    except:
        db_status = "disconnected"
    
    if redis_status == "connected" and llm_status == "configured" and db_status == "connected":
        status = "healthy"
    elif redis_status == "connected" or llm_status == "configured":
        status = "degraded"
    else:
        status = "unhealthy"
    
    return HealthResponse(
        status=status,
        redis=redis_status,
        llm=llm_status,
        database=db_status,
        environment=state.settings.environment if state.settings else "unknown"
    )


@app.get("/api/usage", response_model=UsageResponse)
async def get_usage(request: Request):
    """Get current rate limit usage for the client."""
    if not state.rate_limiter:
        raise HTTPException(status_code=503, detail="Rate limiter unavailable")
    
    ip, user_agent = get_client_info(request)
    
    # Check for authenticated user
    auth_user = await get_authenticated_user(request)
    user_id = auth_user.user_id if auth_user else None
    user_tier = auth_user.tier if auth_user else None
    
    usage = await state.rate_limiter.get_usage(ip, user_agent, user_id, user_tier)
    return UsageResponse(**usage)


@app.post("/api/vent")
async def create_vent(
    request: Request, 
    vent: VentRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    🔥 HOT PATH - Core vent endpoint
    
    Creates a new vent and streams AI response.
    Records anonymous analytics (no content stored).
    """
    start_time = time.perf_counter()
    
    ip, user_agent = get_client_info(request)
    
    # Check for authenticated user (Clerk)
    auth_user = await get_authenticated_user(request)
    user_id = auth_user.user_id if auth_user else None
    user_tier = auth_user.tier if auth_user else None
    
    # 1. Rate limit check
    if not state.rate_limiter:
        logger.warning("Rate limiter unavailable, allowing request")
        remaining, reset_seconds = 999, 86400
    else:
        is_allowed, remaining, reset_seconds = await state.rate_limiter.check_limit(
            ip, user_agent, user_id, user_tier
        )
        if not is_allowed:
            raise HTTPException(
                status_code=429,
                detail="Daily vent limit reached. Sign in for more vents."
            )
    
    # 2. PII scrubbing
    pii_detected = PIIScrubber.contains_pii(vent.content)
    scrubbed_content = PIIScrubber.scrub(vent.content)
    
    if pii_detected:
        logger.info("PII detected and scrubbed from vent")
    
    # 3. Get or create anonymous user and session
    anonymous_user = await state.analytics_service.get_or_create_anonymous_user(
        db, ip, user_agent
    )
    
    # Create or get session
    session_id_str = request.headers.get("X-Session-ID")
    if session_id_str:
        try:
            session_uuid = uuid.UUID(session_id_str)
            # Verify session belongs to user
            from sqlalchemy import select
            from app.db_models import VentSession
            result = await db.execute(
                select(VentSession).where(
                    VentSession.id == session_uuid,
                    VentSession.anonymous_user_id == anonymous_user.id
                )
            )
            session = result.scalar_one_or_none()
            if not session:
                session = await state.analytics_service.create_session(db, anonymous_user.id)
        except:
            session = await state.analytics_service.create_session(db, anonymous_user.id)
    else:
        session = await state.analytics_service.create_session(db, anonymous_user.id)
    
    # 4. Stream LLM response
    async def generate():
        """Server-sent events stream generator"""
        response_tokens = []
        
        try:
            if not state.llm_service:
                yield f"data: I hear you. What you're feeling matters.\n\n"
                yield f"data: [DONE]\n\n"
                return
            
            async for token in state.llm_service.stream_response(
                scrubbed_content, 
                vent.mode.value
            ):
                response_tokens.append(token)
                yield f"data: {token}\n\n"
            
            yield f"data: [DONE]\n\n"
            
            # Record analytics (async, non-blocking)
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            
            try:
                from app.database import get_db_context
                async with get_db_context() as analytics_db:
                    await state.analytics_service.record_vent_analytics(
                        analytics_db,
                        session.id,
                        scrubbed_content,
                        vent.mode.value,
                        latency_ms,
                        pii_detected,
                        continued_conversation=bool(vent.history)
                    )
            except Exception as e:
                logger.error(f"Failed to record analytics: {e}")
            
            logger.info(
                f"⚡ Vent completed | "
                f"latency={latency_ms}ms | "
                f"tokens={len(response_tokens)} | "
                f"remaining={remaining}"
            )
            
        except Exception as e:
            logger.error(f"Stream error: {type(e).__name__}: {str(e)}")
            yield f"data: I hear you. What you're feeling matters.\n\n"
            yield f"data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Connection": "keep-alive",
            "X-Session-ID": str(session.id),
            "X-User-ID": str(anonymous_user.id),
            "X-Remaining-Vents": str(remaining),
            "X-Reset-Seconds": str(reset_seconds)
        }
    )


# ============================================
# Consent Management Endpoints
# ============================================

@app.get("/api/consent", response_model=ConsentResponse)
async def get_consents(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get current consent status for the user."""
    ip, user_agent = get_client_info(request)
    
    anonymous_user = await state.analytics_service.get_or_create_anonymous_user(
        db, ip, user_agent
    )
    
    consents = await state.consent_service.get_user_consents(db, anonymous_user.id)
    
    return ConsentResponse(
        user_id=str(anonymous_user.id),
        consents=consents
    )


@app.post("/api/consent", response_model=ConsentResponse)
async def update_consents(
    request: Request,
    consent_request: ConsentRequest,
    db: AsyncSession = Depends(get_db)
):
    """Update user consent preferences."""
    ip, user_agent = get_client_info(request)
    ip_hash = AnalyticsService.hash_ip(ip)
    
    anonymous_user = await state.analytics_service.get_or_create_anonymous_user(
        db, ip, user_agent
    )
    
    # Update consents
    await state.consent_service.update_consents(
        db, anonymous_user.id, consent_request.consents, ip_hash
    )
    
    # If location consent granted, fetch and store location
    if consent_request.consents.get("location", False):
        await state.location_service.grant_location_consent(
            db, anonymous_user.id, ip, ip_hash
        )
    elif "location" in consent_request.consents and not consent_request.consents["location"]:
        await state.location_service.revoke_location_consent(db, anonymous_user.id)
    
    # Get updated consents
    consents = await state.consent_service.get_user_consents(db, anonymous_user.id)
    
    return ConsentResponse(
        user_id=str(anonymous_user.id),
        consents=consents
    )


# ============================================
# Location Endpoints
# ============================================

@app.get("/api/location", response_model=LocationResponse)
async def get_location(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get stored location (requires consent)."""
    ip, user_agent = get_client_info(request)
    
    anonymous_user = await state.analytics_service.get_or_create_anonymous_user(
        db, ip, user_agent
    )
    
    # Check consent
    has_consent = await state.location_service.has_location_consent(db, anonymous_user.id)
    
    if not has_consent:
        return LocationResponse(
            has_consent=False,
            location=None
        )
    
    location = await state.location_service.get_user_location(db, anonymous_user.id)
    
    return LocationResponse(
        has_consent=True,
        location=location
    )


# ============================================
# Analytics Endpoints (Aggregate only)
# ============================================

@app.get("/api/analytics/aggregate", response_model=AnalyticsResponse)
async def get_aggregate_analytics(
    days: int = 30,
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregate analytics (admin/dashboard use).
    No individual user data exposed.
    """
    if days > 365:
        days = 365
    
    stats = await state.analytics_service.get_aggregate_stats(db, days)
    
    return AnalyticsResponse(**stats)


# ============================================
# Data Privacy Endpoints (GDPR/CCPA)
# ============================================

@app.get("/api/user/data", response_model=DataExportResponse)
async def export_user_data(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Export all user data (GDPR right to data portability).
    Returns all stored data for the requesting user.
    """
    ip, user_agent = get_client_info(request)
    
    anonymous_user = await state.analytics_service.get_or_create_anonymous_user(
        db, ip, user_agent
    )
    
    data = await state.consent_service.export_user_data(db, anonymous_user.id)
    
    return DataExportResponse(data=data)


@app.delete("/api/user/data")
async def delete_user_data(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete all user data (GDPR right to erasure).
    Permanently removes all data associated with the user.
    """
    ip, user_agent = get_client_info(request)
    
    anonymous_user = await state.analytics_service.get_or_create_anonymous_user(
        db, ip, user_agent
    )
    
    user_id = anonymous_user.id
    
    success = await state.consent_service.delete_all_user_data(db, user_id)
    
    if success:
        return {"message": "All your data has been deleted", "user_id": str(user_id)}
    else:
        raise HTTPException(status_code=404, detail="User not found")


# Run with uvicorn
if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower()
    )
