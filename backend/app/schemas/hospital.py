"""Hospital Schemas"""
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class HospitalCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=300)
    code: str = Field(..., min_length=2, max_length=20)
    hospital_type: str = "general"
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    total_beds: Optional[int] = None
    has_cancer_center: bool = False
    emergency_available: bool = True

class HospitalResponse(BaseModel):
    id: str
    name: str
    code: str
    hospital_type: str
    status: str
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    total_beds: Optional[int] = None
    has_cancer_center: bool = False
    ai_integration_enabled: bool = False
    average_rating: Optional[float] = None
    total_reviews: int = 0
    logo_url: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class HospitalDetailResponse(HospitalResponse):
    registration_number: Optional[str] = None
    accreditation_number: Optional[str] = None
    established_year: Optional[int] = None
    website: Optional[str] = None
    emergency_phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    icu_beds: Optional[int] = None
    available_beds: Optional[int] = None
    total_departments: Optional[int] = None
    total_staff: Optional[int] = None
    is_24_hours: bool = False
    has_radiation_therapy: bool = False
    has_chemotherapy: bool = False
    has_mri: bool = False
    has_ct_scan: bool = False
    has_pet_scan: bool = False
    has_genetic_testing: bool = False
    smartwatch_integration_enabled: bool = False
    telemedicine_enabled: bool = False
    description: Optional[str] = None
    departments: List[Any] = []
    doctors: List[Any] = []

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    hospital_type: Optional[str] = None
    status: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    total_beds: Optional[int] = None
    has_cancer_center: Optional[bool] = None
    ai_integration_enabled: Optional[bool] = None

class DepartmentCreate(BaseModel):
    name: str
    code: str
    department_type: str
    phone: Optional[str] = None
    email: Optional[str] = None
    floor: Optional[str] = None
    total_beds: Optional[int] = None

class DoctorCreate(BaseModel):
    user_id: str
    hospital_id: str
    medical_license_number: str
    specialization: str
    degree: Optional[str] = None
    years_of_experience: Optional[int] = None
    consultation_fee: Optional[float] = None
    telemedicine_available: bool = False

class DoctorResponse(BaseModel):
    id: str
    user_id: str
    hospital_id: str
    medical_license_number: str
    specialization: str
    sub_specialization: Optional[str] = None
    degree: Optional[str] = None
    years_of_experience: Optional[int] = None
    consultation_fee: Optional[float] = None
    telemedicine_available: bool = False
    average_rating: Optional[float] = None
    total_reviews: int = 0
    
    class Config:
        from_attributes = True

class HospitalDashboard(BaseModel):
    hospital_id: str
    hospital_name: str
    total_patients: int = 0
    active_patients: int = 0
    total_doctors: int = 0
    total_staff: int = 0
    total_beds: int = 0
    occupied_beds: int = 0
    today_appointments: int = 0
    pending_lab_results: int = 0
    high_risk_patients: int = 0
    active_cancer_screenings: int = 0
    ai_predictions_today: int = 0
    critical_alerts: int = 0
    revenue_this_month: float = 0.0
    patient_satisfaction: float = 0.0
