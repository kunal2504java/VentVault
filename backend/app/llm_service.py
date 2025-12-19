from typing import AsyncGenerator, Optional
import openai
from anthropic import AsyncAnthropic
from datetime import datetime
import logging
import asyncio

from app.config import Settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Base exception for LLM errors"""
    pass


class LLMTimeoutError(LLMError):
    """Raised when LLM request times out"""
    pass


class LLMService:
    """
    Streaming LLM service - optimized for time-to-first-token.
    
    Features:
    - Multi-provider support (OpenAI, Anthropic)
    - Streaming responses
    - Timeout handling
    - Fallback responses
    - Context-aware prompting
    """
    
    # Cached system prompt (loaded at startup)
    SYSTEM_PROMPT = """You are a compassionate listener for VentVault, a safe space for emotional expression.

Your role:
- Validate their feelings without judgment
- Respond with empathy and understanding
- Keep responses brief (2-3 sentences max)
- Never give medical advice
- Never ask questions
- Never suggest actions
- Never mention that you're an AI

Tone: Warm, supportive, human.

Important: If the message seems like a crisis or mentions self-harm, gently acknowledge their pain and remind them that support is available."""
    
    # Fallback response when LLM fails
    FALLBACK_RESPONSE = "I hear you. What you're feeling matters, and it's okay to let it out. You're not alone in this."
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.provider = settings.llm_provider
        self.timeout = settings.llm_timeout
        
        # Initialize clients
        self._openai_client: Optional[openai.AsyncOpenAI] = None
        self._anthropic_client: Optional[AsyncAnthropic] = None
        
        if self.provider == "openai" or settings.openai_api_key:
            self._openai_client = openai.AsyncOpenAI(
                api_key=settings.openai_api_key,
                timeout=settings.llm_timeout
            )
            
        if self.provider == "anthropic" or settings.anthropic_api_key:
            self._anthropic_client = AsyncAnthropic(
                api_key=settings.anthropic_api_key,
                timeout=settings.llm_timeout
            )
    
    def _build_context(self, mode: str) -> str:
        """Build dynamic context based on time and mode"""
        hour = datetime.now().hour
        
        if hour >= 22 or hour < 6:
            time_context = "late night"
        elif hour >= 6 and hour < 12:
            time_context = "morning"
        elif hour >= 12 and hour < 17:
            time_context = "afternoon"
        else:
            time_context = "evening"
        
        mode_context = "voice recording" if mode == "voice" else "written message"
        
        return f"Context: {time_context}, {mode_context}. Respond naturally and briefly."
    
    async def stream_response(
        self, 
        content: str, 
        mode: str = "text"
    ) -> AsyncGenerator[str, None]:
        """
        Stream LLM response token by token.
        
        Args:
            content: User's vent content (already PII-scrubbed)
            mode: Vent mode ('text' or 'voice')
            
        Yields:
            Response tokens as they arrive
        """
        context = self._build_context(mode)
        
        try:
            if self.provider == "openai":
                async for chunk in self._stream_openai(content, context):
                    yield chunk
            elif self.provider == "anthropic":
                async for chunk in self._stream_anthropic(content, context):
                    yield chunk
            else:
                # Fallback for unknown provider
                yield self.FALLBACK_RESPONSE
                
        except asyncio.TimeoutError:
            logger.error("LLM request timed out")
            yield self.FALLBACK_RESPONSE
            
        except Exception as e:
            logger.error(f"LLM error: {type(e).__name__}: {str(e)}")
            yield self.FALLBACK_RESPONSE
    
    async def _stream_openai(
        self, 
        content: str, 
        context: str
    ) -> AsyncGenerator[str, None]:
        """Stream from OpenAI"""
        if not self._openai_client:
            raise LLMError("OpenAI client not initialized")
        
        try:
            stream = await asyncio.wait_for(
                self._openai_client.chat.completions.create(
                    model=self.settings.llm_model_openai,
                    messages=[
                        {
                            "role": "system", 
                            "content": f"{self.SYSTEM_PROMPT}\n\n{context}"
                        },
                        {"role": "user", "content": content}
                    ],
                    max_tokens=self.settings.max_output_tokens,
                    temperature=self.settings.llm_temperature,
                    stream=True
                ),
                timeout=self.timeout
            )
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except asyncio.TimeoutError:
            raise LLMTimeoutError("OpenAI request timed out")
    
    async def _stream_anthropic(
        self, 
        content: str, 
        context: str
    ) -> AsyncGenerator[str, None]:
        """Stream from Anthropic"""
        if not self._anthropic_client:
            raise LLMError("Anthropic client not initialized")
        
        try:
            async with self._anthropic_client.messages.stream(
                model=self.settings.llm_model_anthropic,
                max_tokens=self.settings.max_output_tokens,
                temperature=self.settings.llm_temperature,
                system=f"{self.SYSTEM_PROMPT}\n\n{context}",
                messages=[{"role": "user", "content": content}]
            ) as stream:
                async for text in stream.text_stream:
                    yield text
                    
        except asyncio.TimeoutError:
            raise LLMTimeoutError("Anthropic request timed out")
    
    async def get_response(
        self, 
        content: str, 
        mode: str = "text"
    ) -> str:
        """
        Get complete LLM response (non-streaming).
        Useful for background processing.
        
        Args:
            content: User's vent content
            mode: Vent mode
            
        Returns:
            Complete response string
        """
        chunks = []
        async for chunk in self.stream_response(content, mode):
            chunks.append(chunk)
        return "".join(chunks)
    
    def is_healthy(self) -> bool:
        """Check if LLM service is properly configured"""
        if self.provider == "openai":
            return self._openai_client is not None and bool(self.settings.openai_api_key)
        elif self.provider == "anthropic":
            return self._anthropic_client is not None and bool(self.settings.anthropic_api_key)
        return False
