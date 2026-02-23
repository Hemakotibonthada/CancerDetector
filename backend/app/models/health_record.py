"""
Health Record Model - Comprehensive Medical Records
====================================================

Stores all types of health records including consultations, diagnoses,
treatments, procedures, and clinical notes.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    String, Boolean, Integer, DateTime, Text, Float,
    ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, AuditMixin


class HealthRecordType(str, enum.Enum):
    CONSULTATION = "consultation"
    DIAGNOSIS = "diagnosis"
    TREATMENT = "treatment"
    PROCEDURE = "procedure"
    SURGERY = "surgery"
    HOSPITALIZATION = "hospitalization"
    EMERGENCY_VISIT = "emergency_visit"
    FOLLOW_UP = "follow_up"
    SCREENING = "screening"
    VACCINATION = "vaccination"
    LAB_REPORT = "lab_report"
    IMAGING_REPORT = "imaging_report"
    PATHOLOGY_REPORT = "pathology_report"
    PRESCRIPTION = "prescription"
    REFERRAL = "referral"
    DISCHARGE_SUMMARY = "discharge_summary"
    PROGRESS_NOTE = "progress_note"
    OPERATIVE_NOTE = "operative_note"
    NURSING_NOTE = "nursing_note"
    THERAPY_NOTE = "therapy_note"
    MENTAL_HEALTH = "mental_health"
    DENTAL = "dental"
    OPHTHALMOLOGY = "ophthalmology"
    PHYSICAL_THERAPY = "physical_therapy"
    ONCOLOGY_VISIT = "oncology_visit"
    CHEMOTHERAPY_SESSION = "chemotherapy_session"
    RADIATION_SESSION = "radiation_session"
    IMMUNOTHERAPY_SESSION = "immunotherapy_session"
    GENETIC_COUNSELING = "genetic_counseling"
    PALLIATIVE_CARE = "palliative_care"
    ANNUAL_CHECKUP = "annual_checkup"
    OTHER = "other"


class HealthRecordCategory(str, enum.Enum):
    INPATIENT = "inpatient"
    OUTPATIENT = "outpatient"
    EMERGENCY = "emergency"
    HOME_CARE = "home_care"
    TELEMEDICINE = "telemedicine"
    PREVENTIVE = "preventive"
    DIAGNOSTIC = "diagnostic"
    THERAPEUTIC = "therapeutic"
    REHABILITATIVE = "rehabilitative"
    PALLIATIVE = "palliative"


class HealthRecordStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    AMENDED = "amended"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


class DiagnosisSeverity(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"
    LIFE_THREATENING = "life_threatening"


class TreatmentStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    DISCONTINUED = "discontinued"
    NOT_STARTED = "not_started"


# ============================================================================
# Health Record Model
# ============================================================================

class HealthRecord(Base, AuditMixin):
    """
    Comprehensive health record for tracking all medical events.
    
    Every medical interaction, diagnosis, treatment, and procedure
    is recorded here with full audit trail.
    """
    
    __tablename__ = "health_records"
    
    # Patient Reference
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    health_id: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    
    # Record Classification
    record_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(
        String(30), default=HealthRecordCategory.OUTPATIENT.value, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default=HealthRecordStatus.COMPLETED.value, nullable=False
    )
    
    # Record Number
    record_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    
    # Hospital & Doctor
    hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospital.id"), nullable=True
    )
    doctor_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("doctors.id"), nullable=True
    )
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospital_departments.id"), nullable=True
    )
    
    # Timing
    encounter_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    encounter_end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Chief Complaint
    chief_complaint: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    present_illness_history: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Diagnosis
    primary_diagnosis: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    primary_diagnosis_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # ICD-10
    secondary_diagnoses: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    diagnosis_severity: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    diagnosis_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    differential_diagnoses: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Cancer-specific
    is_cancer_related: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cancer_stage: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    cancer_grade: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    tnm_staging: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tumor_size_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lymph_node_involvement: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    metastasis_present: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    metastasis_sites: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Physical Examination
    physical_examination: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Vital Signs at Visit
    blood_pressure_systolic: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    blood_pressure_diastolic: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    respiratory_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    temperature_celsius: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    oxygen_saturation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bmi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pain_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 0-10
    
    # Treatment Plan
    treatment_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    treatment_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    procedures_performed: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    procedure_codes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON CPT codes
    
    # Medications
    medications_prescribed: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    medications_administered: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Orders
    lab_orders: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    imaging_orders: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    referral_orders: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Clinical Notes
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    doctor_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    nursing_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Follow-up
    follow_up_required: Mapped[bool] = mapped_column(Boolean, default=False)
    follow_up_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    follow_up_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Discharge
    discharge_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    discharge_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    discharge_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    discharge_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # AI Analysis
    ai_analysis_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_analysis_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ai_recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    ai_analysis_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Billing
    total_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    insurance_covered: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    out_of_pocket: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    billing_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Attachments
    attachments_count: Mapped[int] = mapped_column(Integer, default=0)
    has_lab_results: Mapped[bool] = mapped_column(Boolean, default=False)
    has_imaging_results: Mapped[bool] = mapped_column(Boolean, default=False)
    has_pathology_results: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Confidentiality
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=False)
    restricted_to_ids: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Quality
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    __table_args__ = (
        Index("ix_health_record_patient_date", "patient_id", "encounter_date"),
        Index("ix_health_record_type_date", "record_type", "encounter_date"),
        Index("ix_health_record_cancer", "is_cancer_related", "cancer_type"),
        Index("ix_health_record_hospital", "hospital_id", "encounter_date"),
        Index("ix_health_record_doctor", "doctor_id", "encounter_date"),
        Index("ix_health_record_health_id", "health_id", "encounter_date"),
    )
