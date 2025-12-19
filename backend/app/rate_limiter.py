import redis.asyncio as redis
from typing import Optional, Literal
import hashlib
import logging

logger = logging.getLogger(__name__)


class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded"""
    def __init__(self, limit: int, reset_seconds: int):
        self.limit = limit
        self.reset_seconds = reset_seconds
        super().__init__(f"Rate limit of {limit} exceeded. Resets in {reset_seconds}s")


class RateLimiter:
    """
    Anonymous-safe rate limiting using Redis.
    
    Features:
    - Device fingerprinting for anonymous users
    - User ID based limiting for authenticated users
    - Sliding window rate limiting
    - Graceful degradation on Redis failure
    """
    
    # Rate limit tiers
    TIER_ANONYMOUS = "anonymous"
    TIER_SIGNED_IN = "signed_in"
    TIER_PREMIUM = "premium"
    
    def __init__(
        self, 
        redis_client: redis.Redis, 
        anon_limit: int = 2,
        signed_in_limit: int = 10,
        premium_limit: int = 100,
        window_seconds: int = 86400  # 24 hours
    ):
        self.redis = redis_client
        self.limits = {
            self.TIER_ANONYMOUS: anon_limit,
            self.TIER_SIGNED_IN: signed_in_limit,
            self.TIER_PREMIUM: premium_limit,
        }
        self.window_seconds = window_seconds
    
    @staticmethod
    def generate_device_hash(ip: str, user_agent: str) -> str:
        """
        Generate anonymous device identifier.
        Uses SHA-256 for consistent hashing.
        """
        # Normalize inputs
        ip = ip.strip().lower() if ip else "unknown"
        user_agent = user_agent.strip()[:200] if user_agent else "unknown"
        
        combined = f"{ip}:{user_agent}"
        return hashlib.sha256(combined.encode()).hexdigest()[:16]
    
    def _get_key_and_limit(
        self, 
        ip: str, 
        user_agent: str, 
        user_id: Optional[str] = None,
        tier: Optional[str] = None
    ) -> tuple[str, int]:
        """Determine rate limit key and limit based on user type"""
        
        if user_id:
            # Authenticated user
            actual_tier = tier or self.TIER_SIGNED_IN
            key = f"rate:{actual_tier}:{user_id}"
            limit = self.limits.get(actual_tier, self.limits[self.TIER_SIGNED_IN])
        else:
            # Anonymous user
            device_hash = self.generate_device_hash(ip, user_agent)
            key = f"rate:{self.TIER_ANONYMOUS}:{device_hash}"
            limit = self.limits[self.TIER_ANONYMOUS]
        
        return key, limit
    
    async def check_limit(
        self, 
        ip: str, 
        user_agent: str, 
        user_id: Optional[str] = None,
        tier: Optional[str] = None
    ) -> tuple[bool, int, int]:
        """
        Check if request is within rate limit.
        
        Args:
            ip: Client IP address
            user_agent: Client user agent string
            user_id: Optional authenticated user ID
            tier: Optional tier override (anonymous, signed_in, premium)
            
        Returns:
            Tuple of (is_allowed, remaining_count, reset_seconds)
        """
        key, limit = self._get_key_and_limit(ip, user_agent, user_id, tier)
        
        try:
            # Get current count and TTL atomically
            pipe = self.redis.pipeline()
            pipe.get(key)
            pipe.ttl(key)
            results = await pipe.execute()
            
            current = int(results[0]) if results[0] else 0
            ttl = max(results[1], 0) if results[1] and results[1] > 0 else self.window_seconds
            
            # Check limit
            if current >= limit:
                logger.info(f"Rate limit exceeded for key: {key[:20]}...")
                return False, 0, ttl
            
            # Increment with expiry
            pipe = self.redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, self.window_seconds)
            await pipe.execute()
            
            remaining = limit - current - 1
            return True, remaining, ttl
            
        except redis.RedisError as e:
            # Graceful degradation: allow request on Redis failure
            logger.error(f"Redis error in rate limiter: {e}")
            return True, limit - 1, self.window_seconds
    
    async def get_usage(
        self, 
        ip: str, 
        user_agent: str, 
        user_id: Optional[str] = None,
        tier: Optional[str] = None
    ) -> dict:
        """
        Get current usage stats without incrementing.
        
        Returns:
            Dict with usage information
        """
        key, limit = self._get_key_and_limit(ip, user_agent, user_id, tier)
        
        try:
            pipe = self.redis.pipeline()
            pipe.get(key)
            pipe.ttl(key)
            results = await pipe.execute()
            
            current = int(results[0]) if results[0] else 0
            ttl = max(results[1], 0) if results[1] and results[1] > 0 else self.window_seconds
            
            return {
                "used": current,
                "limit": limit,
                "remaining": max(0, limit - current),
                "reset_seconds": ttl,
                "tier": tier or (self.TIER_SIGNED_IN if user_id else self.TIER_ANONYMOUS)
            }
            
        except redis.RedisError as e:
            logger.error(f"Redis error getting usage: {e}")
            return {
                "used": 0,
                "limit": limit,
                "remaining": limit,
                "reset_seconds": self.window_seconds,
                "tier": "unknown"
            }
    
    async def reset_limit(
        self, 
        ip: str, 
        user_agent: str, 
        user_id: Optional[str] = None,
        tier: Optional[str] = None
    ) -> bool:
        """
        Reset rate limit for a user (admin function).
        
        Returns:
            True if reset successful
        """
        key, _ = self._get_key_and_limit(ip, user_agent, user_id, tier)
        
        try:
            await self.redis.delete(key)
            logger.info(f"Rate limit reset for key: {key[:20]}...")
            return True
        except redis.RedisError as e:
            logger.error(f"Redis error resetting limit: {e}")
            return False
