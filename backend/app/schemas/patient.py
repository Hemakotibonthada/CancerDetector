"""Patient Schemas"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class PatientCreate(BaseModel):
    user_id: str
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    blood_type: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    smoking_status: Optional[str] = None
    alcohol_consumption: Optional[str] = None
    physical_activity_level: Optional[str] = None
    has_diabetes: bool = False
    has_hypertension: bool = False
    has_heart_disease: bool = False
    has_previous_cancer: bool = False

class PatientResponse(BaseModel):
    id: str
    user_id: str
    health_id: str
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    bmi: Optional[float] = None
    blood_type: Optional[str] = None
    smoking_status: Optional[str] = None
    alcohol_consumption: Optional[str] = None
    physical_activity_level: Optional[str] = None
    overall_cancer_risk: Optional[str] = None
    cancer_risk_score: Optional[float] = None
    has_smartwatch: bool = False
    has_diabetes: bool = False
    has_hypertension: bool = False
    has_previous_cancer: bool = False
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PatientUpdate(BaseModel):
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    blood_type: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    smoking_status: Optional[str] = None
    smoking_years: Optional[int] = None
    packs_per_day: Optional[float] = None
    alcohol_consumption: Optional[str] = None
    alcohol_units_per_week: Optional[float] = None
    physical_activity_level: Optional[str] = None
    exercise_minutes_per_week: Optional[int] = None
    diet_type: Optional[str] = None
    sleep_hours_avg: Optional[float] = None
    stress_level: Optional[str] = None
    has_diabetes: Optional[bool] = None
    has_hypertension: Optional[bool] = None
    has_heart_disease: Optional[bool] = None
    has_previous_cancer: Optional[bool] = None
    previous_cancer_type: Optional[str] = None
    genetic_testing_done: Optional[bool] = None
    brca1_positive: Optional[bool] = None
    brca2_positive: Optional[bool] = None

class PatientDetailResponse(PatientResponse):
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    smoking_years: Optional[int] = None
    packs_per_day: Optional[float] = None
    alcohol_units_per_week: Optional[float] = None
    exercise_minutes_per_week: Optional[int] = None
    diet_type: Optional[str] = None
    sleep_hours_avg: Optional[float] = None
    stress_level: Optional[str] = None
    has_autoimmune_disease: bool = False
    has_chronic_kidney_disease: bool = False
    has_liver_disease: bool = False
    has_lung_disease: bool = False
    genetic_testing_done: bool = False
    brca1_positive: Optional[bool] = None
    brca2_positive: Optional[bool] = None
    risk_assessment_date: Optional[datetime] = None
    data_collection_consent: bool = False
    ai_analysis_consent: bool = False
    allergies: List[Any] = []
    family_histories: List[Any] = []

class PatientHealthSummary(BaseModel):
    patient_id: str
    health_id: str
    cancer_risk_level: Optional[str] = None
    cancer_risk_score: Optional[float] = None
    last_screening_date: Optional[datetime] = None
    next_screening_recommended: Optional[datetime] = None
    total_health_records: int = 0
    total_blood_tests: int = 0
    active_medications: int = 0
    active_alerts: int = 0
    smartwatch_connected: bool = False
    latest_vitals: Optional[Dict] = None
    recent_lab_results: List[Dict] = []
    screening_recommendations: List[Dict] = []
    risk_trend: List[Dict] = []

class AllergyCreate(BaseModel):
    allergy_type: str
    allergen: str
    reaction: Optional[str] = None
    severity: str
    onset_date: Optional[datetime] = None

class FamilyHistoryCreate(BaseModel):
    relationship_type: str
    condition_name: str
    condition_category: Optional[str] = None
    age_at_diagnosis: Optional[int] = None
    is_cancer: bool = False
    cancer_type: Optional[str] = None
