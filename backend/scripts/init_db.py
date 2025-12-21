"""
Database initialization script for VentVault.
Run this to create the PostgreSQL database and tables.

Usage:
    python scripts/init_db.py
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from app.database import Base
from app.config import get_settings

# Import all models to register them
from app.db_models import (
    AnonymousUser,
    UserConsent,
    UserLocation,
    VentSession,
    VentAnalytics,
    AggregateAnalytics
)


async def init_database():
    """Initialize database and create all tables"""
    settings = get_settings()
    
    print(f"Connecting to database...")
    print(f"URL: {settings.database_url.replace(settings.database_url.split('@')[0].split('://')[-1], '***:***')}")
    
    engine = create_async_engine(
        settings.database_url,
        echo=True
    )
    
    async with engine.begin() as conn:
        print("\nCreating tables...")
        await conn.run_sync(Base.metadata.create_all)
    
    await engine.dispose()
    
    print("\n✅ Database initialized successfully!")
    print("\nTables created:")
    for table in Base.metadata.tables:
        print(f"  - {table}")


async def drop_all_tables():
    """Drop all tables (use with caution!)"""
    settings = get_settings()
    
    engine = create_async_engine(settings.database_url)
    
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()
    print("✅ All tables dropped")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--drop":
        confirm = input("⚠️  This will DELETE ALL DATA. Type 'yes' to confirm: ")
        if confirm == "yes":
            asyncio.run(drop_all_tables())
        else:
            print("Cancelled")
    else:
        asyncio.run(init_database())
