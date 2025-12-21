from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    """
    Application settings with validation and defaults.
    All settings can be overridden via environment variables.
    """
    
    # LLM Configuration
    openai_api_key: str = Field(default="", description="OpenAI API key")
    anthropic_api_key: str = Field(default="", description="Anthropic API key")
    google_api_key: str = Field(default="", description="Google Gemini API key")
    llm_provider: Literal["openai", "anthropic", "google"] = Field(
        default="google", 
        description="LLM provider to use"
    )
    llm_model_openai: str = Field(
        default="gpt-4o-mini", 
        description="OpenAI model name"
    )
    llm_model_anthropic: str = Field(
        default="claude-3-haiku-20240307", 
        description="Anthropic model name"
    )
    llm_model_google: str = Field(
        default="gemini-2.5-flash-preview-05-20", 
        description="Google Gemini model name"
    )
    
    # Database Configuration
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/ventvault",
        description="PostgreSQL async connection URL"
    )
    db_pool_size: int = Field(default=10, description="Database connection pool size")
    db_max_overflow: int = Field(default=20, description="Max overflow connections")
    
    # Redis Configuration
    redis_url: str = Field(
        default="redis://localhost:6379", 
        description="Redis connection URL"
    )
    redis_pool_size: int = Field(default=10, description="Redis connection pool size")
    redis_timeout: float = Field(default=5.0, description="Redis operation timeout")
    
    # Rate Limiting
    anon_daily_limit: int = Field(default=10, ge=1, description="Anonymous user daily limit")
    signed_in_daily_limit: int = Field(default=25, ge=1, description="Signed-in user daily limit")
    premium_daily_limit: int = Field(default=100, ge=1, description="Premium user daily limit")
    
    # Environment
    environment: Literal["development", "staging", "production"] = Field(
        default="development"
    )
    debug: bool = Field(default=False, description="Enable debug mode")
    
    # Performance Tuning
    max_output_tokens: int = Field(default=2048, ge=50, le=8192)
    llm_temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    llm_timeout: float = Field(default=30.0, description="LLM request timeout in seconds")
    
    # CORS Configuration
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        description="Allowed CORS origins"
    )
    
    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    
    # Clerk Authentication
    clerk_publishable_key: str = Field(default="", description="Clerk publishable key")
    clerk_secret_key: str = Field(default="", description="Clerk secret key")
    clerk_frontend_api: str = Field(default="", description="Clerk frontend API URL")
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }
    
    def validate_llm_config(self) -> bool:
        """Validate that required LLM API key is present"""
        if self.llm_provider == "openai" and not self.openai_api_key:
            return False
        if self.llm_provider == "anthropic" and not self.anthropic_api_key:
            return False
        if self.llm_provider == "google" and not self.google_api_key:
            return False
        return True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
