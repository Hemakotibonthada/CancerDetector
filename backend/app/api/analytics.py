"""Analytics API"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.patient import Patient
from app.models.cancer_screening import CancerRiskAssessment, CancerScreening
from app.models.blood_sample import BloodSample
from app.models.user import User
from app.security import require_any_admin

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
async def analytics_overview(
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_patients = (await db.execute(select(func.count(Patient.id)))).scalar() or 0
    total_screenings = (await db.execute(select(func.count(CancerScreening.id)))).scalar() or 0
    total_blood_samples = (await db.execute(select(func.count(BloodSample.id)))).scalar() or 0
    total_assessments = (await db.execute(select(func.count(CancerRiskAssessment.id)))).scalar() or 0
    
    cancer_detected = (await db.execute(
        select(func.count(CancerScreening.id)).where(CancerScreening.cancer_detected == True)
    )).scalar() or 0
    
    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_screenings": total_screenings,
        "total_blood_samples": total_blood_samples,
        "total_risk_assessments": total_assessments,
        "cancer_detected_count": cancer_detected,
        "detection_rate": cancer_detected / max(total_screenings, 1),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/risk-trends")
async def risk_trends(
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session)
):
    result = await db.execute(
        select(
            CancerRiskAssessment.overall_risk_category,
            func.count(CancerRiskAssessment.id)
        ).group_by(CancerRiskAssessment.overall_risk_category)
    )
    dist = {cat: count for cat, count in result.all()}
    return {"risk_distribution": dist}
