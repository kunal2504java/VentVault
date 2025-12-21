"""
Clerk Authentication Service for VentVault

Verifies Clerk JWT tokens and extracts user information.
Supports session upgrade from anonymous to authenticated.
"""

import httpx
import jwt
from jwt import PyJWKClient
from typing import Optional
from pydantic import BaseModel
import logging
from functools import lru_cache
import os

logger = logging.getLogger(__name__)


class ClerkUser(BaseModel):
    """Authenticated user from Clerk"""
    user_id: str
    email: Optional[str] = None
    tier: str = "signed_in"


class ClerkAuthService:
    """
    Clerk JWT verification service.
    
    Verifies tokens using Clerk's JWKS endpoint.
    """
    
    def __init__(self, clerk_publishable_key: Optional[str] = None):
        self.publishable_key = clerk_publishable_key or os.getenv("CLERK_PUBLISHABLE_KEY", "")
        self._jwks_client: Optional[PyJWKClient] = None
        self._issuer: Optional[str] = None
        
        # Extract Clerk instance ID from publishable key
        if self.publishable_key.startswith("pk_"):
            # Format: pk_test_xxx or pk_live_xxx
            parts = self.publishable_key.split("_")
            if len(parts) >= 3:
                # The instance ID is encoded in the key
                self._setup_jwks()
    
    def _setup_jwks(self):
        """Setup JWKS client for token verification"""
        try:
            # Clerk JWKS URL format
            # For development: https://<instance>.clerk.accounts.dev/.well-known/jwks.json
            # We'll use the frontend URL approach
            clerk_frontend_api = os.getenv("CLERK_FRONTEND_API", "")
            
            if clerk_frontend_api:
                jwks_url = f"{clerk_frontend_api}/.well-known/jwks.json"
                self._jwks_client = PyJWKClient(jwks_url)
                self._issuer = clerk_frontend_api
                logger.info(f"Clerk JWKS client initialized: {jwks_url}")
        except Exception as e:
            logger.warning(f"Failed to setup Clerk JWKS: {e}")
    
    async def verify_token(self, token: str) -> Optional[ClerkUser]:
        """
        Verify Clerk JWT token and extract user info.
        
        Args:
            token: JWT token from Authorization header
            
        Returns:
            ClerkUser if valid, None otherwise
        """
        if not token:
            return None
        
        # Remove "Bearer " prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
        
        try:
            # If JWKS client is set up, verify properly
            if self._jwks_client:
                signing_key = self._jwks_client.get_signing_key_from_jwt(token)
                
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    issuer=self._issuer,
                    options={"verify_aud": False}  # Clerk doesn't always set aud
                )
                
                user_id = payload.get("sub")
                if not user_id:
                    return None
                
                return ClerkUser(
                    user_id=user_id,
                    email=payload.get("email"),
                    tier=self._get_tier_from_metadata(payload)
                )
            else:
                # Fallback: decode without verification (development only)
                # In production, JWKS should always be configured
                payload = jwt.decode(token, options={"verify_signature": False})
                
                user_id = payload.get("sub")
                if not user_id:
                    return None
                
                logger.warning("Token decoded without verification - configure CLERK_FRONTEND_API for production")
                
                return ClerkUser(
                    user_id=user_id,
                    email=payload.get("email"),
                    tier=self._get_tier_from_metadata(payload)
                )
                
        except jwt.ExpiredSignatureError:
            logger.debug("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.debug(f"Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None
    
    def _get_tier_from_metadata(self, payload: dict) -> str:
        """Extract user tier from Clerk metadata"""
        # Check public metadata for subscription tier
        public_metadata = payload.get("public_metadata", {})
        
        if public_metadata.get("premium"):
            return "premium"
        
        # Default to signed_in tier
        return "signed_in"
    
    def is_configured(self) -> bool:
        """Check if Clerk is properly configured"""
        return bool(self.publishable_key)


# Singleton instance
_auth_service: Optional[ClerkAuthService] = None


def get_auth_service() -> ClerkAuthService:
    """Get or create auth service singleton"""
    global _auth_service
    if _auth_service is None:
        _auth_service = ClerkAuthService()
    return _auth_service
