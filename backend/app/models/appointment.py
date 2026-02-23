"""
Appointment Model
"""
from __future__ import annotations
import enum
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, AuditMixin

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"
    WAITLISTED = "waitlisted"

class AppointmentType(str, enum.Enum):
    CONSULTATION = "consultation"
    FOLLOW_UP = "follow_up"
    SCREENING = "screening"
    LAB_TEST = "lab_test"
    IMAGING = "imaging"
    SURGERY = "surgery"
    CHEMOTHERAPY = "chemotherapy"
    RADIATION = "radiation"
    IMMUNOTHERAPY = "immunotherapy"
    CHECKUP = "checkup"
    EMERGENCY = "emergency"
    TELEMEDICINE = "telemedicine"
    GENETIC_COUNSELING = "genetic_counseling"
    SECOND_OPINION = "second_opinion"
    PRE_OP = "pre_op"
    POST_OP = "post_op"
    VACCINATION = "vaccination"
    PHYSICAL_THERAPY = "physical_therapy"
    OTHER = "other"

class Appointment(Base, AuditMixin):
    __tablename__ = "appointments"
    
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id", ondelete="CASCADE"), nullable=False, index=True)
    health_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    department_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital_departments.id"), nullable=True)
    
    appointment_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    appointment_type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=AppointmentStatus.SCHEDULED.value, nullable=False, index=True)
    priority: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    scheduled_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    
    check_in_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    actual_start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    actual_end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    is_telemedicine: Mapped[bool] = mapped_column(Boolean, default=False)
    telemedicine_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_pattern: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    parent_appointment_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    cancelled_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    rescheduled_from: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    insurance_claim_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    payment_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    health_record_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("health_records.id"), nullable=True)
    
    patient_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    patient_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    __table_args__ = (
        Index("ix_appt_patient_date", "patient_id", "scheduled_date"),
        Index("ix_appt_doctor_date", "doctor_id", "scheduled_date"),
        Index("ix_appt_status_date", "status", "scheduled_date"),
    )
