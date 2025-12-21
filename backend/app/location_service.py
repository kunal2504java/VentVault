"""
Location service for VentVault.
Provides consent-based IP geolocation.
Only stores approximate (city-level) location with explicit user consent.
"""

import httpx
import logging
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db_models import UserLocation, UserConsent, ConsentType, AnonymousUser
from app.config import get_settings

logger = logging.getLogger(__name__)


class LocationData:
    """Location data container"""
    def __init__(
        self,
        country_code: Optional[str] = None,
        country_name: Optional[str] = None,
        region: Optional[str] = None,
        city: Optional[str] = None,
        timezone: Optional[str] = None
    ):
        self.country_code = country_code
        self.country_name = country_name
        self.region = region
        self.city = city
        self.timezone = timezone
    
    def to_dict(self) -> dict:
        return {
            "country_code": self.country_code,
            "country_name": self.country_name,
            "region": self.region,
            "city": self.city,
            "timezone": self.timezone
        }


class LocationService:
    """
    Service for IP-based geolocation.
    Uses free ip-api.com service (no API key needed for basic use).
    
    Privacy considerations:
    - Only stores approximate location (city-level)
    - Never stores IP addresses
    - Requires explicit user consent
    - User can revoke consent and delete location data
    """
    
    # Free IP geolocation API (no key required, 45 requests/minute limit)
    GEOIP_API_URL = "http://ip-api.com/json/{ip}?fields=status,country,countryCode,region,regionName,city,timezone"
    
    # Fallback API (ipapi.co - 1000 requests/day free)
    FALLBACK_API_URL = "https://ipapi.co/{ip}/json/"
    
    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=5.0)
        return self._client
    
    async def close(self):
        """Close HTTP client"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
    
    async def lookup_ip(self, ip: str) -> Optional[LocationData]:
        """
        Look up approximate location from IP address.
        Returns city-level location data.
        """
        # Skip private/local IPs
        if ip in ("127.0.0.1", "localhost", "::1") or ip.startswith("192.168.") or ip.startswith("10."):
            logger.debug(f"Skipping geolocation for local IP: {ip}")
            return None
        
        try:
            client = await self._get_client()
            
            # Try primary API
            response = await client.get(self.GEOIP_API_URL.format(ip=ip))
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("status") == "success":
                    return LocationData(
                        country_code=data.get("countryCode"),
                        country_name=data.get("country"),
                        region=data.get("regionName"),
                        city=data.get("city"),
                        timezone=data.get("timezone")
                    )
            
            # Try fallback API
            logger.debug("Primary geolocation failed, trying fallback")
            response = await client.get(self.FALLBACK_API_URL.format(ip=ip))
            
            if response.status_code == 200:
                data = response.json()
                
                if not data.get("error"):
                    return LocationData(
                        country_code=data.get("country_code"),
                        country_name=data.get("country_name"),
                        region=data.get("region"),
                        city=data.get("city"),
                        timezone=data.get("timezone")
                    )
            
            logger.warning(f"Geolocation lookup failed for IP")
            return None
            
        except Exception as e:
            logger.error(f"Geolocation error: {type(e).__name__}: {str(e)}")
            return None
    
    async def has_location_consent(
        self, 
        db: AsyncSession, 
        anonymous_user_id: UUID
    ) -> bool:
        """Check if user has granted location consent"""
        result = await db.execute(
            select(UserConsent).where(
                UserConsent.anonymous_user_id == anonymous_user_id,
                UserConsent.consent_type == ConsentType.LOCATION,
                UserConsent.granted == True,
                UserConsent.revoked_at.is_(None)
            )
        )
        return result.scalar_one_or_none() is not None
    
    async def grant_location_consent(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID,
        ip: str,
        ip_hash: str
    ) -> UserConsent:
        """
        Grant location consent and store location data.
        """
        # Check for existing consent
        result = await db.execute(
            select(UserConsent).where(
                UserConsent.anonymous_user_id == anonymous_user_id,
                UserConsent.consent_type == ConsentType.LOCATION
            )
        )
        consent = result.scalar_one_or_none()
        
        if consent:
            # Update existing consent
            consent.granted = True
            consent.granted_at = datetime.now(timezone.utc)
            consent.revoked_at = None
            consent.ip_address_hash = ip_hash
        else:
            # Create new consent
            consent = UserConsent(
                anonymous_user_id=anonymous_user_id,
                consent_type=ConsentType.LOCATION,
                granted=True,
                granted_at=datetime.now(timezone.utc),
                ip_address_hash=ip_hash
            )
            db.add(consent)
        
        await db.flush()
        
        # Look up and store location
        location_data = await self.lookup_ip(ip)
        if location_data:
            await self.store_location(db, anonymous_user_id, location_data)
        
        logger.info(f"Location consent granted for user {anonymous_user_id}")
        return consent
    
    async def revoke_location_consent(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID
    ) -> bool:
        """
        Revoke location consent and delete stored location.
        """
        # Update consent record
        result = await db.execute(
            select(UserConsent).where(
                UserConsent.anonymous_user_id == anonymous_user_id,
                UserConsent.consent_type == ConsentType.LOCATION
            )
        )
        consent = result.scalar_one_or_none()
        
        if consent:
            consent.granted = False
            consent.revoked_at = datetime.now(timezone.utc)
        
        # Delete location data
        result = await db.execute(
            select(UserLocation).where(
                UserLocation.anonymous_user_id == anonymous_user_id
            )
        )
        location = result.scalar_one_or_none()
        
        if location:
            await db.delete(location)
        
        await db.flush()
        
        logger.info(f"Location consent revoked for user {anonymous_user_id}")
        return True
    
    async def store_location(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID,
        location_data: LocationData
    ) -> UserLocation:
        """Store or update user location"""
        result = await db.execute(
            select(UserLocation).where(
                UserLocation.anonymous_user_id == anonymous_user_id
            )
        )
        location = result.scalar_one_or_none()
        
        if location:
            # Update existing
            location.country_code = location_data.country_code
            location.country_name = location_data.country_name
            location.region = location_data.region
            location.city = location_data.city
            location.timezone = location_data.timezone
            location.updated_at = datetime.now(timezone.utc)
        else:
            # Create new
            location = UserLocation(
                anonymous_user_id=anonymous_user_id,
                country_code=location_data.country_code,
                country_name=location_data.country_name,
                region=location_data.region,
                city=location_data.city,
                timezone=location_data.timezone
            )
            db.add(location)
        
        await db.flush()
        return location
    
    async def get_user_location(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID
    ) -> Optional[dict]:
        """Get stored location for user (if consented)"""
        # Check consent first
        if not await self.has_location_consent(db, anonymous_user_id):
            return None
        
        result = await db.execute(
            select(UserLocation).where(
                UserLocation.anonymous_user_id == anonymous_user_id
            )
        )
        location = result.scalar_one_or_none()
        
        if not location:
            return None
        
        return {
            "country_code": location.country_code,
            "country_name": location.country_name,
            "region": location.region,
            "city": location.city,
            "timezone": location.timezone
        }
