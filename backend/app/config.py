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
    llm_provider: Literal["openai", "anthropic"] = Field(
        default="openai", 
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
    
    # Redis Configuration
    redis_url: str = Field(
        default="redis://localhost:6379", 
        description="Redis connection URL"
    )
    redis_pool_size: int = Field(default=10, description="Redis connection pool size")
    redis_timeout: float = Field(default=5.0, description="Redis operation timeout")
    
    # Rate Limiting
    anon_daily_limit: int = Field(default=2, ge=1, description="Anonymous user daily limit")
    signed_in_daily_limit: int = Field(default=10, ge=1, description="Signed-in user daily limit")
    premium_daily_limit: int = Field(default=100, ge=1, description="Premium user daily limit")
    
    # Environment
    environment: Literal["development", "staging", "production"] = Field(
        default="development"
    )
    debug: bool = Field(default=False, description="Enable debug mode")
    
    # Performance Tuning
    max_output_tokens: int = Field(default=120, ge=50, le=500)
    llm_temperature: float = Field(default=0.6, ge=0.0, le=1.0)
    llm_timeout: float = Field(default=10.0, description="LLM request timeout in seconds")
    
    # CORS Configuration
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        description="Allowed CORS origins"
    )
    
    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    
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
        return True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
