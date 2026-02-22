"""
Telehealth & Virtual Care Models
==================================
Video sessions, virtual waiting rooms, remote monitoring,
digital consent, e-prescriptions, and chat.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SessionStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class MonitoringFrequency(str, enum.Enum):
    CONTINUOUS = "continuous"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class VideoSession(Base):
    """Telehealth video consultation session."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    appointment_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    session_token: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    room_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=SessionStatus.SCHEDULED.value)
    scheduled_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    visit_type: Mapped[str] = mapped_column(String(50), default="follow_up")
    chief_complaint: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    patient_satisfaction: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    technical_issues: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    recording_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    recording_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    screen_share_used: Mapped[bool] = mapped_column(Boolean, default=False)
    interpreter_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    interpreter_language: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    diagnoses: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    prescriptions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    follow_up_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bandwidth_quality: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)


class VirtualWaitingRoom(Base):
    """Virtual waiting room management."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("video_session.id"), nullable=True)
    check_in_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    called_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    wait_time_minutes: Mapped[int] = mapped_column(Integer, default=0)
    position_in_queue: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="waiting")
    intake_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    intake_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    vitals_submitted: Mapped[bool] = mapped_column(Boolean, default=False)
    vitals_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    reason_for_visit: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class RemoteMonitoringPlan(Base):
    """Remote patient monitoring plan."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    plan_name: Mapped[str] = mapped_column(String(200), nullable=False)
    condition: Mapped[str] = mapped_column(String(200), nullable=False)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    monitoring_parameters: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    frequency: Mapped[str] = mapped_column(String(20), default=MonitoringFrequency.DAILY.value)
    alert_thresholds: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    devices_assigned: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    compliance_rate: Mapped[float] = mapped_column(Float, default=0.0)
    last_data_received: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    alerts_triggered: Mapped[int] = mapped_column(Integer, default=0)
    escalation_protocol: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    billing_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)


class RemoteMonitoringData(Base):
    """Data collected from remote monitoring devices."""
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("remote_monitoring_plan.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    device_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    parameter_name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    recorded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_within_range: Mapped[bool] = mapped_column(Boolean, default=True)
    alert_triggered: Mapped[bool] = mapped_column(Boolean, default=False)
    alert_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class EPrescription(Base):
    """Electronic prescription."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    prescriber_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("video_session.id"), nullable=True)
    medication_name: Mapped[str] = mapped_column(String(300), nullable=False)
    generic_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    ndc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    form: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    route: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=30)
    refills: Mapped[int] = mapped_column(Integer, default=0)
    daw_code: Mapped[Optional[str]] = mapped_column(String(2), nullable=True)
    pharmacy_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    pharmacy_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    filled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_controlled: Mapped[bool] = mapped_column(Boolean, default=False)
    schedule: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    warnings: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    digital_signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class TelehealthChat(Base):
    """Real-time chat within telehealth session."""
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("video_session.id"), nullable=False)
    sender_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    message_type: Mapped[str] = mapped_column(String(20), default="text")
    attachment_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_system_message: Mapped[bool] = mapped_column(Boolean, default=False)


class TelehealthConsent(Base):
    """Telehealth-specific consent form."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    consent_type: Mapped[str] = mapped_column(String(50), default="telehealth")
    state_licensed: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    patient_location_state: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    signed: Mapped[bool] = mapped_column(Boolean, default=False)
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    technology_risks_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    privacy_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    emergency_plan_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
