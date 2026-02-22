"""
Patients API Endpoints
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.user import User
from app.models.patient import Patient, PatientAllergy, PatientFamilyHistory
from app.schemas.patient import (
    PatientCreate, PatientResponse, PatientUpdate, PatientDetailResponse,
    PatientHealthSummary, AllergyCreate, FamilyHistoryCreate
)
from app.security import get_current_user_id, get_current_user_token, generate_health_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("/me", response_model=PatientDetailResponse)
async def get_my_patient_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current patient's profile."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    return PatientDetailResponse(
        id=patient.id,
        user_id=patient.user_id,
        health_id=patient.health_id,
        height_cm=patient.height_cm,
        weight_kg=patient.weight_kg,
        bmi=patient.bmi,
        blood_type=patient.blood_type,
        smoking_status=patient.smoking_status,
        alcohol_consumption=patient.alcohol_consumption,
        physical_activity_level=patient.physical_activity_level,
        overall_cancer_risk=patient.overall_cancer_risk,
        cancer_risk_score=patient.cancer_risk_score,
        has_smartwatch=patient.has_smartwatch,
        has_diabetes=patient.has_diabetes,
        has_hypertension=patient.has_hypertension,
        has_previous_cancer=patient.has_previous_cancer,
        created_at=patient.created_at,
        marital_status=patient.marital_status,
        occupation=patient.occupation,
        smoking_years=patient.smoking_years,
        packs_per_day=patient.packs_per_day,
        alcohol_units_per_week=patient.alcohol_units_per_week,
        exercise_minutes_per_week=patient.exercise_minutes_per_week,
        diet_type=patient.diet_type,
        sleep_hours_avg=patient.sleep_hours_avg,
        stress_level=patient.stress_level,
        genetic_testing_done=patient.genetic_testing_done,
        brca1_positive=patient.brca1_positive,
        brca2_positive=patient.brca2_positive,
        risk_assessment_date=patient.risk_assessment_date,
        data_collection_consent=patient.data_collection_consent,
        ai_analysis_consent=patient.ai_analysis_consent,
    )


@router.get("/health-id/{health_id}", response_model=PatientDetailResponse)
async def get_patient_by_health_id(
    health_id: str,
    token_data = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Get patient by Health ID (accessible by hospital staff)."""
    role = token_data.get("role", "")
    allowed_roles = ["doctor", "nurse", "oncologist", "surgeon", "hospital_admin",
                     "system_admin", "super_admin", "lab_technician", "pharmacist",
                     "radiologist", "pathologist", "general_practitioner", "specialist"]
    
    if role not in allowed_roles and token_data.get("health_id") != health_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    result = await db.execute(select(Patient).where(Patient.health_id == health_id))
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return PatientDetailResponse.model_validate(patient)


@router.put("/me", response_model=PatientResponse)
async def update_my_patient_profile(
    update_data: PatientUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Update current patient's profile."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(patient, key, value)
    
    # Recalculate BMI
    patient.calculate_bmi()
    
    return PatientResponse(
        id=patient.id, user_id=patient.user_id, health_id=patient.health_id,
        bmi=patient.bmi, has_smartwatch=patient.has_smartwatch,
        has_diabetes=patient.has_diabetes, has_hypertension=patient.has_hypertension,
        has_previous_cancer=patient.has_previous_cancer, created_at=patient.created_at,
    )


@router.get("/me/health-summary", response_model=PatientHealthSummary)
async def get_my_health_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current patient's health summary."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    return PatientHealthSummary(
        patient_id=patient.id,
        health_id=patient.health_id,
        cancer_risk_level=patient.overall_cancer_risk,
        cancer_risk_score=patient.cancer_risk_score,
        smartwatch_connected=patient.has_smartwatch,
        total_health_records=0,
        total_blood_tests=0,
        active_medications=0,
        active_alerts=0,
    )


@router.post("/me/allergies")
async def add_allergy(
    allergy_data: AllergyCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Add an allergy to patient profile."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    allergy = PatientAllergy(
        patient_id=patient.id,
        allergy_type=allergy_data.allergy_type,
        allergen=allergy_data.allergen,
        reaction=allergy_data.reaction,
        severity=allergy_data.severity,
        onset_date=allergy_data.onset_date,
    )
    db.add(allergy)
    return {"success": True, "message": "Allergy added"}


@router.post("/me/family-history")
async def add_family_history(
    history_data: FamilyHistoryCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Add family medical history."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    history = PatientFamilyHistory(
        patient_id=patient.id,
        relationship_type=history_data.relationship_type,
        condition_name=history_data.condition_name,
        condition_category=history_data.condition_category,
        age_at_diagnosis=history_data.age_at_diagnosis,
        is_cancer=history_data.is_cancer,
        cancer_type=history_data.cancer_type,
    )
    db.add(history)
    return {"success": True, "message": "Family history added"}


@router.get("/{patient_id}", response_model=PatientDetailResponse)
async def get_patient(
    patient_id: str,
    token_data = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    """Get patient by ID."""
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return PatientDetailResponse(
        id=patient.id, user_id=patient.user_id, health_id=patient.health_id,
        overall_cancer_risk=patient.overall_cancer_risk,
        cancer_risk_score=patient.cancer_risk_score,
        has_smartwatch=patient.has_smartwatch, has_diabetes=patient.has_diabetes,
        has_hypertension=patient.has_hypertension,
        has_previous_cancer=patient.has_previous_cancer,
        created_at=patient.created_at,
    )
