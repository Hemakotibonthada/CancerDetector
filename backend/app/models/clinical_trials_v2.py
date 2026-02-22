"""
Enhanced Clinical Trials Models
=================================
Trial protocols, sites, participant management, visits,
adverse events, data collection, and monitoring.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class TrialPhase(str, enum.Enum):
    PHASE_I = "phase_i"
    PHASE_II = "phase_ii"
    PHASE_III = "phase_iii"
    PHASE_IV = "phase_iv"
    OBSERVATIONAL = "observational"


class ParticipantStatus(str, enum.Enum):
    SCREENED = "screened"
    ENROLLED = "enrolled"
    ACTIVE = "active"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"
    LOST_TO_FOLLOWUP = "lost_to_followup"
    SCREEN_FAILURE = "screen_failure"


class TrialProtocol(Base):
    """Clinical trial protocol definition."""
    nct_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, unique=True)
    protocol_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    short_title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    phase: Mapped[str] = mapped_column(String(20), default=TrialPhase.PHASE_II.value)
    study_type: Mapped[str] = mapped_column(String(30), default="interventional")
    sponsor: Mapped[str] = mapped_column(String(200), nullable=False)
    principal_investigator: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    study_drug: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    comparator: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    indication: Mapped[str] = mapped_column(String(300), nullable=False)
    cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    primary_endpoint: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    secondary_endpoints: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    inclusion_criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    exclusion_criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    target_enrollment: Mapped[int] = mapped_column(Integer, default=0)
    current_enrollment: Mapped[int] = mapped_column(Integer, default=0)
    randomization_ratio: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    blinding: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    treatment_arms: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    visit_schedule: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    duration_months: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="planning")
    irb_approval_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_completion: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    amendment_history: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    safety_monitoring_plan: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    data_safety_board: Mapped[bool] = mapped_column(Boolean, default=False)


class TrialSite(Base):
    """Clinical trial site."""
    protocol_id: Mapped[str] = mapped_column(String(36), ForeignKey("trial_protocol.id"), nullable=False)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    site_number: Mapped[str] = mapped_column(String(20), nullable=False)
    site_name: Mapped[str] = mapped_column(String(300), nullable=False)
    pi_name: Mapped[str] = mapped_column(String(200), nullable=False)
    pi_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    coordinator_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    coordinator_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending_activation")
    activation_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    enrolled_count: Mapped[int] = mapped_column(Integer, default=0)
    target_enrollment: Mapped[int] = mapped_column(Integer, default=0)
    screening_count: Mapped[int] = mapped_column(Integer, default=0)
    screen_fail_count: Mapped[int] = mapped_column(Integer, default=0)
    irb_approval_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    contract_signed: Mapped[bool] = mapped_column(Boolean, default=False)
    regulatory_docs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    last_monitoring_visit: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class TrialParticipant(Base):
    """Trial participant enrollment."""
    protocol_id: Mapped[str] = mapped_column(String(36), ForeignKey("trial_protocol.id"), nullable=False)
    site_id: Mapped[str] = mapped_column(String(36), ForeignKey("trial_site.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    subject_id: Mapped[str] = mapped_column(String(20), nullable=False)
    treatment_arm: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    randomization_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=ParticipantStatus.SCREENED.value)
    consent_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    screening_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    enrollment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    randomization_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    first_dose_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_dose_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_of_study_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    withdrawal_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    eligibility_criteria_met: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    screen_failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stratification_factors: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    dose_modifications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class TrialVisit(Base):
    """Scheduled and completed trial visits."""
    participant_id: Mapped[str] = mapped_column(String(36), ForeignKey("trial_participant.id"), nullable=False)
    visit_name: Mapped[str] = mapped_column(String(100), nullable=False)
    visit_number: Mapped[int] = mapped_column(Integer, nullable=False)
    visit_window_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    visit_window_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="scheduled")
    visit_type: Mapped[str] = mapped_column(String(30), default="on_site")
    procedures_required: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    procedures_completed: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    assessments_required: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    assessments_completed: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    vital_signs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    lab_results: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    study_drug_dispensed: Mapped[bool] = mapped_column(Boolean, default=False)
    study_drug_returned: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    compliance_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    query_count: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deviation_noted: Mapped[bool] = mapped_column(Boolean, default=False)


class TrialAdverseEvent(Base):
    """Clinical trial adverse event."""
    participant_id: Mapped[str] = mapped_column(String(36), ForeignKey("trial_participant.id"), nullable=False)
    protocol_id: Mapped[str] = mapped_column(String(36), ForeignKey("trial_protocol.id"), nullable=False)
    ae_number: Mapped[str] = mapped_column(String(20), nullable=False)
    term: Mapped[str] = mapped_column(String(300), nullable=False)
    meddra_pt: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    meddra_soc: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    ctcae_grade: Mapped[int] = mapped_column(Integer, default=1)
    onset_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ongoing: Mapped[bool] = mapped_column(Boolean, default=True)
    serious: Mapped[bool] = mapped_column(Boolean, default=False)
    sae_criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    causality: Mapped[str] = mapped_column(String(30), default="possible")
    action_taken: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    treatment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dose_modification: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reported_to_sponsor: Mapped[bool] = mapped_column(Boolean, default=False)
    reported_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    irb_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    expedited_report: Mapped[bool] = mapped_column(Boolean, default=False)
    narrative: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ConcomitantMedication(Base):
    """Concomitant medications during trial."""
    participant_id: Mapped[str] = mapped_column(String(36), ForeignKey("trial_participant.id"), nullable=False)
    medication_name: Mapped[str] = mapped_column(String(300), nullable=False)
    generic_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    indication: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    dose: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    route: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    frequency: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ongoing: Mapped[bool] = mapped_column(Boolean, default=True)
    prophylactic: Mapped[bool] = mapped_column(Boolean, default=False)
    protocol_required: Mapped[bool] = mapped_column(Boolean, default=False)


class DataCollectionForm(Base):
    """Electronic case report form (eCRF)."""
    protocol_id: Mapped[str] = mapped_column(String(36), ForeignKey("trial_protocol.id"), nullable=False)
    form_name: Mapped[str] = mapped_column(String(200), nullable=False)
    visit_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    form_version: Mapped[str] = mapped_column(String(20), default="1.0")
    fields: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    validation_rules: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    order_number: Mapped[int] = mapped_column(Integer, default=0)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")


class ProtocolDeviation(Base):
    """Protocol deviation documentation."""
    participant_id: Mapped[str] = mapped_column(String(36), ForeignKey("trial_participant.id"), nullable=False)
    protocol_id: Mapped[str] = mapped_column(String(36), ForeignKey("trial_protocol.id"), nullable=False)
    deviation_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="minor")
    root_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    corrective_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preventive_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    impact_on_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    irb_reportable: Mapped[bool] = mapped_column(Boolean, default=False)
    sponsor_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="pending_review")
