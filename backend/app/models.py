from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
from datetime import datetime
from enum import Enum


class VentMode(str, Enum):
    """Supported vent modes"""
    TEXT = "text"
    VOICE = "voice"


class UserTier(str, Enum):
    """User subscription tiers"""
    ANONYMOUS = "anonymous"
    SIGNED_IN = "signed_in"
    PREMIUM = "premium"


class VentRequest(BaseModel):
    """Request model for creating a vent"""
    mode: VentMode = Field(default=VentMode.TEXT, description="Vent input mode")
    content: str = Field(
        ..., 
        min_length=1, 
        max_length=5000,
        description="Vent content (text or voice transcript)"
    )
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate and clean content"""
        # Strip whitespace
        v = v.strip()
        
        # Check for empty content after stripping
        if not v:
            raise ValueError("Content cannot be empty")
        
        return v


class VentResponse(BaseModel):
    """Response model for vent creation"""
    session_id: str = Field(..., description="Unique session identifier")
    remaining_vents: int = Field(..., ge=0, description="Remaining vents for today")
    reset_seconds: int = Field(..., ge=0, description="Seconds until rate limit resets")


class StreamEvent(BaseModel):
    """Model for SSE stream events"""
    event: Literal["token", "done", "error"] = Field(..., description="Event type")
    data: str = Field(default="", description="Event data")


class VentMetadata(BaseModel):
    """
    Metadata extracted from a vent (for future background processing).
    Note: Raw content is NEVER stored.
    """
    user_hash: str = Field(..., description="Anonymous user identifier")
    session_id: str = Field(..., description="Session identifier")
    emotion: Optional[str] = Field(default=None, description="Detected primary emotion")
    theme: Optional[str] = Field(default=None, description="Detected theme/topic")
    intensity: float = Field(default=0.5, ge=0.0, le=1.0, description="Emotional intensity")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    mode: VentMode = Field(default=VentMode.TEXT)
    word_count: int = Field(default=0, ge=0, description="Approximate word count")
    pii_detected: bool = Field(default=False, description="Whether PII was scrubbed")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: Literal["healthy", "degraded", "unhealthy"]
    redis: Literal["connected", "disconnected"]
    llm: Literal["configured", "not_configured"]
    version: str = "1.0.0"
    environment: str


class UsageResponse(BaseModel):
    """Rate limit usage response"""
    used: int = Field(..., ge=0)
    limit: int = Field(..., ge=1)
    remaining: int = Field(..., ge=0)
    reset_seconds: int = Field(..., ge=0)
    tier: str


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
