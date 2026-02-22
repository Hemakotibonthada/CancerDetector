"""Health Record Schemas"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class HealthRecordCreate(BaseModel):
    patient_id: str
    record_type: str
    category: str = "outpatient"
    encounter_date: datetime
    hospital_id: Optional[str] = None
    doctor_id: Optional[str] = None
    chief_complaint: Optional[str] = None
    primary_diagnosis: Optional[str] = None
    primary_diagnosis_code: Optional[str] = None
    treatment_plan: Optional[str] = None
    medications_prescribed: Optional[str] = None
    clinical_notes: Optional[str] = None
    is_cancer_related: bool = False
    cancer_type: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None

class HealthRecordResponse(BaseModel):
    id: str
    patient_id: str
    health_id: str
    record_number: str
    record_type: str
    category: str
    status: str
    encounter_date: datetime
    hospital_id: Optional[str] = None
    doctor_id: Optional[str] = None
    chief_complaint: Optional[str] = None
    primary_diagnosis: Optional[str] = None
    is_cancer_related: bool = False
    cancer_type: Optional[str] = None
    ai_risk_score: Optional[float] = None
    ai_risk_level: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class HealthRecordDetailResponse(HealthRecordResponse):
    primary_diagnosis_code: Optional[str] = None
    secondary_diagnoses: Optional[str] = None
    diagnosis_severity: Optional[str] = None
    cancer_stage: Optional[str] = None
    tnm_staging: Optional[str] = None
    physical_examination: Optional[str] = None
    treatment_plan: Optional[str] = None
    medications_prescribed: Optional[str] = None
    clinical_notes: Optional[str] = None
    doctor_notes: Optional[str] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature_celsius: Optional[float] = None
    weight_kg: Optional[float] = None
    pain_score: Optional[int] = None
    ai_recommendations: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    discharge_summary: Optional[str] = None
    total_cost: Optional[float] = None

class HealthTimelineResponse(BaseModel):
    timeline: List[Dict[str, Any]] = []
    total_records: int = 0
    cancer_related_records: int = 0
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None
