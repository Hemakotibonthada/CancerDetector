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
    
    return DashboardStats(
        total_patients=patients_count.scalar() or 0,
        total_hospitals=hospitals_count.scalar() or 0,
        total_doctors=doctors_count.scalar() or 0,
        total_screenings=screenings_count.scalar() or 0,
        total_predictions=predictions_count.scalar() or 0,
        high_risk_patients=high_risk.scalar() or 0,
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
    """Seed database with sample data."""
    try:
        await DatabaseManager.seed_data()
        return {"success": True, "message": "Database seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system-health")
async def system_health(token_data=Depends(require_any_admin)):
    """Get system health status."""
    from app.database import check_db_health
    db_health = await check_db_health()
    return {
        "status": "healthy",
        "database": db_health,
        "ai_models": {"status": "loaded", "version": "1.0.0"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
