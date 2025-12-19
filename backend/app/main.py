"""
VentVault Backend API
Privacy-first emotional venting platform

Hot Path Design:
1. Rate limit check (Redis)
2. PII scrubbing (in-memory)
3. LLM streaming (async)
4. No database writes during vent
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

from app.config import get_settings, Settings
from app.models import (
    VentRequest, 
    VentResponse, 
    HealthResponse, 
    UsageResponse,
    ErrorResponse,
    VentMetadata
)
from app.pii_scrubber import PIIScrubber
from app.rate_limiter import RateLimiter
from app.llm_service import LLMService

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
    settings: Optional[Settings] = None


state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle"""
    settings = get_settings()
    state.settings = settings
    
    logger.info(f"Starting VentVault Backend ({settings.environment})")
    
    # Initialize Redis with connection pool
    try:
        state.redis_client = await redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=settings.redis_pool_size
        )
        # Test connection
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
    
    logger.info("🚀 VentVault Backend Ready")
    
    yield
    
    # Cleanup
    if state.redis_client:
        await state.redis_client.close()
        logger.info("Redis connection closed")
    
    logger.info("👋 VentVault Backend Stopped")


# Create FastAPI app
app = FastAPI(
    title="VentVault API",
    description="Privacy-first emotional venting platform",
    version="1.0.0",
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
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Session-ID", "X-Remaining-Vents", "X-Reset-Seconds"]
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
    # Handle proxied requests
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    
    user_agent = request.headers.get("user-agent", "")
    return ip, user_agent


def get_user_id(request: Request) -> Optional[str]:
    """Extract user ID from auth header (future implementation)"""
    # TODO: Implement auth token validation
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # Validate token and extract user ID
        pass
    return None


# Routes
@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint"""
    return {"status": "ok", "service": "VentVault API", "version": "1.0.0"}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for monitoring.
    Returns service status and component health.
    """
    redis_status = "disconnected"
    if state.redis_client:
        try:
            await state.redis_client.ping()
            redis_status = "connected"
        except:
            redis_status = "disconnected"
    
    llm_status = "configured" if state.llm_service and state.llm_service.is_healthy() else "not_configured"
    
    # Determine overall status
    if redis_status == "connected" and llm_status == "configured":
        status = "healthy"
    elif redis_status == "connected" or llm_status == "configured":
        status = "degraded"
    else:
        status = "unhealthy"
    
    return HealthResponse(
        status=status,
        redis=redis_status,
        llm=llm_status,
        environment=state.settings.environment if state.settings else "unknown"
    )


@app.get("/api/usage", response_model=UsageResponse)
async def get_usage(request: Request):
    """
    Get current rate limit usage for the client.
    Does not count against rate limit.
    """
    if not state.rate_limiter:
        raise HTTPException(status_code=503, detail="Rate limiter unavailable")
    
    ip, user_agent = get_client_info(request)
    user_id = get_user_id(request)
    
    usage = await state.rate_limiter.get_usage(ip, user_agent, user_id)
    return UsageResponse(**usage)


@app.post("/api/vent")
async def create_vent(request: Request, vent: VentRequest):
    """
    🔥 HOT PATH - Core vent endpoint
    
    Creates a new vent and streams AI response.
    
    Flow:
    1. Rate limit check (Redis) - ~5ms
    2. PII scrubbing (in-memory) - ~1ms
    3. LLM streaming (async) - ~500-1500ms
    
    No database writes occur during this request.
    """
    start_time = time.perf_counter()
    
    # Extract client info
    ip, user_agent = get_client_info(request)
    user_id = get_user_id(request)
    
    # 1. Rate limit check
    if not state.rate_limiter:
        logger.warning("Rate limiter unavailable, allowing request")
        remaining, reset_seconds = 999, 86400
    else:
        is_allowed, remaining, reset_seconds = await state.rate_limiter.check_limit(
            ip, user_agent, user_id
        )
        if not is_allowed:
            raise HTTPException(
                status_code=429,
                detail="Daily vent limit reached. Sign in for more vents."
            )
    
    # 2. PII scrubbing (in-memory, fast)
    pii_detected = PIIScrubber.contains_pii(vent.content)
    scrubbed_content = PIIScrubber.scrub(vent.content)
    
    if pii_detected:
        logger.info("PII detected and scrubbed from vent")
    
    # 3. Generate session ID
    session_id = str(uuid.uuid4())
    
    # 4. Prepare metadata (for future async processing)
    word_count = len(scrubbed_content.split())
    
    # 5. Stream LLM response
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
            
            # Send completion event
            yield f"data: [DONE]\n\n"
            
            # Log performance metrics (no content)
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.info(
                f"⚡ Vent completed | "
                f"latency={latency_ms:.0f}ms | "
                f"tokens={len(response_tokens)} | "
                f"remaining={remaining} | "
                f"pii={pii_detected}"
            )
            
            # TODO: Fire async job for metadata extraction
            # await background_tasks.add_task(process_vent_metadata, metadata)
            
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
            "X-Session-ID": session_id,
            "X-Remaining-Vents": str(remaining),
            "X-Reset-Seconds": str(reset_seconds)
        }
    )


# Future endpoints (Phase 2+)

@app.post("/api/session/upgrade", include_in_schema=False)
async def upgrade_session():
    """
    [FUTURE] Upgrade anonymous session to authenticated user.
    Links anonymous metadata to user account.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.get("/api/insights", include_in_schema=False)
async def get_insights():
    """
    [FUTURE] Get mood insights and patterns.
    Requires authentication.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


@app.delete("/api/user/data", include_in_schema=False)
async def delete_user_data():
    """
    [FUTURE] Delete all user data.
    GDPR compliance endpoint.
    """
    raise HTTPException(status_code=501, detail="Not implemented yet")


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
