"""
Emergency & Critical Care Models
===================================
Triage, sepsis detection, stroke protocols, trauma registry,
code events, and mass casualty management.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class TriageLevel(str, enum.Enum):
    RESUSCITATION = "1_resuscitation"
    EMERGENT = "2_emergent"
    URGENT = "3_urgent"
    LESS_URGENT = "4_less_urgent"
    NON_URGENT = "5_non_urgent"


class CodeType(str, enum.Enum):
    BLUE = "code_blue"
    RED = "code_red"
    GREY = "code_grey"
    ORANGE = "code_orange"
    WHITE = "code_white"
    PINK = "code_pink"
    STROKE = "code_stroke"
    STEMI = "code_stemi"
    SEPSIS = "code_sepsis"
    TRAUMA = "code_trauma"


class TriageAssessment(Base):
    """Emergency triage assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    nurse_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    arrival_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    triage_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    triage_level: Mapped[str] = mapped_column(String(20), default=TriageLevel.URGENT.value)
    triage_system: Mapped[str] = mapped_column(String(20), default="ESI")
    chief_complaint: Mapped[str] = mapped_column(String(500), nullable=False)
    arrival_mode: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    vital_signs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    pain_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mental_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    airway_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    breathing_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    circulation_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    allergies: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    medications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    past_history: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    last_meal: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    isolation_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    disposition: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    seen_by_provider_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    boarding_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    lwbs: Mapped[bool] = mapped_column(Boolean, default=False)
    reassessment_interval_min: Mapped[int] = mapped_column(Integer, default=120)


class SepsisScreening(Base):
    """Sepsis early warning screening."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    screener_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    screening_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    screening_tool: Mapped[str] = mapped_column(String(30), default="qSOFA")
    sirs_criteria_met: Mapped[int] = mapped_column(Integer, default=0)
    temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    heart_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    respiratory_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wbc_count: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    systolic_bp: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mental_status_change: Mapped[bool] = mapped_column(Boolean, default=False)
    qsofa_score: Mapped[int] = mapped_column(Integer, default=0)
    sofa_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    lactate_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    procalcitonin: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    suspected_infection: Mapped[bool] = mapped_column(Boolean, default=False)
    infection_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sepsis_positive: Mapped[bool] = mapped_column(Boolean, default=False)
    septic_shock: Mapped[bool] = mapped_column(Boolean, default=False)
    bundle_initiated: Mapped[bool] = mapped_column(Boolean, default=False)
    bundle_completion_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    antibiotics_given_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fluids_given_ml: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    blood_cultures_drawn: Mapped[bool] = mapped_column(Boolean, default=False)
    vasopressors_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    icu_admission: Mapped[bool] = mapped_column(Boolean, default=False)
    outcome: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)


class StrokeAssessment(Base):
    """Stroke protocol assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    assessor_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    last_known_well: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    onset_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    arrival_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ct_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ct_result: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    nihss_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    nihss_details: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    stroke_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    tpa_eligible: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    tpa_administered: Mapped[bool] = mapped_column(Boolean, default=False)
    tpa_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    door_to_ct_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    door_to_needle_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    thrombectomy_eligible: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    thrombectomy_performed: Mapped[bool] = mapped_column(Boolean, default=False)
    lvo_detected: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    vessel_occlusion: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    blood_glucose: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    blood_pressure: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    anticoagulant_use: Mapped[bool] = mapped_column(Boolean, default=False)
    contraindications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    discharge_mrs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ninety_day_mrs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class CodeEvent(Base):
    """Emergency code event documentation."""
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    patient_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("patient.id"), nullable=True)
    code_type: Mapped[str] = mapped_column(String(20), nullable=False)
    called_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    called_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    team_leader: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    team_members: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    initial_rhythm: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    interventions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    medications_given: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    defibrillations: Mapped[int] = mapped_column(Integer, default=0)
    cpr_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rosc_achieved: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    rosc_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    family_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    debrief_conducted: Mapped[bool] = mapped_column(Boolean, default=False)
    debrief_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    documentation_complete: Mapped[bool] = mapped_column(Boolean, default=False)


class TraumaAssessment(Base):
    """Trauma registry and assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    trauma_team_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    incident_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    mechanism_of_injury: Mapped[str] = mapped_column(String(200), nullable=False)
    injury_type: Mapped[str] = mapped_column(String(50), nullable=False)
    trauma_level: Mapped[str] = mapped_column(String(10), nullable=False)
    gcs_eye: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gcs_verbal: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gcs_motor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gcs_total: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    iss_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ais_scores: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    rts_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    injuries: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    imaging_performed: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    procedures_performed: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    blood_products: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    massive_transfusion: Mapped[bool] = mapped_column(Boolean, default=False)
    or_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    icu_admission: Mapped[bool] = mapped_column(Boolean, default=False)
    icu_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ventilator_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hospital_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    discharge_disposition: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    preventable: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    registry_reported: Mapped[bool] = mapped_column(Boolean, default=False)


class RapidResponseTeam(Base):
    """Rapid response team activation."""
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    called_by: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    called_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    arrival_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    response_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    trigger_criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    primary_concern: Mapped[str] = mapped_column(String(300), nullable=False)
    vital_signs_at_call: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    team_members: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    assessment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    interventions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    disposition: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    icu_transfer: Mapped[bool] = mapped_column(Boolean, default=False)
    code_called: Mapped[bool] = mapped_column(Boolean, default=False)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    follow_up: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
