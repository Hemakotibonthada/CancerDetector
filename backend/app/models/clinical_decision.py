"""
Clinical Decision Support Models
=================================
Clinical pathways, drug interactions, guidelines, protocols,
calculators, alerts, and order sets for evidence-based care.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class PathwayStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    RETIRED = "retired"
    UNDER_REVIEW = "under_review"


class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    CONTRAINDICATED = "contraindicated"


class InteractionSeverity(str, enum.Enum):
    MINOR = "minor"
    MODERATE = "moderate"
    MAJOR = "major"
    CONTRAINDICATED = "contraindicated"


class GuidelineCategory(str, enum.Enum):
    SCREENING = "screening"
    DIAGNOSIS = "diagnosis"
    TREATMENT = "treatment"
    FOLLOW_UP = "follow_up"
    PREVENTION = "prevention"
    PALLIATIVE = "palliative"


class ClinicalPathway(Base):
    """Evidence-based clinical care pathway."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    condition: Mapped[str] = mapped_column(String(200), nullable=False)
    cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pathway_version: Mapped[str] = mapped_column(String(20), default="1.0")
    status: Mapped[str] = mapped_column(String(20), default=PathwayStatus.DRAFT.value)
    steps: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    decision_points: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    expected_duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    evidence_level: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    source_guideline: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)


class PatientPathwayEnrollment(Base):
    """Patient enrolled in a clinical pathway."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    pathway_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinical_pathway.id"), nullable=False)
    enrolled_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(30), default="active")
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deviations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    outcomes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class DrugInteraction(Base):
    """Drug-drug interaction reference."""
    drug_a: Mapped[str] = mapped_column(String(200), nullable=False)
    drug_a_rxnorm: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    drug_b: Mapped[str] = mapped_column(String(200), nullable=False)
    drug_b_rxnorm: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default=InteractionSeverity.MODERATE.value)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mechanism: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    clinical_effect: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    management: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_level: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_cancer_relevant: Mapped[bool] = mapped_column(Boolean, default=False)


class ClinicalGuideline(Base):
    """Evidence-based clinical guideline."""
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(30), default=GuidelineCategory.TREATMENT.value)
    condition: Mapped[str] = mapped_column(String(200), nullable=False)
    cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    evidence_grade: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    source_organization: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    publication_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expiry_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")


class ClinicalCalculator(Base):
    """Clinical risk and scoring calculator."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    formula_type: Mapped[str] = mapped_column(String(50), nullable=False)
    input_parameters: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    output_ranges: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    interpretation: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    validation_source: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_cancer_specific: Mapped[bool] = mapped_column(Boolean, default=False)


class ClinicalCalculatorResult(Base):
    """Result from a clinical calculator."""
    calculator_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinical_calculator.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    calculated_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    input_values: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    result_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    result_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    interpretation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ClinicalAlert(Base):
    """System-generated clinical alert."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default=AlertSeverity.WARNING.value)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    trigger_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    trigger_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    acknowledged_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    action_taken: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    overridden: Mapped[bool] = mapped_column(Boolean, default=False)
    override_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class OrderSet(Base):
    """Pre-defined clinical order set."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    condition: Mapped[str] = mapped_column(String(200), nullable=False)
    orders: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    medications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    labs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    imaging: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    nursing_orders: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    diet_orders: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    activity_orders: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)


class BestPracticeAdvisory(Base):
    """Best practice advisory alert rule."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    trigger_condition: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_source: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default=AlertSeverity.INFO.value)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    is_interruptive: Mapped[bool] = mapped_column(Boolean, default=False)
    override_allowed: Mapped[bool] = mapped_column(Boolean, default=True)
    override_reasons: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    times_fired: Mapped[int] = mapped_column(Integer, default=0)
    times_overridden: Mapped[int] = mapped_column(Integer, default=0)
    acceptance_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
