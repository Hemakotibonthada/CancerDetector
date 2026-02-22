"""
Communication & Collaboration Models
======================================
Secure messaging, care teams, referrals, clinical handoffs,
consent management, and care coordination.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class MessagePriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class ReferralStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class HandoffType(str, enum.Enum):
    SHIFT = "shift"
    TRANSFER = "transfer"
    DISCHARGE = "discharge"
    ESCALATION = "escalation"


class SecureMessage(Base):
    """Secure messaging between providers and patients."""
    sender_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    recipient_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default=MessagePriority.NORMAL.value)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    thread_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    parent_message_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    attachments: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    message_type: Mapped[str] = mapped_column(String(30), default="general")
    patient_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("patient.id"), nullable=True)


class CareTeam(Base):
    """Multi-disciplinary care team."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    team_type: Mapped[str] = mapped_column(String(50), nullable=False)
    lead_provider_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    formation_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    goals: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class CareTeamMember(Base):
    """Care team member assignment."""
    care_team_id: Mapped[str] = mapped_column(String(36), ForeignKey("care_team.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    specialty: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    responsibilities: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    joined_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    contact_preference: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class Referral(Base):
    """Patient referral between providers."""
    referring_provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    receiving_provider_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    referral_type: Mapped[str] = mapped_column(String(50), nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    urgency: Mapped[str] = mapped_column(String(20), default="routine")
    status: Mapped[str] = mapped_column(String(20), default=ReferralStatus.PENDING.value)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    diagnosis_codes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    preferred_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    insurance_preauth_required: Mapped[bool] = mapped_column(Boolean, default=False)
    preauth_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    attachments: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    follow_up_required: Mapped[bool] = mapped_column(Boolean, default=True)


class ClinicalHandoff(Base):
    """Clinical handoff between caregivers."""
    sender_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    receiver_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    handoff_type: Mapped[str] = mapped_column(String(20), default=HandoffType.SHIFT.value)
    situation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    background: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assessment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active_problems: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    pending_tasks: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    medications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    allergies: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    code_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    isolation_precautions: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class ConsentForm(Base):
    """Patient consent form management."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    consent_type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    document_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    witness_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    witness_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    electronic_signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class CareCoordinationTask(Base):
    """Care coordination task tracking."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    care_team_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("care_team.id"), nullable=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    assigned_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="normal")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    checklist: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    dependencies: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class CommunicationPreference(Base):
    """Patient communication preferences."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(20), default="en")
    preferred_method: Mapped[str] = mapped_column(String(30), default="email")
    phone_consent: Mapped[bool] = mapped_column(Boolean, default=True)
    sms_consent: Mapped[bool] = mapped_column(Boolean, default=True)
    email_consent: Mapped[bool] = mapped_column(Boolean, default=True)
    push_consent: Mapped[bool] = mapped_column(Boolean, default=True)
    mail_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    quiet_hours_start: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    quiet_hours_end: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    proxy_access: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
