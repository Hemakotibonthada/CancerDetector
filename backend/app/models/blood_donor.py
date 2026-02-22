"""
Blood Donor Models
==================

Models for blood donation management including donor profiles,
blood requests, donor matching, and donation tracking.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class BloodGroup(str, enum.Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"


class DonorStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TEMPORARILY_UNAVAILABLE = "temporarily_unavailable"
    PERMANENTLY_INELIGIBLE = "permanently_ineligible"
    COOLDOWN = "cooldown"


class RequestUrgency(str, enum.Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    EMERGENCY = "emergency"
    CRITICAL = "critical"


class RequestStatus(str, enum.Enum):
    OPEN = "open"
    PARTIALLY_FULFILLED = "partially_fulfilled"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class MatchStatus(str, enum.Enum):
    PENDING = "pending"
    NOTIFIED = "notified"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class DonationStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"


class BloodDonor(Base):
    """Blood donor profile linked to a user."""
    __tablename__ = "blood_donors"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    blood_group: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    donor_status: Mapped[str] = mapped_column(
        String(30), default=DonorStatus.ACTIVE.value, nullable=False, index=True
    )

    # Location for proximity matching
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    max_distance_km: Mapped[float] = mapped_column(Float, default=25.0, nullable=False)

    # Eligibility
    date_of_birth: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    health_eligible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_health_check: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    medical_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON

    # Donation history
    total_donations: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_donation_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    next_eligible_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Preferences
    notification_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sms_alerts: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    available_days: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # JSON array
    preferred_time: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Verification
    id_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    blood_type_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("ix_blood_donor_location", "latitude", "longitude"),
        Index("ix_blood_donor_group_status", "blood_group", "donor_status"),
    )


class BloodRequest(Base):
    """A request for blood from a hospital or patient."""
    __tablename__ = "blood_requests"

    requester_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospitals.id", ondelete="SET NULL"),
        nullable=True, index=True
    )
    patient_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    blood_group: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    units_needed: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    units_fulfilled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    urgency: Mapped[str] = mapped_column(
        String(20), default=RequestUrgency.ROUTINE.value, nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(30), default=RequestStatus.OPEN.value, nullable=False, index=True
    )

    # Location
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hospital_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    hospital_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Timing
    needed_by: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Search radius
    search_radius_km: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    donors_notified: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        Index("ix_blood_request_group_status", "blood_group", "status"),
        Index("ix_blood_request_urgency", "urgency", "status"),
    )


class BloodDonorMatch(Base):
    """A match between a blood request and a potential donor."""
    __tablename__ = "blood_donor_matches"

    request_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("blood_requests.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    donor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("blood_donors.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    donor_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    status: Mapped[str] = mapped_column(
        String(20), default=MatchStatus.PENDING.value, nullable=False, index=True
    )
    distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    notified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    response_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    scheduled_location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    __table_args__ = (
        Index("ix_match_request_status", "request_id", "status"),
        Index("ix_match_donor_status", "donor_id", "status"),
    )


class DonationRecord(Base):
    """Record of a completed or scheduled blood donation."""
    __tablename__ = "donation_records"

    donor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("blood_donors.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    match_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("blood_donor_matches.id", ondelete="SET NULL"),
        nullable=True
    )
    request_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("blood_requests.id", ondelete="SET NULL"),
        nullable=True
    )

    donation_status: Mapped[str] = mapped_column(
        String(20), default=DonationStatus.SCHEDULED.value, nullable=False, index=True
    )
    blood_group: Mapped[str] = mapped_column(String(10), nullable=False)
    units_donated: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    donation_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    donation_center: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    donation_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    hemoglobin_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    blood_pressure: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    pulse_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    certificate_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    __table_args__ = (
        Index("ix_donation_donor_status", "donor_id", "donation_status"),
    )
