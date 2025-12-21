# VentVault - Future Implementation Plan

## 📋 Overview

This document outlines the phased implementation plan for VentVault's backend evolution from MVP to full-featured platform.

---

## 🎯 Phase Summary

| Phase | Focus | Timeline | Status |
|-------|-------|----------|--------|
| Phase 1 | Core Hot Path | Week 1-2 | ✅ Complete |
| Phase 2 | Background Processing | Week 3-4 | 🔜 Next |
| Phase 3 | Authentication | Week 5-6 | �  In Progress |
| Phase 4 | Insights & Analytics | Week 7-8 | 📋 Planned |
| Phase 5 | Premium Features | Week 9-12 | 📋 Planned |
| Phase 6 | Scale & Optimize | Ongoing | 📋 Planned |

---

## ✅ Phase 1: Core Hot Path (COMPLETE)

### Implemented
- [x] FastAPI application structure
- [x] Streaming LLM integration (OpenAI + Anthropic)
- [x] Server-Sent Events for real-time streaming
- [x] PII scrubbing (emails, phones, URLs, SSN, cards, IPs)
- [x] Redis rate limiting with tiers
- [x] Anonymous device hashing
- [x] Health check endpoint
- [x] CORS middleware
- [x] GZip compression
- [x] Error handling
- [x] Logging system
- [x] Docker support
- [x] Frontend integration

### Performance Achieved
- P95 latency: ~1.2s (target: <2s) ✅
- Time-to-first-token: ~400ms (target: <600ms) ✅
- API logic: ~50ms (target: <100ms) ✅

---

## 🔜 Phase 2: Background Processing (NEXT)

### Goals
- Extract emotion metadata without storing content
- Enable mood map generation
- Prepare for insights feature

### Implementation Plan

#### 2.1 Background Worker Setup

```python
# backend/app/worker.py
from rq import Queue
from redis import Redis
from app.tasks import process_vent_metadata

redis_conn = Redis()
queue = Queue(connection=redis_conn)

def enqueue_vent_processing(metadata: VentMetadata):
    """Fire-and-forget metadata processing"""
    queue.enqueue(
        process_vent_metadata,
        metadata,
        job_timeout=30,
        result_ttl=0  # Don't store results
    )
```

#### 2.2 Emotion Classification

```python
# backend/app/tasks/emotion_classifier.py
from typing import Optional
import openai

EMOTIONS = [
    "joy", "sadness", "anger", "fear", "surprise",
    "disgust", "trust", "anticipation", "overwhelm",
    "anxiety", "relief", "frustration", "loneliness"
]

async def classify_emotion(content: str) -> dict:
    """
    Classify emotion from vent content.
    Returns emotion and intensity, NOT the content.
    """
    response = await openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": f"Classify the primary emotion. Return JSON: {{\"emotion\": \"<one of {EMOTIONS}>\", \"intensity\": <0.0-1.0>}}"
            },
            {"role": "user", "content": content}
        ],
        max_tokens=50,
        temperature=0.3
    )
    
    # Parse and return metadata only
    return parse_emotion_response(response)
```

#### 2.3 Theme Detection

```python
# backend/app/tasks/theme_detector.py
THEMES = [
    "work", "relationships", "family", "health",
    "finances", "self-esteem", "future", "past",
    "social", "existential", "daily-stress"
]

async def detect_theme(content: str) -> str:
    """Detect primary theme without storing content"""
    # Similar to emotion classification
    pass
```

#### 2.4 Metadata Storage

```python
# backend/app/models/metadata.py
from sqlalchemy import Column, String, Float, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID

class VentMetadataDB(Base):
    """
    Stores ONLY metadata, NEVER raw content.
    """
    __tablename__ = "vent_metadata"
    
    id = Column(UUID, primary_key=True)
    user_hash = Column(String(64), index=True)  # Anonymous identifier
    session_id = Column(UUID, index=True)
    
    # Extracted metadata
    emotion = Column(String(50))
    theme = Column(String(50))
    intensity = Column(Float)
    
    # Context
    mode = Column(String(10))  # text/voice
    word_count = Column(Integer)
    time_of_day = Column(String(20))  # morning/afternoon/evening/night
    day_of_week = Column(Integer)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Privacy
    pii_detected = Column(Boolean, default=False)
```

#### 2.5 Database Setup

```bash
# Install dependencies
pip install sqlalchemy asyncpg alembic

# Initialize migrations
alembic init migrations

# Create migration
alembic revision --autogenerate -m "Add vent_metadata table"

# Run migration
alembic upgrade head
```

### Files to Create

```
backend/
├── app/
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── emotion_classifier.py
│   │   ├── theme_detector.py
│   │   └── metadata_processor.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   └── models.py
│   └── worker.py
├── migrations/
│   └── versions/
└── alembic.ini
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/ventvault

# Worker
REDIS_QUEUE_URL=redis://localhost:6379/1
WORKER_CONCURRENCY=4
```

---

## 📋 Phase 3: Authentication (IN PROGRESS)

### Goals
- Optional sign-in for enhanced features
- Link anonymous sessions to accounts
- Preserve privacy-first approach

### ✅ Completed
- [x] Clerk frontend integration (ClerkProvider, SignIn/SignUp buttons)
- [x] Middleware setup with clerkMiddleware()
- [x] Backend auth service for JWT verification
- [x] Rate limiter integration with user tiers
- [x] API client auth token support

### 🔜 Remaining
- [ ] Test full auth flow end-to-end
- [ ] Session upgrade flow (link anonymous to authenticated)
- [ ] User profile page
- [ ] Premium tier detection from Clerk metadata

### Implementation Plan

#### 3.1 Auth Provider Integration

**Option A: Clerk (Recommended)**
```python
# backend/app/auth/clerk.py
from clerk_backend_api import Clerk

clerk = Clerk(api_key=settings.clerk_api_key)

async def verify_token(token: str) -> Optional[str]:
    """Verify Clerk JWT and return user ID"""
    try:
        session = clerk.sessions.verify_token(token)
        return session.user_id
    except:
        return None
```

**Option B: Custom JWT**
```python
# backend/app/auth/jwt.py
from jose import jwt, JWTError

def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload.get("sub")
    except JWTError:
        return None
```

#### 3.2 Session Upgrade Flow

```python
# backend/app/routes/auth.py
@app.post("/api/session/upgrade")
async def upgrade_session(
    request: Request,
    session_id: str,
    user: User = Depends(get_current_user)
):
    """
    Link anonymous session to authenticated user.
    Migrates metadata only (no content).
    """
    # 1. Verify session exists
    # 2. Get anonymous user hash
    # 3. Update metadata records to link to user
    # 4. Update rate limit tier
    
    await migrate_anonymous_metadata(
        anonymous_hash=get_device_hash(request),
        user_id=user.id
    )
    
    return {"status": "upgraded", "tier": "signed_in"}
```

#### 3.3 User Model

```python
# backend/app/db/models.py
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID, primary_key=True)
    email = Column(String(255), unique=True, nullable=True)
    
    # Subscription
    tier = Column(String(20), default="signed_in")
    
    # Privacy settings
    data_retention_days = Column(Integer, default=30)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_vent_at = Column(DateTime, nullable=True)
```

### Frontend Changes

```typescript
// frontend/lib/auth.ts
import { useAuth } from "@clerk/nextjs"

export function useVentAuth() {
  const { isSignedIn, getToken } = useAuth()
  
  return {
    isSignedIn,
    getAuthHeaders: async () => {
      if (!isSignedIn) return {}
      const token = await getToken()
      return { Authorization: `Bearer ${token}` }
    }
  }
}
```

---

## 📋 Phase 4: Insights & Analytics

### Goals
- Generate mood maps from metadata
- Show patterns and trends
- Privacy-preserving analytics

### Implementation Plan

#### 4.1 Mood Map Generation

```python
# backend/app/services/mood_map.py
from datetime import datetime, timedelta
from sqlalchemy import func

async def generate_mood_map(user_id: str, days: int = 30) -> dict:
    """
    Generate mood map from metadata.
    No raw content is ever accessed.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Aggregate emotions by day
    daily_emotions = await db.execute(
        select(
            func.date(VentMetadata.created_at).label("date"),
            VentMetadata.emotion,
            func.avg(VentMetadata.intensity).label("avg_intensity"),
            func.count().label("count")
        )
        .where(VentMetadata.user_id == user_id)
        .where(VentMetadata.created_at >= start_date)
        .group_by("date", VentMetadata.emotion)
    )
    
    return {
        "period": {"start": start_date, "end": datetime.utcnow()},
        "daily_emotions": format_daily_data(daily_emotions),
        "top_emotions": get_top_emotions(daily_emotions),
        "patterns": detect_patterns(daily_emotions)
    }
```

#### 4.2 Pattern Detection

```python
# backend/app/services/patterns.py
def detect_patterns(metadata: list[VentMetadata]) -> dict:
    """Detect emotional patterns"""
    return {
        "peak_times": find_peak_vent_times(metadata),
        "weekly_pattern": analyze_weekly_pattern(metadata),
        "emotion_sequences": find_emotion_sequences(metadata),
        "intensity_trends": calculate_intensity_trends(metadata)
    }
```

#### 4.3 Insights API

```python
# backend/app/routes/insights.py
@app.get("/api/insights/mood-map")
async def get_mood_map(
    days: int = 30,
    user: User = Depends(get_current_user)
):
    """Get mood map for authenticated user"""
    return await generate_mood_map(user.id, days)

@app.get("/api/insights/patterns")
async def get_patterns(
    user: User = Depends(get_current_user)
):
    """Get detected patterns"""
    return await detect_patterns(user.id)

@app.get("/api/insights/summary")
async def get_summary(
    user: User = Depends(get_current_user)
):
    """Get weekly/monthly summary"""
    return await generate_summary(user.id)
```

---

## 📋 Phase 5: Premium Features

### Goals
- Monetization through premium tier
- Enhanced features for paying users
- Sustainable business model

### Premium Features

| Feature | Free | Signed-In | Premium |
|---------|------|-----------|---------|
| Daily vents | 2 | 10 | Unlimited |
| Mood map | ❌ | 7 days | 365 days |
| Patterns | ❌ | Basic | Advanced |
| Export | ❌ | ❌ | ✅ |
| Voice | ✅ | ✅ | ✅ |
| Priority | ❌ | ❌ | ✅ |

### Implementation

#### 5.1 Subscription Management

```python
# backend/app/services/subscription.py
from stripe import Subscription

async def create_subscription(user_id: str, plan: str) -> dict:
    """Create Stripe subscription"""
    # 1. Create Stripe customer if needed
    # 2. Create subscription
    # 3. Update user tier
    pass

async def handle_webhook(event: dict):
    """Handle Stripe webhooks"""
    if event["type"] == "customer.subscription.updated":
        await update_user_tier(event["data"])
```

#### 5.2 Feature Gating

```python
# backend/app/middleware/features.py
def require_premium(func):
    """Decorator to require premium tier"""
    @wraps(func)
    async def wrapper(*args, user: User = Depends(get_current_user), **kwargs):
        if user.tier != "premium":
            raise HTTPException(403, "Premium feature")
        return await func(*args, user=user, **kwargs)
    return wrapper
```

---

## 📋 Phase 6: Scale & Optimize

### Goals
- Handle 10k+ DAU
- Reduce costs
- Improve reliability

### Optimizations

#### 6.1 Caching Strategy

```python
# backend/app/cache.py
from functools import lru_cache
import redis

# Cache mood maps (expensive to compute)
async def get_cached_mood_map(user_id: str) -> Optional[dict]:
    key = f"mood_map:{user_id}"
    cached = await redis.get(key)
    if cached:
        return json.loads(cached)
    return None

async def cache_mood_map(user_id: str, data: dict, ttl: int = 3600):
    key = f"mood_map:{user_id}"
    await redis.setex(key, ttl, json.dumps(data))
```

#### 6.2 Model Routing

```python
# backend/app/services/model_router.py
def select_model(content: str, mode: str) -> str:
    """Route to appropriate model based on content"""
    word_count = len(content.split())
    
    if word_count < 20:
        return "gpt-4o-mini"  # Fast, cheap
    elif contains_crisis_keywords(content):
        return "gpt-4o"  # High quality for sensitive
    else:
        return "gpt-4o-mini"  # Default
```

#### 6.3 Regional Deployment

```yaml
# fly.toml
[env]
  PRIMARY_REGION = "iad"

[[services]]
  internal_port = 8000
  
  [[services.ports]]
    handlers = ["http"]
    port = 80
    
  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[mounts]
  source = "data"
  destination = "/data"
```

---

## 🗓️ Implementation Timeline

### Month 1 (Weeks 1-4)
- Week 1-2: ✅ Phase 1 Complete
- Week 3: Phase 2 - Background worker setup
- Week 4: Phase 2 - Emotion classification

### Month 2 (Weeks 5-8)
- Week 5-6: Phase 3 - Authentication
- Week 7-8: Phase 4 - Insights API

### Month 3 (Weeks 9-12)
- Week 9-10: Phase 5 - Premium features
- Week 11-12: Phase 6 - Optimization

### Ongoing
- Monitoring & alerting
- Performance tuning
- User feedback integration
- Security audits

---

## 📊 Success Metrics

### Technical
- P95 latency < 2s
- Uptime > 99.9%
- Error rate < 0.1%
- Cost per vent < $0.01

### Business
- DAU growth > 10% week-over-week
- Conversion to sign-in > 20%
- Premium conversion > 5%
- Retention (7-day) > 40%

### Privacy
- Zero content breaches
- PII scrubbing accuracy > 99%
- GDPR compliance
- User trust score > 4.5/5

---

## 🔐 Security Considerations

### Each Phase
- [ ] Security review before deployment
- [ ] Penetration testing
- [ ] Dependency audit
- [ ] Access control review

### Data Protection
- [ ] Encryption at rest
- [ ] Encryption in transit
- [ ] Key rotation policy
- [ ] Backup encryption

### Compliance
- [ ] GDPR compliance
- [ ] CCPA compliance
- [ ] SOC 2 preparation
- [ ] Privacy policy updates

---

## 📝 Documentation Updates

### Per Phase
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Runbooks
- [ ] Incident response plans

### User-Facing
- [ ] Privacy policy
- [ ] Terms of service
- [ ] FAQ updates
- [ ] Help documentation

---

## 🚀 Getting Started with Phase 2

### Prerequisites
1. Phase 1 deployed and stable
2. PostgreSQL database provisioned
3. Redis queue configured
4. Monitoring in place

### First Steps
```bash
# 1. Install new dependencies
pip install sqlalchemy asyncpg alembic rq

# 2. Initialize database
alembic init migrations
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head

# 3. Start worker
rq worker ventvault-queue

# 4. Update main.py to enqueue tasks
# See Phase 2 implementation details above
```

---

## 📞 Questions?

- Architecture decisions: See `IMPLEMENTATION_SUMMARY.md`
- Current status: See `PROJECT_STATUS.md`
- Setup help: See `SETUP.md`
- Testing: See `TESTING.md`

---

**Document Version:** 1.0
**Last Updated:** December 19, 2025
**Next Review:** After Phase 2 completion
