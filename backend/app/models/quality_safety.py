"""
Quality & Safety Models
========================
Adverse events, incident reports, quality measures,
infection control, safety checklists, and root cause analysis.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class IncidentSeverity(str, enum.Enum):
    NEAR_MISS = "near_miss"
    NO_HARM = "no_harm"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    DEATH = "death"


class QualityMeasureType(str, enum.Enum):
    PROCESS = "process"
    OUTCOME = "outcome"
    STRUCTURE = "structure"
    PATIENT_EXPERIENCE = "patient_experience"


class AdverseEvent(Base):
    """Adverse event reporting (pharmacovigilance)."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    reporter_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    event_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default=IncidentSeverity.MILD.value)
    causality_assessment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    suspected_medication: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    suspected_device: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    action_taken: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fda_reported: Mapped[bool] = mapped_column(Boolean, default=False)
    medwatch_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    follow_up_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolution_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    contributing_factors: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class IncidentReport(Base):
    """Hospital incident/safety report."""
    reporter_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    patient_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("patient.id"), nullable=True)
    incident_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    incident_type: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default=IncidentSeverity.NO_HARM.value)
    immediate_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    witnesses: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="reported")
    investigation_status: Mapped[str] = mapped_column(String(20), default="pending")
    corrective_actions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    root_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preventable: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    anonymous: Mapped[bool] = mapped_column(Boolean, default=False)


class QualityMeasure(Base):
    """Healthcare quality measure tracking (NQF/HEDIS)."""
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    measure_id: Mapped[str] = mapped_column(String(50), nullable=False)
    measure_name: Mapped[str] = mapped_column(String(300), nullable=False)
    measure_type: Mapped[str] = mapped_column(String(30), default=QualityMeasureType.PROCESS.value)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    numerator: Mapped[int] = mapped_column(Integer, default=0)
    denominator: Mapped[int] = mapped_column(Integer, default=0)
    rate: Mapped[float] = mapped_column(Float, default=0.0)
    target_rate: Mapped[float] = mapped_column(Float, default=0.0)
    benchmark: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reporting_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reporting_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    data_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    nqf_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    cms_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    exclusions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    improvement_actions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class InfectionControlRecord(Base):
    """Hospital-acquired infection tracking."""
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    infection_type: Mapped[str] = mapped_column(String(100), nullable=False)
    organism: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    site: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    onset_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    detection_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_hai: Mapped[bool] = mapped_column(Boolean, default=False)
    hai_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    device_related: Mapped[bool] = mapped_column(Boolean, default=False)
    device_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    antibiotic_resistance: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    treatment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    isolation_precautions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    nhsn_reported: Mapped[bool] = mapped_column(Boolean, default=False)
    contact_tracing_done: Mapped[bool] = mapped_column(Boolean, default=False)


class SafetyChecklist(Base):
    """Safety checklist template and completion."""
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    checklist_type: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    items: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    frequency: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    applicable_departments: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class ChecklistCompletion(Base):
    """Record of checklist completion."""
    checklist_id: Mapped[str] = mapped_column(String(36), ForeignKey("safety_checklist.id"), nullable=False)
    patient_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("patient.id"), nullable=True)
    completed_by: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    responses: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    all_items_passed: Mapped[bool] = mapped_column(Boolean, default=True)
    exceptions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    verified_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class RootCauseAnalysis(Base):
    """Root cause analysis for serious events."""
    incident_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("incident_report.id"), nullable=True)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    lead_investigator_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    event_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timeline: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    root_causes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    contributing_factors: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    methodology: Mapped[str] = mapped_column(String(50), default="fishbone")
    findings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    action_plan: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    started_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    review_board_approved: Mapped[bool] = mapped_column(Boolean, default=False)


class FallRiskAssessment(Base):
    """Patient fall risk assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    assessor_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    tool_used: Mapped[str] = mapped_column(String(50), default="morse")
    total_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_level: Mapped[str] = mapped_column(String(20), default="low")
    factors: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    interventions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    fall_history: Mapped[bool] = mapped_column(Boolean, default=False)
    mobility_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    medications_risk: Mapped[bool] = mapped_column(Boolean, default=False)
    cognitive_impairment: Mapped[bool] = mapped_column(Boolean, default=False)
    next_assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class PressureInjuryAssessment(Base):
    """Braden scale pressure injury risk assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    assessor_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sensory_perception: Mapped[int] = mapped_column(Integer, default=4)
    moisture: Mapped[int] = mapped_column(Integer, default=4)
    activity: Mapped[int] = mapped_column(Integer, default=4)
    mobility: Mapped[int] = mapped_column(Integer, default=4)
    nutrition: Mapped[int] = mapped_column(Integer, default=4)
    friction_shear: Mapped[int] = mapped_column(Integer, default=3)
    total_score: Mapped[int] = mapped_column(Integer, default=23)
    risk_level: Mapped[str] = mapped_column(String(20), default="no_risk")
    interventions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    existing_injuries: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    skin_assessment_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
