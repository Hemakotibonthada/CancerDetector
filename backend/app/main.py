"""
CancerGuard AI - Main Application Entry Point
===============================================

FastAPI application with comprehensive healthcare routes,
middleware, and startup/shutdown lifecycle management.
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.config import get_settings, BASE_DIR, PROJECT_DIR
from app.database import init_db, close_db, check_db_health, get_db_context
from app.services.seed_service import SeedService

logger = logging.getLogger(__name__)

# Track app start time
APP_START_TIME = time.time()


# ============================================================================
# Application Lifecycle
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    settings = get_settings()
    
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment.value}")
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    # Seed data in development
    if settings.is_development:
        try:
            async with get_db_context() as session:
                seed_service = SeedService(session)
                await seed_service.seed_all()
        except Exception as e:
            logger.warning(f"Seed data error (non-critical): {e}")
    
    logger.info(f"{settings.app_name} started successfully!")
    
    yield
    
    # Shutdown
    await close_db()
    logger.info(f"{settings.app_name} shutdown complete")


# ============================================================================
# Create Application
# ============================================================================

def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.app_name,
        description=settings.app_description,
        version=settings.app_version,
        docs_url=settings.docs_url if settings.debug else None,
        redoc_url=settings.redoc_url if settings.debug else None,
        openapi_url=settings.openapi_url if settings.debug else None,
        lifespan=lifespan,
    )
    
    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )
    
    # Request timing middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
    
    # Register API routes
    from app.api import (
        auth_router, users_router, patients_router, hospitals_router,
        health_records_router, blood_samples_router, smartwatch_router,
        cancer_detection_router, admin_router, appointments_router,
        notifications_router, reports_router, analytics_router,
        blood_donor_router, clinical_decision_router, genomics_router,
        research_router, population_health_router, patient_engagement_router,
        communication_router, billing_enhanced_router, quality_safety_router,
        supply_chain_router, telehealth_router, pathology_router,
        rehabilitation_router, nutrition_enhanced_router, mental_health_enhanced_router,
        clinical_trials_v2_router, radiology_enhanced_router, pharmacy_enhanced_router,
        education_router, social_determinants_router, wearable_enhanced_router,
        emergency_router, workforce_router, documents_router,
    )
    
    api_prefix = settings.api_prefix
    
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(users_router, prefix=api_prefix)
    app.include_router(patients_router, prefix=api_prefix)
    app.include_router(hospitals_router, prefix=api_prefix)
    app.include_router(health_records_router, prefix=api_prefix)
    app.include_router(blood_samples_router, prefix=api_prefix)
    app.include_router(smartwatch_router, prefix=api_prefix)
    app.include_router(cancer_detection_router, prefix=api_prefix)
    app.include_router(admin_router, prefix=api_prefix)
    app.include_router(appointments_router, prefix=api_prefix)
    app.include_router(notifications_router, prefix=api_prefix)
    app.include_router(reports_router, prefix=api_prefix)
    app.include_router(analytics_router, prefix=api_prefix)
    app.include_router(blood_donor_router, prefix=api_prefix)
    app.include_router(clinical_decision_router, prefix=api_prefix)
    app.include_router(genomics_router, prefix=api_prefix)
    app.include_router(research_router, prefix=api_prefix)
    app.include_router(population_health_router, prefix=api_prefix)
    app.include_router(patient_engagement_router, prefix=api_prefix)
    app.include_router(communication_router, prefix=api_prefix)
    app.include_router(billing_enhanced_router, prefix=api_prefix)
    app.include_router(quality_safety_router, prefix=api_prefix)
    app.include_router(supply_chain_router, prefix=api_prefix)
    app.include_router(telehealth_router, prefix=api_prefix)
    app.include_router(pathology_router, prefix=api_prefix)
    app.include_router(rehabilitation_router, prefix=api_prefix)
    app.include_router(nutrition_enhanced_router, prefix=api_prefix)
    app.include_router(mental_health_enhanced_router, prefix=api_prefix)
    app.include_router(clinical_trials_v2_router, prefix=api_prefix)
    app.include_router(radiology_enhanced_router, prefix=api_prefix)
    app.include_router(pharmacy_enhanced_router, prefix=api_prefix)
    app.include_router(education_router, prefix=api_prefix)
    app.include_router(social_determinants_router, prefix=api_prefix)
    app.include_router(wearable_enhanced_router, prefix=api_prefix)
    app.include_router(emergency_router, prefix=api_prefix)
    app.include_router(workforce_router, prefix=api_prefix)
    app.include_router(documents_router, prefix=api_prefix)
    
    # ========================================================================
    # Root & Health Endpoints
    # ========================================================================
    
    @app.get("/")
    async def root():
        """Serve the frontend app or redirect."""
        frontend_dir = PROJECT_DIR / "frontend" / "build"
        index_file = frontend_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return JSONResponse({
            "name": settings.app_name,
            "version": settings.app_version,
            "description": settings.app_description,
            "docs": settings.docs_url,
            "api": settings.api_prefix,
            "status": "running",
        })
    
    @app.get("/health")
    async def health_check():
        """Application health check endpoint."""
        db_health = await check_db_health()
        uptime = time.time() - APP_START_TIME
        
        return {
            "status": "healthy" if db_health["status"] == "healthy" else "degraded",
            "version": settings.app_version,
            "environment": settings.environment.value,
            "database": db_health,
            "uptime_seconds": round(uptime, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    @app.get("/api/v1/health")
    async def api_health():
        """API health check."""
        return {
            "status": "healthy",
            "api_version": "v1",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    # Serve frontend static files if build exists
    frontend_build = PROJECT_DIR / "frontend" / "build"
    if frontend_build.exists():
        app.mount("/static", StaticFiles(directory=str(frontend_build / "static")), name="static")
        
        # Catch-all for SPA routing
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            index_file = frontend_build / "index.html"
            if index_file.exists():
                return FileResponse(str(index_file))
            return JSONResponse({"error": "Not found"}, status_code=404)
    
    return app


# Create the app instance
app = create_application()


if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    
    logging.basicConfig(
        level=getattr(logging, settings.log_level.value),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        workers=1 if settings.reload else settings.workers,
        log_level=settings.log_level.value.lower(),
    )
