"""Blood Samples API"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.blood_sample import BloodSample, BloodBiomarker
from app.models.patient import Patient
from app.schemas.blood_sample import (
    BloodSampleCreate, BloodSampleResponse, BiomarkerCreate,
    BiomarkerResponse, BloodAnalysisResult
)
from app.security import get_current_user_id, get_current_user_token, generate_record_number

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/blood-samples", tags=["Blood Samples"])

@router.get("/my", response_model=list[BloodSampleResponse])
async def get_my_blood_samples(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current patient's blood samples."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    query = select(BloodSample).where(
        BloodSample.patient_id == patient.id
    ).order_by(BloodSample.collection_date.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    samples_result = await db.execute(query)
    samples = samples_result.scalars().all()
    return [BloodSampleResponse.model_validate(s) for s in samples]

@router.post("/", response_model=BloodSampleResponse, status_code=201)
async def create_blood_sample(
    sample_data: BloodSampleCreate,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a blood sample record."""
    result = await db.execute(select(Patient).where(Patient.id == sample_data.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    sample = BloodSample(
        patient_id=patient.id,
        health_id=patient.health_id,
        sample_number=generate_record_number("BS"),
        test_type=sample_data.test_type,
        collection_date=sample_data.collection_date,
        fasting=sample_data.fasting,
        fasting_hours=sample_data.fasting_hours,
        hospital_id=sample_data.hospital_id,
        ordering_doctor_id=sample_data.ordering_doctor_id,
        clinical_indication=sample_data.clinical_indication,
    )
    db.add(sample)
    await db.flush()
    return BloodSampleResponse.model_validate(sample)

@router.post("/{sample_id}/biomarkers", status_code=201)
async def add_biomarker(
    sample_id: str,
    biomarker_data: BiomarkerCreate,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Add biomarker result to blood sample."""
    result = await db.execute(select(BloodSample).where(BloodSample.id == sample_id))
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=404, detail="Blood sample not found")
    
    # Determine flag
    flag = "normal"
    if biomarker_data.reference_low and biomarker_data.value < biomarker_data.reference_low:
        flag = "low"
    elif biomarker_data.reference_high and biomarker_data.value > biomarker_data.reference_high:
        flag = "high"
    
    biomarker = BloodBiomarker(
        blood_sample_id=sample_id,
        biomarker_name=biomarker_data.biomarker_name,
        category=biomarker_data.category,
        value=biomarker_data.value,
        unit=biomarker_data.unit,
        reference_low=biomarker_data.reference_low,
        reference_high=biomarker_data.reference_high,
        result_flag=flag,
    )
    db.add(biomarker)
    
    # Update counts
    sample.total_tests += 1
    if flag == "normal":
        sample.normal_results += 1
    else:
        sample.abnormal_results += 1
    
    return {"success": True, "message": "Biomarker added"}

@router.get("/{sample_id}/biomarkers", response_model=list[BiomarkerResponse])
async def get_biomarkers(
    sample_id: str,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Get biomarkers for a blood sample."""
    result = await db.execute(
        select(BloodBiomarker).where(BloodBiomarker.blood_sample_id == sample_id)
    )
    biomarkers = result.scalars().all()
    return [BiomarkerResponse.model_validate(b) for b in biomarkers]

@router.post("/{sample_id}/analyze", response_model=BloodAnalysisResult)
async def analyze_blood_sample(
    sample_id: str,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Run AI analysis on blood sample."""
    result = await db.execute(select(BloodSample).where(BloodSample.id == sample_id))
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=404, detail="Blood sample not found")
    
    # Get biomarkers for analysis
    bio_result = await db.execute(
        select(BloodBiomarker).where(BloodBiomarker.blood_sample_id == sample_id)
    )
    biomarkers = bio_result.scalars().all()
    
    # Simple risk scoring based on biomarker flags
    total = len(biomarkers)
    abnormal = sum(1 for b in biomarkers if b.result_flag != "normal")
    cancer_markers_elevated = sum(1 for b in biomarkers if b.is_cancer_marker and b.result_flag in ["high", "critical_high"])
    
    risk_score = 0.0
    if total > 0:
        risk_score = (abnormal / total) * 0.5 + (cancer_markers_elevated / max(total, 1)) * 0.5
    
    risk_category = "very_low"
    if risk_score >= 0.8:
        risk_category = "critical"
    elif risk_score >= 0.6:
        risk_category = "high"
    elif risk_score >= 0.4:
        risk_category = "moderate"
    elif risk_score >= 0.2:
        risk_category = "low"
    
    # Update sample
    sample.ai_analyzed = True
    sample.ai_cancer_risk_score = risk_score
    sample.ai_risk_level = risk_category
    sample.ai_analysis_date = datetime.now(timezone.utc)
    
    abnormal_biomarkers = [BiomarkerResponse.model_validate(b) for b in biomarkers if b.result_flag != "normal"]
    
    return BloodAnalysisResult(
        sample_id=sample_id,
        patient_id=sample.patient_id,
        analysis_date=datetime.now(timezone.utc),
        overall_cancer_risk=risk_score,
        risk_category=risk_category,
        abnormal_biomarkers=abnormal_biomarkers,
        ai_recommendations=[
            "Regular monitoring recommended" if risk_category == "low" else "Consult oncologist immediately" if risk_category in ["high", "critical"] else "Follow-up in 3 months"
        ],
        model_confidence=0.87,
        model_version="1.0.0",
    )
