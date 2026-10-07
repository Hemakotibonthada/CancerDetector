"""Admin API"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session, DatabaseManager
from app.models.user import User
from app.models.patient import Patient
from app.models.hospital import Hospital, Doctor
from app.models.cancer_screening import CancerScreening, CancerRiskAssessment
from app.models.blood_sample import BloodSample
from app.models.notification import Notification
from app.schemas.common import DashboardStats
from app.security import require_any_admin, require_system_admin
from app.services.stats_service import ai_model_status, host_resources, platform_snapshot
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard", response_model=DashboardStats)
async def get_admin_dashboard(
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Get admin dashboard statistics."""
    patients_count = await db.execute(select(func.count(Patient.id)))
    hospitals_count = await db.execute(select(func.count(Hospital.id)).where(Hospital.is_deleted == False))
    doctors_count = await db.execute(select(func.count(Doctor.id)).where(Doctor.is_deleted == False))
    screenings_count = await db.execute(select(func.count(CancerScreening.id)))
    predictions_count = await db.execute(select(func.count(CancerRiskAssessment.id)))
    high_risk = await db.execute(
        select(func.count(Patient.id)).where(
            Patient.overall_cancer_risk.in_(["high", "very_high", "critical"])
        )
    )
    
    snapshot = await platform_snapshot(db)
    return DashboardStats(
        total_patients=patients_count.scalar() or 0,
        total_hospitals=hospitals_count.scalar() or 0,
        total_doctors=doctors_count.scalar() or 0,
        total_screenings=screenings_count.scalar() or 0,
        total_predictions=predictions_count.scalar() or 0,
        high_risk_patients=high_risk.scalar() or 0,
        total_users=snapshot["total_users"],
        audit_events=snapshot["audit_events"],
        audit_failed=snapshot["audit_failed"],
        platform_stats=snapshot["platform_stats"],
        user_distribution=snapshot["user_distribution"],
        recent_activity=snapshot["recent_activity"],
        ai_models=snapshot["ai_models"],
        resources=snapshot["resources"],
        collection_rate=snapshot["collection_rate"],
        revenue_this_month=snapshot["revenue_this_month"],
        today_appointments=snapshot["today_appointments"],
        pending_lab_results=snapshot["pending_lab_results"],
        critical_alerts=snapshot["critical_alerts"],
        bed_occupancy_percent=snapshot["bed_occupancy_percent"],
        total_reports=snapshot["total_reports"],
    )

@router.get("/users/stats")
async def get_user_stats(
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Get user statistics by role."""
    result = await db.execute(
        select(User.role, func.count(User.id)).where(User.is_deleted == False).group_by(User.role)
    )
    stats = {role: count for role, count in result.all()}
    return {"success": True, "data": stats}

@router.get("/risk-distribution")
async def get_risk_distribution(
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Get cancer risk distribution."""
    result = await db.execute(
        select(Patient.overall_cancer_risk, func.count(Patient.id))
        .where(Patient.overall_cancer_risk.isnot(None))
        .group_by(Patient.overall_cancer_risk)
    )
    distribution = {level or "unknown": count for level, count in result.all()}
    return {"success": True, "data": distribution}

@router.post("/seed-data")
async def seed_database(
    token_data=Depends(require_system_admin),
):
    """Explicit demo seed. Off unless SEED_DEMO_DATA is set, and refused in production otherwise."""
    from app.services.seed_service import demo_seed_allowed
    if not demo_seed_allowed():
        raise HTTPException(status_code=403, detail="Demo seeding is disabled. Set SEED_DEMO_DATA=true to allow it, and never do that on a database that already holds real accounts.")
    try:
        await DatabaseManager.seed_data()
        return {"success": True, "message": "Database seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit-logs")
async def list_audit_logs(
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session),
):
    rows = (await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200))).scalars().all()
    failed = sum(1 for row in rows if row.status != "success")
    return {
        "total": (await db.execute(select(func.count(AuditLog.id)))).scalar() or 0,
        "failed": failed,
        "logs": [row.to_dict() for row in rows],
    }

@router.get("/system-health")
async def system_health(token_data=Depends(require_any_admin)):
    """Get system health status from the live process and database."""
    from app.database import check_db_health
    from app.main import APP_START_TIME
    import time
    db_health = await check_db_health()
    resources = host_resources()
    models = ai_model_status()
    db_ok = db_health.get("status") == "healthy"
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": db_health,
        "ai_models": models,
        "resources": resources,
        "uptime_seconds": round(time.time() - APP_START_TIME, 2),
        "services": [
            {"service": "database", "name": "database", "status": "healthy" if db_ok else "unhealthy"},
            {"service": "api", "name": "api", "status": "healthy"},
            {"service": "ai_models", "name": "ai_models", "status": models["status"]},
        ],
        "server_metrics": [],
        "api_endpoints": [],
        "alerts": [],
        "cron_jobs": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
