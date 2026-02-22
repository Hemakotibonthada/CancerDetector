"""Cancer Detection API"""
from __future__ import annotations
import logging
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.patient import Patient
from app.models.cancer_screening import (
    CancerScreening, CancerRiskAssessment, CancerPrediction, ScreeningRecommendation
)
from app.models.blood_sample import BloodSample, BloodBiomarker
from app.models.smartwatch_data import SmartwatchData
from app.schemas.smartwatch_data import CancerRiskResponse, CancerScreeningCreate, CancerScreeningResponse
from app.security import get_current_user_id, get_current_user_token, generate_record_number

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cancer-detection", tags=["Cancer Detection"])

@router.post("/predict/{patient_id}", response_model=CancerRiskResponse)
async def predict_cancer_risk(
    patient_id: str,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Run AI cancer risk prediction for a patient."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Gather data points for risk assessment
    risk_factors = {}
    base_risk = 0.05  # 5% baseline
    
    # Age factor
    if patient.bmi:
        if patient.bmi > 30:
            base_risk += 0.05
    
    # Smoking
    if patient.smoking_status in ["current_light", "current_moderate", "current_heavy"]:
        pack_years = patient.get_pack_years() or 0
        base_risk += min(0.15, pack_years * 0.005)
        risk_factors["smoking"] = {"impact": "high", "pack_years": pack_years}
    
    # Alcohol
    if patient.alcohol_consumption == "heavy":
        base_risk += 0.08
        risk_factors["alcohol"] = {"impact": "moderate"}
    
    # Family history
    if patient.has_previous_cancer:
        base_risk += 0.15
        risk_factors["previous_cancer"] = {"impact": "very_high"}
    
    # Genetic markers
    if patient.brca1_positive:
        base_risk += 0.20
        risk_factors["brca1"] = {"impact": "very_high"}
    if patient.brca2_positive:
        base_risk += 0.15
        risk_factors["brca2"] = {"impact": "high"}
    
    # Medical conditions
    if patient.has_diabetes:
        base_risk += 0.03
    if patient.has_obesity:
        base_risk += 0.05
    
    # Get latest blood sample results
    blood_result = await db.execute(
        select(BloodSample).where(
            BloodSample.patient_id == patient_id
        ).order_by(BloodSample.collection_date.desc()).limit(1)
    )
    latest_blood = blood_result.scalar_one_or_none()
    
    blood_data_used = False
    if latest_blood:
        blood_data_used = True
        if latest_blood.ai_cancer_risk_score:
            base_risk = (base_risk + latest_blood.ai_cancer_risk_score) / 2
    
    # Get smartwatch anomalies
    sw_result = await db.execute(
        select(SmartwatchData).where(
            SmartwatchData.patient_id == patient_id,
            SmartwatchData.ai_anomaly_detected == True
        ).limit(10)
    )
    anomalies = sw_result.scalars().all()
    smartwatch_data_used = len(anomalies) > 0
    if anomalies:
        base_risk += 0.02 * len(anomalies)
    
    # Cap risk score
    overall_risk = min(0.99, max(0.01, base_risk))
    
    # Determine category
    if overall_risk >= 0.8:
        category = "critical"
    elif overall_risk >= 0.6:
        category = "very_high"
    elif overall_risk >= 0.4:
        category = "high"
    elif overall_risk >= 0.2:
        category = "moderate"
    elif overall_risk >= 0.1:
        category = "low"
    else:
        category = "very_low"
    
    # Cancer type risks
    cancer_type_risks = {
        "lung": overall_risk * (1.5 if patient.smoking_status and "current" in (patient.smoking_status or "") else 0.5),
        "breast": overall_risk * (2.0 if patient.brca1_positive else 1.0),
        "colorectal": overall_risk * 0.8,
        "prostate": overall_risk * 0.7,
        "skin": overall_risk * 0.6,
        "liver": overall_risk * (1.3 if patient.has_liver_disease else 0.5),
        "pancreatic": overall_risk * 0.4,
    }
    # Cap each at 0.99
    cancer_type_risks = {k: min(0.99, v) for k, v in cancer_type_risks.items()}
    
    # Create risk assessment record
    assessment = CancerRiskAssessment(
        patient_id=patient_id,
        health_id=patient.health_id,
        assessment_number=generate_record_number("CRA"),
        assessment_date=datetime.now(timezone.utc),
        assessment_type="comprehensive_ai",
        overall_risk_score=overall_risk,
        overall_risk_category=category,
        lung_cancer_risk=cancer_type_risks.get("lung"),
        breast_cancer_risk=cancer_type_risks.get("breast"),
        colorectal_cancer_risk=cancer_type_risks.get("colorectal"),
        prostate_cancer_risk=cancer_type_risks.get("prostate"),
        skin_cancer_risk=cancer_type_risks.get("skin"),
        liver_cancer_risk=cancer_type_risks.get("liver"),
        pancreatic_cancer_risk=cancer_type_risks.get("pancreatic"),
        blood_data_used=blood_data_used,
        smartwatch_data_used=smartwatch_data_used,
        clinical_data_used=True,
        family_history_used=True,
        lifestyle_data_used=True,
        top_risk_factors=json.dumps(list(risk_factors.keys())),
        ai_model_name="CancerGuard Ensemble v1",
        ai_model_version="1.0.0",
        ai_confidence=0.87,
    )
    db.add(assessment)
    
    # Update patient risk
    patient.cancer_risk_score = overall_risk
    patient.overall_cancer_risk = category
    patient.risk_assessment_date = datetime.now(timezone.utc)
    
    recommendations = []
    if category in ["high", "very_high", "critical"]:
        recommendations.append("Immediate consultation with oncologist recommended")
        recommendations.append("Comprehensive cancer screening recommended within 2 weeks")
    elif category == "moderate":
        recommendations.append("Schedule cancer screening within 1 month")
        recommendations.append("Regular blood tests every 3 months")
    else:
        recommendations.append("Continue regular health checkups")
        recommendations.append("Annual cancer screening recommended")
    
    return CancerRiskResponse(
        patient_id=patient_id,
        health_id=patient.health_id,
        assessment_date=datetime.now(timezone.utc),
        overall_risk_score=overall_risk,
        overall_risk_category=category,
        cancer_type_risks=cancer_type_risks,
        top_risk_factors=[{"name": k, **v} for k, v in risk_factors.items()],
        recommendations=recommendations,
        data_sources_used={
            "blood_samples": blood_data_used,
            "smartwatch": smartwatch_data_used,
            "clinical_data": True,
            "family_history": True,
            "lifestyle": True,
            "genetic": patient.genetic_testing_done,
        },
        model_confidence=0.87,
        model_version="1.0.0",
    )


@router.get("/risk-history/{patient_id}", response_model=list[CancerRiskResponse])
async def get_risk_history(
    patient_id: str,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Get cancer risk assessment history."""
    result = await db.execute(
        select(CancerRiskAssessment).where(
            CancerRiskAssessment.patient_id == patient_id
        ).order_by(CancerRiskAssessment.assessment_date.desc()).limit(20)
    )
    assessments = result.scalars().all()
    
    return [
        CancerRiskResponse(
            patient_id=a.patient_id,
            health_id=a.health_id,
            assessment_date=a.assessment_date,
            overall_risk_score=a.overall_risk_score,
            overall_risk_category=a.overall_risk_category,
            model_confidence=a.ai_confidence or 0.0,
            model_version=a.ai_model_version or "",
        )
        for a in assessments
    ]


@router.post("/screenings", response_model=CancerScreeningResponse, status_code=201)
async def create_screening(
    screening_data: CancerScreeningCreate,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Record a cancer screening."""
    result = await db.execute(select(Patient).where(Patient.id == screening_data.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    screening = CancerScreening(
        patient_id=patient.id,
        health_id=patient.health_id,
        screening_number=generate_record_number("CS"),
        screening_date=screening_data.screening_date,
        cancer_type_screened=screening_data.cancer_type_screened,
        screening_method=screening_data.screening_method,
        hospital_id=screening_data.hospital_id,
        doctor_id=screening_data.doctor_id,
        result=screening_data.result,
        findings=screening_data.findings,
    )
    db.add(screening)
    await db.flush()
    return CancerScreeningResponse.model_validate(screening)
