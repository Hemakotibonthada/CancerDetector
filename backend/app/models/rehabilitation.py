"""
Rehabilitation & Therapy Models
================================
Physical, occupational, and speech therapy, cardiac/pulmonary rehab,
functional assessments, exercise prescriptions, and milestones.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class RehabType(str, enum.Enum):
    PHYSICAL = "physical"
    OCCUPATIONAL = "occupational"
    SPEECH = "speech"
    CARDIAC = "cardiac"
    PULMONARY = "pulmonary"
    NEUROLOGICAL = "neurological"
    ONCOLOGY = "oncology"


class TherapyGoalStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    ACHIEVED = "achieved"
    MODIFIED = "modified"
    DISCONTINUED = "discontinued"


class RehabPlan(Base):
    """Comprehensive rehabilitation plan."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    therapist_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    referring_physician_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    rehab_type: Mapped[str] = mapped_column(String(30), default=RehabType.PHYSICAL.value)
    diagnosis: Mapped[str] = mapped_column(String(300), nullable=False)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expected_end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    frequency: Mapped[str] = mapped_column(String(50), default="3x/week")
    total_sessions_planned: Mapped[int] = mapped_column(Integer, default=12)
    sessions_completed: Mapped[int] = mapped_column(Integer, default=0)
    short_term_goals: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    long_term_goals: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    precautions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    contraindications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    overall_progress: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    discharge_criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    home_exercise_program: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    insurance_auth_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    authorized_visits: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class TherapySession(Base):
    """Individual therapy session record."""
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("rehab_plan.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    therapist_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    session_number: Mapped[int] = mapped_column(Integer, default=1)
    session_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=45)
    session_type: Mapped[str] = mapped_column(String(30), default="treatment")
    subjective: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    objective: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assessment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    interventions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    exercises_performed: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    modalities_used: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    pain_level_pre: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pain_level_post: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    progress_toward_goals: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    patient_compliance: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    home_program_compliance: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    billing_codes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    billing_units: Mapped[int] = mapped_column(Integer, default=0)
    next_session_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class FunctionalAssessment(Base):
    """Standardized functional assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    plan_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("rehab_plan.id"), nullable=True)
    assessor_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    assessment_type: Mapped[str] = mapped_column(String(100), nullable=False)
    assessment_tool: Mapped[str] = mapped_column(String(100), nullable=False)
    assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    subscale_scores: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    interpretation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    functional_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    limitations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    assistive_devices: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    comparison_to_baseline: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ExercisePrescription(Base):
    """Exercise prescription for rehab or wellness."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    prescriber_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    plan_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("rehab_plan.id"), nullable=True)
    exercise_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sets: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hold_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    frequency: Mapped[str] = mapped_column(String(50), default="daily")
    intensity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    target_heart_rate: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    progression_plan: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    precautions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")


class ProgressMilestone(Base):
    """Rehabilitation progress milestone."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("rehab_plan.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    achieved_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=TherapyGoalStatus.NOT_STARTED.value)
    measurement: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    baseline_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    current_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    celebration_badge_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)


class DisabilityScore(Base):
    """Disability and functional independence scoring."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    assessor_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scale_name: Mapped[str] = mapped_column(String(100), nullable=False)
    total_score: Mapped[float] = mapped_column(Float, default=0.0)
    domains: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    adl_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    iadl_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mobility_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cognition_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    communication_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    social_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    independence_level: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    care_needs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    equipment_needs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class PainManagementPlan(Base):
    """Comprehensive pain management plan."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    pain_type: Mapped[str] = mapped_column(String(50), nullable=False)
    pain_location: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    onset_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    pain_scale_baseline: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pain_scale_current: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pain_scale_goal: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pharmacological: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    non_pharmacological: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    interventional: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    functional_goals: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    opioid_risk_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    naloxone_prescribed: Mapped[bool] = mapped_column(Boolean, default=False)
    pain_agreement_signed: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="active")
    last_review_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_review_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
