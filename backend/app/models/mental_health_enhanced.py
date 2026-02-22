"""
Enhanced Mental Health & Behavioral Health Models
===================================================
CBT, mindfulness, crisis intervention, safety plans,
substance use, behavioral goals, and screening tools.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class CrisisLevel(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    IMMINENT = "imminent"


class SubstanceType(str, enum.Enum):
    ALCOHOL = "alcohol"
    TOBACCO = "tobacco"
    CANNABIS = "cannabis"
    OPIOIDS = "opioids"
    STIMULANTS = "stimulants"
    SEDATIVES = "sedatives"
    OTHER = "other"


class CBTSession(Base):
    """Cognitive Behavioral Therapy session."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    therapist_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    session_number: Mapped[int] = mapped_column(Integer, default=1)
    session_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=50)
    module: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    presenting_issues: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    cognitive_distortions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    automatic_thoughts: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    thought_record: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    behavioral_experiments: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    homework_assigned: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    homework_review: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mood_rating_pre: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mood_rating_post: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    anxiety_rating_pre: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    anxiety_rating_post: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    techniques_used: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    progress_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_session_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phq9_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gad7_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class MindfulnessExercise(Base):
    """Mindfulness and meditation exercises."""
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=10)
    difficulty: Mapped[str] = mapped_column(String(20), default="beginner")
    audio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    benefits: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    suitable_for: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    average_rating: Mapped[float] = mapped_column(Float, default=0.0)


class MindfulnessSession(Base):
    """Patient mindfulness session record."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    exercise_id: Mapped[str] = mapped_column(String(36), ForeignKey("mindfulness_exercise.id"), nullable=False)
    session_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    mood_before: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mood_after: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stress_before: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stress_after: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class CrisisIntervention(Base):
    """Crisis intervention record."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    clinician_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    crisis_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    crisis_type: Mapped[str] = mapped_column(String(100), nullable=False)
    crisis_level: Mapped[str] = mapped_column(String(20), default=CrisisLevel.MODERATE.value)
    trigger: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    suicidal_ideation: Mapped[bool] = mapped_column(Boolean, default=False)
    si_plan: Mapped[bool] = mapped_column(Boolean, default=False)
    si_intent: Mapped[bool] = mapped_column(Boolean, default=False)
    si_means_access: Mapped[bool] = mapped_column(Boolean, default=False)
    homicidal_ideation: Mapped[bool] = mapped_column(Boolean, default=False)
    self_harm: Mapped[bool] = mapped_column(Boolean, default=False)
    columbia_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    interventions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    safety_plan_reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    means_restriction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    disposition: Mapped[str] = mapped_column(String(50), nullable=False)
    follow_up_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emergency_contact_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    hospitalization_recommended: Mapped[bool] = mapped_column(Boolean, default=False)
    hospitalization_accepted: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)


class SafetyPlan(Base):
    """Patient safety plan for crisis prevention."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    clinician_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    warning_signs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    internal_coping_strategies: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    social_contacts: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    family_contacts: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    professional_contacts: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    crisis_resources: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    environment_safety: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    reasons_for_living: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    last_reviewed: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    patient_has_copy: Mapped[bool] = mapped_column(Boolean, default=False)


class SubstanceUseLog(Base):
    """Substance use tracking for recovery."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    substance_type: Mapped[str] = mapped_column(String(30), default=SubstanceType.ALCOHOL.value)
    substance_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    log_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    amount: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    frequency: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    route: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    triggers: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    cravings_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    coping_strategies_used: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    context: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sobriety_days: Mapped[int] = mapped_column(Integer, default=0)


class BehavioralGoal(Base):
    """Behavioral health goal tracking."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    clinician_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    goal_category: Mapped[str] = mapped_column(String(50), nullable=False)
    goal_description: Mapped[str] = mapped_column(String(500), nullable=False)
    target_behavior: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    baseline_frequency: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    target_frequency: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    measurement_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    target_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="active")
    barriers: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    interventions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    reinforcements: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    daily_tracking: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    last_updated: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class MentalHealthScreening(Base):
    """Standardized mental health screening results."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    screener_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    screening_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    tool_name: Mapped[str] = mapped_column(String(50), nullable=False)
    total_score: Mapped[int] = mapped_column(Integer, default=0)
    severity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    item_responses: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    interpretation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    critical_items_flagged: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    follow_up_recommended: Mapped[bool] = mapped_column(Boolean, default=False)
    referral_made: Mapped[bool] = mapped_column(Boolean, default=False)
    provider_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    comparison_to_previous: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class GroupTherapySession(Base):
    """Group therapy session record."""
    group_name: Mapped[str] = mapped_column(String(200), nullable=False)
    facilitator_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    session_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=90)
    therapy_type: Mapped[str] = mapped_column(String(50), nullable=False)
    topic: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    participants: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    participant_count: Mapped[int] = mapped_column(Integer, default=0)
    activities: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    themes_discussed: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    group_dynamics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_session_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
