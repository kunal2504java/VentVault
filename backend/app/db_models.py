"""
Database models for VentVault.
Privacy-first design - no raw vent content is ever stored.
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, Index, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid
import enum

from app.database import Base


class ConsentType(str, enum.Enum):
    """Types of user consent"""
    ANALYTICS = "analytics"
    LOCATION = "location"
    SAVE_HISTORY = "save_history"
    MARKETING = "marketing"


class EmotionCategory(str, enum.Enum):
    """Detected emotion categories"""
    SADNESS = "sadness"
    ANXIETY = "anxiety"
    ANGER = "anger"
    LONELINESS = "loneliness"
    STRESS = "stress"
    GRIEF = "grief"
    CONFUSION = "confusion"
    HOPELESSNESS = "hopelessness"
    FRUSTRATION = "frustration"
    FEAR = "fear"
    OTHER = "other"


class AnonymousUser(Base):
    """
    Anonymous user tracking via hashed fingerprint.
    No PII stored - only hashed identifiers.
    """
    __tablename__ = "anonymous_users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fingerprint_hash = Column(String(64), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Consent tracking
    consents = relationship("UserConsent", back_populates="anonymous_user", cascade="all, delete-orphan")
    
    # Location (only if consented)
    location = relationship("UserLocation", back_populates="anonymous_user", uselist=False, cascade="all, delete-orphan")
    
    # Sessions
    sessions = relationship("VentSession", back_populates="anonymous_user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("ix_anonymous_users_created_at", "created_at"),
    )


class UserConsent(Base):
    """
    Tracks user consent for various data collection.
    Required for GDPR/CCPA compliance.
    """
    __tablename__ = "user_consents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anonymous_user_id = Column(UUID(as_uuid=True), ForeignKey("anonymous_users.id", ondelete="CASCADE"), nullable=False)
    consent_type = Column(SQLEnum(ConsentType), nullable=False)
    granted = Column(Boolean, default=False, nullable=False)
    granted_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    ip_address_hash = Column(String(64), nullable=True)  # Hashed for audit
    
    anonymous_user = relationship("AnonymousUser", back_populates="consents")
    
    __table_args__ = (
        Index("ix_user_consents_user_type", "anonymous_user_id", "consent_type", unique=True),
    )


class UserLocation(Base):
    """
    User location data - only stored with explicit consent.
    Stores approximate location (city-level), not precise coordinates.
    """
    __tablename__ = "user_locations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anonymous_user_id = Column(UUID(as_uuid=True), ForeignKey("anonymous_users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Approximate location only (city-level)
    country_code = Column(String(2), nullable=True)
    country_name = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    timezone = Column(String(50), nullable=True)
    
    # Never store precise coordinates or IP
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    anonymous_user = relationship("AnonymousUser", back_populates="location")
    
    __table_args__ = (
        Index("ix_user_locations_country", "country_code"),
        Index("ix_user_locations_city", "city"),
    )


class VentSession(Base):
    """
    A venting session - groups related vent interactions.
    No raw content stored.
    """
    __tablename__ = "vent_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anonymous_user_id = Column(UUID(as_uuid=True), ForeignKey("anonymous_users.id", ondelete="CASCADE"), nullable=False)
    
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime(timezone=True), nullable=True)
    
    # Session metadata (no content)
    message_count = Column(Integer, default=0)
    total_word_count = Column(Integer, default=0)
    
    anonymous_user = relationship("AnonymousUser", back_populates="sessions")
    analytics = relationship("VentAnalytics", back_populates="session", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("ix_vent_sessions_user_started", "anonymous_user_id", "started_at"),
    )


class VentAnalytics(Base):
    """
    Anonymous analytics for each vent interaction.
    NO raw content stored - only derived metrics.
    """
    __tablename__ = "vent_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("vent_sessions.id", ondelete="CASCADE"), nullable=False)
    
    # Timing
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    response_latency_ms = Column(Integer, nullable=True)
    
    # Derived metrics (no content)
    word_count = Column(Integer, default=0)
    emotion_category = Column(SQLEnum(EmotionCategory), nullable=True)
    emotion_intensity = Column(Float, default=0.5)  # 0.0 to 1.0
    
    # Mode
    mode = Column(String(10), default="text")  # text or voice
    
    # Flags
    pii_detected = Column(Boolean, default=False)
    continued_conversation = Column(Boolean, default=False)
    
    session = relationship("VentSession", back_populates="analytics")
    
    __table_args__ = (
        Index("ix_vent_analytics_created", "created_at"),
        Index("ix_vent_analytics_emotion", "emotion_category"),
    )


class AggregateAnalytics(Base):
    """
    Pre-aggregated analytics for dashboards.
    Computed periodically, no individual data.
    """
    __tablename__ = "aggregate_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Time bucket
    date = Column(DateTime(timezone=True), nullable=False)
    granularity = Column(String(10), default="daily")  # hourly, daily, weekly, monthly
    
    # Aggregate metrics
    total_vents = Column(Integer, default=0)
    unique_users = Column(Integer, default=0)
    avg_word_count = Column(Float, default=0)
    avg_response_latency_ms = Column(Float, default=0)
    
    # Emotion distribution (JSON)
    emotion_distribution = Column(JSON, default=dict)
    
    # Location distribution (JSON) - only if users consented
    location_distribution = Column(JSON, default=dict)
    
    # Time of day distribution
    hour_distribution = Column(JSON, default=dict)
    
    __table_args__ = (
        Index("ix_aggregate_date_granularity", "date", "granularity", unique=True),
    )
