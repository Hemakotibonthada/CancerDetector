"""Reports & Analytics API"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.patient import Patient
from app.models.cancer_screening import CancerRiskAssessment
from app.models.blood_sample import BloodSample
from app.models.health_record import HealthRecord
from app.security import get_current_user_token, require_any_admin

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/patient-summary/{patient_id}")
async def get_patient_summary_report(
    patient_id: str,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        return {"error": "Patient not found"}
    
    records_count = await db.execute(
        select(func.count(HealthRecord.id)).where(HealthRecord.patient_id == patient_id)
    )
    blood_count = await db.execute(
        select(func.count(BloodSample.id)).where(BloodSample.patient_id == patient_id)
    )
    risk_count = await db.execute(
        select(func.count(CancerRiskAssessment.id)).where(CancerRiskAssessment.patient_id == patient_id)
    )
    
    return {
        "patient_id": patient_id,
        "health_id": patient.health_id,
        "cancer_risk_score": patient.cancer_risk_score,
        "cancer_risk_level": patient.overall_cancer_risk,
        "total_health_records": records_count.scalar() or 0,
        "total_blood_samples": blood_count.scalar() or 0,
        "total_risk_assessments": risk_count.scalar() or 0,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
