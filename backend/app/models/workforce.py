"""
Staff & Workforce Management Models
======================================
Staff scheduling, shift management, credentialing,
performance reviews, and workforce analytics.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ShiftType(str, enum.Enum):
    DAY = "day"
    EVENING = "evening"
    NIGHT = "night"
    SWING = "swing"
    ON_CALL = "on_call"


class LeaveType(str, enum.Enum):
    VACATION = "vacation"
    SICK = "sick"
    PERSONAL = "personal"
    MATERNITY = "maternity"
    BEREAVEMENT = "bereavement"
    FMLA = "fmla"


class StaffProfile(Base):
    """Extended staff profile for workforce management."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    employee_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, unique=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    job_title: Mapped[str] = mapped_column(String(200), nullable=False)
    specialty: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    hire_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    npi_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    license_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    license_state: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    license_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    dea_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    dea_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fte: Mapped[float] = mapped_column(Float, default=1.0)
    shift_preference: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    max_hours_per_week: Mapped[int] = mapped_column(Integer, default=40)
    overtime_eligible: Mapped[bool] = mapped_column(Boolean, default=True)
    skills: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    languages: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    emergency_contact: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    performance_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")


class ShiftSchedule(Base):
    """Staff shift scheduling."""
    staff_id: Mapped[str] = mapped_column(String(36), ForeignKey("staff_profile.id"), nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    shift_type: Mapped[str] = mapped_column(String(20), default=ShiftType.DAY.value)
    shift_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    break_minutes: Mapped[int] = mapped_column(Integer, default=30)
    is_overtime: Mapped[bool] = mapped_column(Boolean, default=False)
    is_on_call: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="scheduled")
    actual_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    hours_worked: Mapped[float] = mapped_column(Float, default=0.0)
    assignment: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    swap_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    swap_with: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class LeaveRequest(Base):
    """Employee leave request."""
    staff_id: Mapped[str] = mapped_column(String(36), ForeignKey("staff_profile.id"), nullable=False)
    leave_type: Mapped[str] = mapped_column(String(20), default=LeaveType.VACATION.value)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    hours_requested: Mapped[float] = mapped_column(Float, default=8.0)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    approved_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    approved_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    denial_reason: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    documentation_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class CredentialingRecord(Base):
    """Provider credentialing and privileging."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    credential_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    application_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    privileges_granted: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    restrictions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    primary_source_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    background_check: Mapped[bool] = mapped_column(Boolean, default=False)
    malpractice_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    oig_checked: Mapped[bool] = mapped_column(Boolean, default=False)
    npdb_queried: Mapped[bool] = mapped_column(Boolean, default=False)
    committee_review_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    board_approved_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    documents: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    reappointment_due: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class PerformanceReview(Base):
    """Staff performance review."""
    staff_id: Mapped[str] = mapped_column(String(36), ForeignKey("staff_profile.id"), nullable=False)
    reviewer_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    review_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    review_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    review_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    overall_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    clinical_competency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    communication: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    teamwork: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    professionalism: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    patient_satisfaction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quality_of_care: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    documentation_quality: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    strengths: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    areas_for_improvement: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    goals: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    employee_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewer_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    development_plan: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    employee_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)


class StaffingMetrics(Base):
    """Department staffing level metrics."""
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    metric_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    budgeted_fte: Mapped[float] = mapped_column(Float, default=0.0)
    actual_fte: Mapped[float] = mapped_column(Float, default=0.0)
    vacancy_rate: Mapped[float] = mapped_column(Float, default=0.0)
    turnover_rate: Mapped[float] = mapped_column(Float, default=0.0)
    overtime_hours: Mapped[float] = mapped_column(Float, default=0.0)
    agency_hours: Mapped[float] = mapped_column(Float, default=0.0)
    patient_to_nurse_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    skill_mix: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    call_outs: Mapped[int] = mapped_column(Integer, default=0)
    open_positions: Mapped[int] = mapped_column(Integer, default=0)
    satisfaction_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    burnout_index: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
