"""
Quick script to view database contents.
Run: python scripts/view_data.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func
from app.database import init_database, get_db_context
from app.db_models import (
    AnonymousUser, UserConsent, UserLocation,
    VentSession, VentAnalytics, AggregateAnalytics
)


async def view_data():
    await init_database()
    
    async with get_db_context() as db:
        # Count users
        result = await db.execute(select(func.count(AnonymousUser.id)))
        user_count = result.scalar()
        print(f"\n📊 Database Summary")
        print(f"{'='*40}")
        print(f"Anonymous Users: {user_count}")
        
        # Count sessions
        result = await db.execute(select(func.count(VentSession.id)))
        session_count = result.scalar()
        print(f"Vent Sessions: {session_count}")
        
        # Count analytics
        result = await db.execute(select(func.count(VentAnalytics.id)))
        analytics_count = result.scalar()
        print(f"Vent Analytics: {analytics_count}")
        
        # Count consents
        result = await db.execute(select(func.count(UserConsent.id)))
        consent_count = result.scalar()
        print(f"User Consents: {consent_count}")
        
        # Show recent analytics
        if analytics_count > 0:
            print(f"\n📈 Recent Vent Analytics (last 5)")
            print(f"{'='*40}")
            result = await db.execute(
                select(VentAnalytics)
                .order_by(VentAnalytics.created_at.desc())
                .limit(5)
            )
            for a in result.scalars():
                print(f"  - {a.created_at}: {a.emotion_category.value if a.emotion_category else 'N/A'} "
                      f"(intensity: {a.emotion_intensity:.2f}, words: {a.word_count})")
        
        # Show emotion distribution
        if analytics_count > 0:
            print(f"\n🎭 Emotion Distribution")
            print(f"{'='*40}")
            result = await db.execute(
                select(
                    VentAnalytics.emotion_category,
                    func.count(VentAnalytics.id)
                ).group_by(VentAnalytics.emotion_category)
            )
            for row in result.all():
                emotion = row[0].value if row[0] else "unknown"
                count = row[1]
                print(f"  {emotion}: {count}")


if __name__ == "__main__":
    asyncio.run(view_data())
