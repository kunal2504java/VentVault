"""
Analytics service for VentVault.
Handles anonymous analytics collection and aggregation.
Privacy-first: No raw content is ever stored.
"""

import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db_models import (
    AnonymousUser, VentSession, VentAnalytics, 
    AggregateAnalytics, EmotionCategory
)

logger = logging.getLogger(__name__)


class AnalyticsService:
    """
    Service for collecting and querying anonymous analytics.
    """
    
    # Simple emotion keywords for basic classification
    EMOTION_KEYWORDS = {
        EmotionCategory.SADNESS: ["sad", "depressed", "crying", "tears", "heartbroken", "miserable", "unhappy"],
        EmotionCategory.ANXIETY: ["anxious", "worried", "panic", "nervous", "scared", "fear", "terrified"],
        EmotionCategory.ANGER: ["angry", "furious", "mad", "rage", "hate", "pissed", "frustrated"],
        EmotionCategory.LONELINESS: ["lonely", "alone", "isolated", "nobody", "no one", "abandoned"],
        EmotionCategory.STRESS: ["stressed", "overwhelmed", "pressure", "exhausted", "burnout", "tired"],
        EmotionCategory.GRIEF: ["grief", "loss", "died", "death", "mourning", "miss them", "passed away"],
        EmotionCategory.CONFUSION: ["confused", "lost", "don't know", "uncertain", "unsure", "what to do"],
        EmotionCategory.HOPELESSNESS: ["hopeless", "pointless", "give up", "no point", "never", "can't anymore"],
        EmotionCategory.FRUSTRATION: ["frustrated", "stuck", "nothing works", "tried everything", "unfair"],
        EmotionCategory.FEAR: ["afraid", "terrified", "scared", "fear", "nightmare", "dread"],
    }
    
    @staticmethod
    def create_fingerprint_hash(ip: str, user_agent: str) -> str:
        """
        Create a one-way hash from IP and user agent.
        Cannot be reversed to identify the user.
        """
        # Add salt for extra security
        salt = "ventvault_anon_2024"
        data = f"{salt}:{ip}:{user_agent}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    @staticmethod
    def hash_ip(ip: str) -> str:
        """Hash IP address for audit logging"""
        salt = "ventvault_ip_audit"
        return hashlib.sha256(f"{salt}:{ip}".encode()).hexdigest()
    
    @staticmethod
    def detect_emotion(content: str) -> tuple[Optional[EmotionCategory], float]:
        """
        Simple keyword-based emotion detection.
        Returns (emotion_category, intensity).
        
        Note: This is a basic implementation. In production,
        you'd use a proper NLP model.
        """
        content_lower = content.lower()
        
        emotion_scores = {}
        for emotion, keywords in AnalyticsService.EMOTION_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in content_lower)
            if score > 0:
                emotion_scores[emotion] = score
        
        if not emotion_scores:
            return EmotionCategory.OTHER, 0.5
        
        # Get highest scoring emotion
        top_emotion = max(emotion_scores, key=emotion_scores.get)
        max_score = emotion_scores[top_emotion]
        
        # Calculate intensity (0.3 to 1.0 based on keyword matches)
        intensity = min(0.3 + (max_score * 0.15), 1.0)
        
        return top_emotion, intensity
    
    async def get_or_create_anonymous_user(
        self, 
        db: AsyncSession, 
        ip: str, 
        user_agent: str
    ) -> AnonymousUser:
        """Get existing anonymous user or create new one"""
        fingerprint_hash = self.create_fingerprint_hash(ip, user_agent)
        
        # Try to find existing user
        result = await db.execute(
            select(AnonymousUser).where(
                AnonymousUser.fingerprint_hash == fingerprint_hash
            )
        )
        user = result.scalar_one_or_none()
        
        if user:
            # Update last seen
            user.last_seen_at = datetime.now(timezone.utc)
            return user
        
        # Create new anonymous user
        user = AnonymousUser(fingerprint_hash=fingerprint_hash)
        db.add(user)
        await db.flush()
        
        logger.info(f"Created new anonymous user: {user.id}")
        return user
    
    async def create_session(
        self, 
        db: AsyncSession, 
        anonymous_user_id: UUID
    ) -> VentSession:
        """Create a new vent session"""
        session = VentSession(anonymous_user_id=anonymous_user_id)
        db.add(session)
        await db.flush()
        return session
    
    async def record_vent_analytics(
        self,
        db: AsyncSession,
        session_id: UUID,
        content: str,
        mode: str,
        response_latency_ms: int,
        pii_detected: bool,
        continued_conversation: bool = False
    ) -> VentAnalytics:
        """
        Record analytics for a vent interaction.
        Content is analyzed but NOT stored.
        """
        # Detect emotion from content (content is not stored)
        emotion, intensity = self.detect_emotion(content)
        word_count = len(content.split())
        
        analytics = VentAnalytics(
            session_id=session_id,
            word_count=word_count,
            emotion_category=emotion,
            emotion_intensity=intensity,
            mode=mode,
            response_latency_ms=response_latency_ms,
            pii_detected=pii_detected,
            continued_conversation=continued_conversation
        )
        db.add(analytics)
        
        # Update session counters
        result = await db.execute(
            select(VentSession).where(VentSession.id == session_id)
        )
        session = result.scalar_one_or_none()
        if session:
            session.message_count += 1
            session.total_word_count += word_count
        
        await db.flush()
        
        logger.info(
            f"Recorded analytics: emotion={emotion.value}, "
            f"intensity={intensity:.2f}, words={word_count}"
        )
        
        return analytics
    
    async def get_aggregate_stats(
        self,
        db: AsyncSession,
        days: int = 30
    ) -> dict:
        """Get aggregate statistics for dashboard"""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Total vents
        total_result = await db.execute(
            select(func.count(VentAnalytics.id)).where(
                VentAnalytics.created_at >= cutoff
            )
        )
        total_vents = total_result.scalar() or 0
        
        # Unique users
        users_result = await db.execute(
            select(func.count(func.distinct(VentSession.anonymous_user_id))).where(
                VentSession.started_at >= cutoff
            )
        )
        unique_users = users_result.scalar() or 0
        
        # Emotion distribution
        emotion_result = await db.execute(
            select(
                VentAnalytics.emotion_category,
                func.count(VentAnalytics.id)
            ).where(
                VentAnalytics.created_at >= cutoff
            ).group_by(VentAnalytics.emotion_category)
        )
        emotion_distribution = {
            row[0].value if row[0] else "unknown": row[1] 
            for row in emotion_result.all()
        }
        
        # Average metrics
        avg_result = await db.execute(
            select(
                func.avg(VentAnalytics.word_count),
                func.avg(VentAnalytics.response_latency_ms),
                func.avg(VentAnalytics.emotion_intensity)
            ).where(VentAnalytics.created_at >= cutoff)
        )
        avg_row = avg_result.one()
        
        return {
            "period_days": days,
            "total_vents": total_vents,
            "unique_users": unique_users,
            "avg_word_count": round(avg_row[0] or 0, 1),
            "avg_response_latency_ms": round(avg_row[1] or 0, 0),
            "avg_emotion_intensity": round(avg_row[2] or 0, 2),
            "emotion_distribution": emotion_distribution
        }
    
    async def compute_daily_aggregates(self, db: AsyncSession):
        """
        Compute and store daily aggregate analytics.
        Run this as a scheduled job.
        """
        yesterday = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        ) - timedelta(days=1)
        today = yesterday + timedelta(days=1)
        
        # Check if already computed
        existing = await db.execute(
            select(AggregateAnalytics).where(
                and_(
                    AggregateAnalytics.date == yesterday,
                    AggregateAnalytics.granularity == "daily"
                )
            )
        )
        if existing.scalar_one_or_none():
            logger.info(f"Daily aggregates already computed for {yesterday.date()}")
            return
        
        # Compute aggregates
        stats = await self.get_aggregate_stats(db, days=1)
        
        # Hour distribution
        hour_result = await db.execute(
            select(
                func.extract('hour', VentAnalytics.created_at),
                func.count(VentAnalytics.id)
            ).where(
                and_(
                    VentAnalytics.created_at >= yesterday,
                    VentAnalytics.created_at < today
                )
            ).group_by(func.extract('hour', VentAnalytics.created_at))
        )
        hour_distribution = {
            str(int(row[0])): row[1] for row in hour_result.all()
        }
        
        aggregate = AggregateAnalytics(
            date=yesterday,
            granularity="daily",
            total_vents=stats["total_vents"],
            unique_users=stats["unique_users"],
            avg_word_count=stats["avg_word_count"],
            avg_response_latency_ms=stats["avg_response_latency_ms"],
            emotion_distribution=stats["emotion_distribution"],
            hour_distribution=hour_distribution
        )
        db.add(aggregate)
        await db.flush()
        
        logger.info(f"Computed daily aggregates for {yesterday.date()}")
