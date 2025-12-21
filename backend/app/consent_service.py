"""
Consent management service for VentVault.
Handles all user consent operations for GDPR/CCPA compliance.
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db_models import UserConsent, ConsentType, AnonymousUser

logger = logging.getLogger(__name__)


class ConsentService:
    """
    Service for managing user consent.
    Ensures compliance with privacy regulations.
    """
    
    async def get_user_consents(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID
    ) -> dict[str, bool]:
        """Get all consent statuses for a user"""
        result = await db.execute(
            select(UserConsent).where(
                UserConsent.anonymous_user_id == anonymous_user_id
            )
        )
        consents = result.scalars().all()
        
        # Build consent map with defaults
        consent_map = {ct.value: False for ct in ConsentType}
        
        for consent in consents:
            if consent.granted and consent.revoked_at is None:
                consent_map[consent.consent_type.value] = True
        
        return consent_map
    
    async def has_consent(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID,
        consent_type: ConsentType
    ) -> bool:
        """Check if user has granted specific consent"""
        result = await db.execute(
            select(UserConsent).where(
                UserConsent.anonymous_user_id == anonymous_user_id,
                UserConsent.consent_type == consent_type,
                UserConsent.granted == True,
                UserConsent.revoked_at.is_(None)
            )
        )
        return result.scalar_one_or_none() is not None
    
    async def grant_consent(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID,
        consent_type: ConsentType,
        ip_hash: Optional[str] = None
    ) -> UserConsent:
        """Grant consent for a specific type"""
        # Check for existing consent record
        result = await db.execute(
            select(UserConsent).where(
                UserConsent.anonymous_user_id == anonymous_user_id,
                UserConsent.consent_type == consent_type
            )
        )
        consent = result.scalar_one_or_none()
        
        if consent:
            # Update existing
            consent.granted = True
            consent.granted_at = datetime.now(timezone.utc)
            consent.revoked_at = None
            if ip_hash:
                consent.ip_address_hash = ip_hash
        else:
            # Create new
            consent = UserConsent(
                anonymous_user_id=anonymous_user_id,
                consent_type=consent_type,
                granted=True,
                granted_at=datetime.now(timezone.utc),
                ip_address_hash=ip_hash
            )
            db.add(consent)
        
        await db.flush()
        
        logger.info(f"Consent granted: user={anonymous_user_id}, type={consent_type.value}")
        return consent
    
    async def revoke_consent(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID,
        consent_type: ConsentType
    ) -> bool:
        """Revoke consent for a specific type"""
        result = await db.execute(
            select(UserConsent).where(
                UserConsent.anonymous_user_id == anonymous_user_id,
                UserConsent.consent_type == consent_type
            )
        )
        consent = result.scalar_one_or_none()
        
        if consent:
            consent.granted = False
            consent.revoked_at = datetime.now(timezone.utc)
            await db.flush()
            
            logger.info(f"Consent revoked: user={anonymous_user_id}, type={consent_type.value}")
            return True
        
        return False
    
    async def update_consents(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID,
        consents: dict[str, bool],
        ip_hash: Optional[str] = None
    ) -> dict[str, bool]:
        """Update multiple consents at once"""
        updated = {}
        
        for consent_type_str, granted in consents.items():
            try:
                consent_type = ConsentType(consent_type_str)
            except ValueError:
                logger.warning(f"Unknown consent type: {consent_type_str}")
                continue
            
            if granted:
                await self.grant_consent(db, anonymous_user_id, consent_type, ip_hash)
            else:
                await self.revoke_consent(db, anonymous_user_id, consent_type)
            
            updated[consent_type_str] = granted
        
        return updated
    
    async def delete_all_user_data(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID
    ) -> bool:
        """
        Delete all data for a user (GDPR right to erasure).
        This cascades to all related records.
        """
        result = await db.execute(
            select(AnonymousUser).where(
                AnonymousUser.id == anonymous_user_id
            )
        )
        user = result.scalar_one_or_none()
        
        if user:
            await db.delete(user)
            await db.flush()
            
            logger.info(f"Deleted all data for user: {anonymous_user_id}")
            return True
        
        return False
    
    async def export_user_data(
        self,
        db: AsyncSession,
        anonymous_user_id: UUID
    ) -> dict:
        """
        Export all user data (GDPR right to data portability).
        Returns all stored data for the user.
        """
        from app.db_models import VentSession, VentAnalytics, UserLocation
        
        # Get user
        result = await db.execute(
            select(AnonymousUser).where(
                AnonymousUser.id == anonymous_user_id
            )
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return {}
        
        # Get consents
        consents = await self.get_user_consents(db, anonymous_user_id)
        
        # Get location (if exists)
        location_result = await db.execute(
            select(UserLocation).where(
                UserLocation.anonymous_user_id == anonymous_user_id
            )
        )
        location = location_result.scalar_one_or_none()
        
        # Get sessions with analytics
        sessions_result = await db.execute(
            select(VentSession).where(
                VentSession.anonymous_user_id == anonymous_user_id
            )
        )
        sessions = sessions_result.scalars().all()
        
        sessions_data = []
        for session in sessions:
            analytics_result = await db.execute(
                select(VentAnalytics).where(
                    VentAnalytics.session_id == session.id
                )
            )
            analytics = analytics_result.scalars().all()
            
            sessions_data.append({
                "session_id": str(session.id),
                "started_at": session.started_at.isoformat() if session.started_at else None,
                "ended_at": session.ended_at.isoformat() if session.ended_at else None,
                "message_count": session.message_count,
                "total_word_count": session.total_word_count,
                "analytics": [
                    {
                        "created_at": a.created_at.isoformat() if a.created_at else None,
                        "word_count": a.word_count,
                        "emotion_category": a.emotion_category.value if a.emotion_category else None,
                        "emotion_intensity": a.emotion_intensity,
                        "mode": a.mode,
                        "pii_detected": a.pii_detected,
                        "continued_conversation": a.continued_conversation
                    }
                    for a in analytics
                ]
            })
        
        return {
            "user_id": str(user.id),
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_seen_at": user.last_seen_at.isoformat() if user.last_seen_at else None,
            "consents": consents,
            "location": {
                "country": location.country_name,
                "region": location.region,
                "city": location.city,
                "timezone": location.timezone
            } if location else None,
            "sessions": sessions_data,
            "note": "VentVault never stores the content of your vents. Only anonymous analytics are retained."
        }
