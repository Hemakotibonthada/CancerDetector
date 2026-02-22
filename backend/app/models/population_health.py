"""
Population Health & Public Health Models
==========================================
Disease surveillance, chronic disease programs, care gap identification,
health equity analytics, community resources, and outbreak detection.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class RegistryType(str, enum.Enum):
    CANCER = "cancer"
    DIABETES = "diabetes"
    CARDIOVASCULAR = "cardiovascular"
    RESPIRATORY = "respiratory"
    RARE_DISEASE = "rare_disease"
    INFECTIOUS = "infectious"


class CareGapPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DiseaseRegistry(Base):
    """Population-level disease registry."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    registry_type: Mapped[str] = mapped_column(String(30), default=RegistryType.CANCER.value)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    total_cases: Mapped[int] = mapped_column(Integer, default=0)
    reporting_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reporting_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    demographics: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    incidence_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    prevalence_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mortality_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    survival_rates: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    data_sources: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    managed_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)


class RegistryEntry(Base):
    """Individual patient entry in a disease registry."""
    registry_id: Mapped[str] = mapped_column(String(36), ForeignKey("disease_registry.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    diagnosis_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    diagnosis_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    stage_at_diagnosis: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    treatment_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    follow_up_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    last_contact_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    data_quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class ChronicDiseaseProgram(Base):
    """Chronic disease management program."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    condition: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    goals: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    interventions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    monitoring_schedule: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    enrolled_patients: Mapped[int] = mapped_column(Integer, default=0)
    outcomes_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    cost_savings: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    program_lead: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")


class ProgramEnrollment(Base):
    """Patient enrollment in chronic disease program."""
    program_id: Mapped[str] = mapped_column(String(36), ForeignKey("chronic_disease_program.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    enrolled_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    last_assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    compliance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    progress_notes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class CareGap(Base):
    """Identified care gap for a patient."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    gap_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default=CareGapPriority.MEDIUM.value)
    measure_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    outreach_attempts: Mapped[int] = mapped_column(Integer, default=0)
    last_outreach: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class HealthEquityMetric(Base):
    """Health equity and disparity measurements."""
    metric_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    population_group: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    benchmark_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    disparity_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    measurement_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    data_source: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    trend: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    action_plan: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class CommunityResource(Base):
    """Community health resources."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    services: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    eligibility: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hours: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_verified: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class PublicHealthAlert(Base):
    """Public health alerts and notifications."""
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="moderate")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    affected_region: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    disease: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    case_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    issued_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    effective_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expiry_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class HealthScreeningCampaign(Base):
    """Public health screening campaigns."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    target_population: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    screening_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    target_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    screened_count: Mapped[int] = mapped_column(Integer, default=0)
    positive_count: Mapped[int] = mapped_column(Integer, default=0)
    false_positive_count: Mapped[int] = mapped_column(Integer, default=0)
    detection_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    budget: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="planned")
