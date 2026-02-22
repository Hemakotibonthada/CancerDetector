"""
Run Script - Start the CancerGuard AI Application
===================================================

Usage:
  python run.py              # Start backend server
  python run.py --seed       # Seed database with sample data
  python run.py --reset-db   # Reset database
"""

import asyncio
import logging
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def main():
    """Main entry point."""
    import uvicorn
    from backend.app.config import get_settings
    
    settings = get_settings()
    
    print("\n" + "=" * 60)
    print("  CancerGuard AI - Cancer Detection Platform")
    print("  Version: 1.0.0")
    print(f"  Environment: {settings.environment.value}")
    print(f"  Server: http://{settings.host}:{settings.port}")
    print(f"  API Docs: http://localhost:{settings.port}/docs")
    print(f"  Database: {'SQLite' if settings.database.use_sqlite else 'PostgreSQL'}")
    print("=" * 60 + "\n")
    
    print("  Demo Accounts:")
    print("  ─────────────────────────────────────────")
    print("  Patient:        patient@cancerguard.ai / Patient@123456")
    print("  Doctor:         doctor@cancerguard.ai / Doctor@123456")
    print("  Hospital Admin: hospital.admin@cancerguard.ai / Hospital@123456")
    print("  System Admin:   admin@cancerguard.ai / Admin@123456")
    print("  ─────────────────────────────────────────\n")
    
    uvicorn.run(
        "backend.app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        workers=1,
        log_level="info",
    )


if __name__ == "__main__":
    if "--seed" in sys.argv:
        async def seed():
            from backend.app.database import init_db, get_db_context
            from backend.app.services.seed_service import SeedService
            await init_db()
            async with get_db_context() as session:
                seed_service = SeedService(session)
                await seed_service.seed_all()
            print("Database seeded successfully!")
        asyncio.run(seed())
    elif "--reset-db" in sys.argv:
        async def reset():
            from backend.app.database import DatabaseManager
            await DatabaseManager.reset_database()
            print("Database reset successfully!")
        asyncio.run(reset())
    else:
        main()
