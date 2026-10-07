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
from app.security import require_analytics_access
from app.services.stats_service import platform_snapshot

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
async def analytics_overview(
    token_data=Depends(require_analytics_access),
    db: AsyncSession = Depends(get_db_session)
):
    snapshot = await platform_snapshot(db)
    if snapshot["total_screenings"] == 0:
        snapshot["detection_rate"] = None
    return snapshot


@router.get("/operations")
async def analytics_operations(
    token_data=Depends(require_analytics_access),
    db: AsyncSession = Depends(get_db_session)
):
    """Same persisted aggregates as /overview, for dashboard screens."""
    return await platform_snapshot(db)

@router.get("/risk-trends")
async def risk_trends(
    token_data=Depends(require_analytics_access),
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
