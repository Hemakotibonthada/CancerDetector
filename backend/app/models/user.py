"""
User Model - Authentication and Authorization
==============================================

Comprehensive user model supporting patients, hospital staff, and administrators
with role-based access control, session management, and user preferences.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Text, Float,
    Enum, ForeignKey, JSON, Index, UniqueConstraint, Table,
    event
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, AuditMixin


# ============================================================================
# Enums
# ============================================================================

class UserRole(str, enum.Enum):
    """User role enumeration."""
    PATIENT = "patient"
    DOCTOR = "doctor"
    NURSE = "nurse"
    LAB_TECHNICIAN = "lab_technician"
    PHARMACIST = "pharmacist"
    HOSPITAL_ADMIN = "hospital_admin"
    SYSTEM_ADMIN = "system_admin"
    SUPER_ADMIN = "super_admin"
    RESEARCHER = "researcher"
    INSURANCE_AGENT = "insurance_agent"
    RECEPTIONIST = "receptionist"
    RADIOLOGIST = "radiologist"
    PATHOLOGIST = "pathologist"
    ONCOLOGIST = "oncologist"
    SURGEON = "surgeon"
    CARDIOLOGIST = "cardiologist"
    NEUROLOGIST = "neurologist"
    DERMATOLOGIST = "dermatologist"
    GENERAL_PRACTITIONER = "general_practitioner"
    SPECIALIST = "specialist"
    EMERGENCY_PHYSICIAN = "emergency_physician"
    ANESTHESIOLOGIST = "anesthesiologist"
    DATA_ANALYST = "data_analyst"
    SUPPORT_STAFF = "support_staff"


class UserStatus(str, enum.Enum):
    """User account status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    BANNED = "banned"
    PENDING_VERIFICATION = "pending_verification"
    PENDING_APPROVAL = "pending_approval"
    DEACTIVATED = "deactivated"
    LOCKED = "locked"
    ARCHIVED = "archived"


class Gender(str, enum.Enum):
    """Gender enumeration."""
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non_binary"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"
    OTHER = "other"


class BloodGroup(str, enum.Enum):
    """Blood group enumeration."""
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    UNKNOWN = "unknown"


# ============================================================================
# User Model
# ============================================================================

class User(Base, AuditMixin):
    """
    Primary user model for all system users.
    
    Supports:
    - Multiple roles (patient, doctor, admin, etc.)
    - Authentication (password, OAuth, 2FA)
    - Profile management
    - Session tracking
    - Account status management
    """
    
    __tablename__ = "users"
    
    # Authentication fields
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    username: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    
    # Personal Information
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    date_of_birth: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    blood_group: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    
    # Contact Information
    phone_number: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True, index=True
    )
    alternate_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Address
    address_line1: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Role and Status
    role: Mapped[str] = mapped_column(
        String(50), default=UserRole.PATIENT.value, nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(50), default=UserStatus.ACTIVE.value, nullable=False, index=True
    )
    
    # Health ID
    health_id: Mapped[Optional[str]] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )
    
    # Profile
    profile_photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Authentication metadata
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    two_factor_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Security
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_login_ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # OAuth
    oauth_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    oauth_provider_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Metadata
    timezone: Mapped[Optional[str]] = mapped_column(
        String(50), default="UTC", nullable=True
    )
    language: Mapped[Optional[str]] = mapped_column(
        String(10), default="en", nullable=True
    )
    notification_preferences: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True  # JSON stored as text
    )
    
    # Organization
    hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospitals.id"), nullable=True
    )
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospital_departments.id"), nullable=True
    )
    
    # Terms and Consent
    accepted_terms_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    privacy_consent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    data_sharing_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    research_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession", back_populates="user", cascade="all, delete-orphan"
    )
    preferences: Mapped[List["UserPreference"]] = relationship(
        "UserPreference", back_populates="user", cascade="all, delete-orphan"
    )
    
    # Indexes
    __table_args__ = (
        Index("ix_users_email_status", "email", "status"),
        Index("ix_users_role_status", "role", "status"),
        Index("ix_users_name", "first_name", "last_name"),
    )
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        parts = [self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        parts.append(self.last_name)
        return " ".join(parts)
    
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role in [
            UserRole.SYSTEM_ADMIN.value,
            UserRole.SUPER_ADMIN.value,
            UserRole.HOSPITAL_ADMIN.value
        ]
    
    @property
    def is_medical_staff(self) -> bool:
        """Check if user is medical staff."""
        medical_roles = [
            UserRole.DOCTOR.value, UserRole.NURSE.value,
            UserRole.ONCOLOGIST.value, UserRole.SURGEON.value,
            UserRole.RADIOLOGIST.value, UserRole.PATHOLOGIST.value,
            UserRole.CARDIOLOGIST.value, UserRole.NEUROLOGIST.value,
            UserRole.DERMATOLOGIST.value, UserRole.GENERAL_PRACTITIONER.value,
            UserRole.SPECIALIST.value, UserRole.EMERGENCY_PHYSICIAN.value,
            UserRole.ANESTHESIOLOGIST.value,
        ]
        return self.role in medical_roles
    
    @property
    def is_locked(self) -> bool:
        """Check if the account is locked."""
        if self.locked_until and self.locked_until > datetime.now(timezone.utc):
            return True
        return self.status == UserStatus.LOCKED.value
    
    @property
    def age(self) -> Optional[int]:
        """Calculate user's age."""
        if self.date_of_birth:
            today = datetime.now(timezone.utc).date()
            dob = self.date_of_birth.date() if isinstance(self.date_of_birth, datetime) else self.date_of_birth
            return today.year - dob.year - (
                (today.month, today.day) < (dob.month, dob.day)
            )
        return None
    
    def record_login(self, ip_address: str = None) -> None:
        """Record a successful login."""
        self.last_login = datetime.now(timezone.utc)
        self.last_login_ip = ip_address
        self.failed_login_attempts = 0
        self.locked_until = None
    
    def record_failed_login(self, max_attempts: int = 5, lockout_minutes: int = 30) -> bool:
        """Record a failed login attempt. Returns True if account gets locked."""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= max_attempts:
            self.locked_until = datetime.now(timezone.utc) + timedelta(minutes=lockout_minutes)
            self.status = UserStatus.LOCKED.value
            return True
        return False


# ============================================================================
# User Session Model
# ============================================================================

class UserSession(Base):
    """
    User session tracking for security and analytics.
    
    Tracks active sessions, devices, and locations.
    """
    
    __tablename__ = "user_sessions"
    
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    # Session Info
    session_token: Mapped[str] = mapped_column(
        String(500), unique=True, nullable=False, index=True
    )
    refresh_token: Mapped[Optional[str]] = mapped_column(
        String(500), unique=True, nullable=True
    )
    
    # Device Info
    device_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    device_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    browser: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    os_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    os_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Location
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    location_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Session Status
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_activity: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    revoke_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sessions")
    
    @property
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.now(timezone.utc) > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Check if session is valid."""
        return not self.is_expired and not self.is_revoked
    
    def revoke(self, reason: str = "User logged out") -> None:
        """Revoke the session."""
        self.is_revoked = True
        self.revoked_at = datetime.now(timezone.utc)
        self.revoke_reason = reason


# ============================================================================
# User Preference Model
# ============================================================================

class UserPreference(Base):
    """
    User preferences and settings.
    
    Stores key-value pairs for user-specific configurations.
    """
    
    __tablename__ = "user_preferences"
    
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    # Preference
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    key: Mapped[str] = mapped_column(String(200), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    value_type: Mapped[str] = mapped_column(
        String(20), default="string", nullable=False
    )  # string, integer, float, boolean, json
    
    # Metadata
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="preferences")
    
    __table_args__ = (
        UniqueConstraint("user_id", "category", "key", name="uq_user_preference"),
        Index("ix_user_pref_category", "user_id", "category"),
    )
    
    def get_typed_value(self):
        """Get the value converted to its proper type."""
        if self.value_type == "integer":
            return int(self.value)
        elif self.value_type == "float":
            return float(self.value)
        elif self.value_type == "boolean":
            return self.value.lower() in ("true", "1", "yes")
        elif self.value_type == "json":
            import json
            return json.loads(self.value)
        return self.value
