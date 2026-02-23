"""
Hospital Model - Hospital Management & Staff
=============================================

Models for hospitals, departments, staff, and doctors.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone, time
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import (
    String, Boolean, Integer, DateTime, Text, Float, Time,
    ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, AuditMixin


class HospitalType(str, enum.Enum):
    GENERAL = "general"
    SPECIALTY = "specialty"
    TEACHING = "teaching"
    RESEARCH = "research"
    COMMUNITY = "community"
    CANCER_CENTER = "cancer_center"
    MULTI_SPECIALTY = "multi_specialty"
    CLINIC = "clinic"
    DIAGNOSTIC_CENTER = "diagnostic_center"
    REHABILITATION = "rehabilitation"


class HospitalStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    UNDER_REVIEW = "under_review"
    SUSPENDED = "suspended"
    CLOSED = "closed"


class DepartmentType(str, enum.Enum):
    ONCOLOGY = "oncology"
    RADIOLOGY = "radiology"
    PATHOLOGY = "pathology"
    CARDIOLOGY = "cardiology"
    NEUROLOGY = "neurology"
    SURGERY = "surgery"
    INTERNAL_MEDICINE = "internal_medicine"
    EMERGENCY = "emergency"
    PEDIATRICS = "pediatrics"
    ORTHOPEDICS = "orthopedics"
    DERMATOLOGY = "dermatology"
    GYNECOLOGY = "gynecology"
    UROLOGY = "urology"
    GASTROENTEROLOGY = "gastroenterology"
    PULMONOLOGY = "pulmonology"
    HEMATOLOGY = "hematology"
    ENDOCRINOLOGY = "endocrinology"
    NEPHROLOGY = "nephrology"
    PSYCHIATRY = "psychiatry"
    OPHTHALMOLOGY = "ophthalmology"
    ENT = "ent"
    LABORATORY = "laboratory"
    PHARMACY = "pharmacy"
    ICU = "icu"
    NICU = "nicu"
    GENERAL = "general"
    ADMINISTRATION = "administration"
    RESEARCH = "research"


class StaffPosition(str, enum.Enum):
    HEAD_OF_DEPARTMENT = "head_of_department"
    SENIOR_CONSULTANT = "senior_consultant"
    CONSULTANT = "consultant"
    ATTENDING_PHYSICIAN = "attending_physician"
    RESIDENT = "resident"
    INTERN = "intern"
    HEAD_NURSE = "head_nurse"
    SENIOR_NURSE = "senior_nurse"
    STAFF_NURSE = "staff_nurse"
    LAB_DIRECTOR = "lab_director"
    SENIOR_TECHNICIAN = "senior_technician"
    TECHNICIAN = "technician"
    PHARMACIST = "pharmacist"
    ADMINISTRATOR = "administrator"
    RECEPTIONIST = "receptionist"
    OTHER = "other"


class DoctorSpecialization(str, enum.Enum):
    MEDICAL_ONCOLOGY = "medical_oncology"
    SURGICAL_ONCOLOGY = "surgical_oncology"
    RADIATION_ONCOLOGY = "radiation_oncology"
    HEMATOLOGIC_ONCOLOGY = "hematologic_oncology"
    PEDIATRIC_ONCOLOGY = "pediatric_oncology"
    GYNECOLOGIC_ONCOLOGY = "gynecologic_oncology"
    NEURO_ONCOLOGY = "neuro_oncology"
    DERMATOLOGIC_ONCOLOGY = "dermatologic_oncology"
    GENERAL_SURGERY = "general_surgery"
    INTERNAL_MEDICINE = "internal_medicine"
    FAMILY_MEDICINE = "family_medicine"
    RADIOLOGY = "radiology"
    PATHOLOGY = "pathology"
    CARDIOLOGY = "cardiology"
    PULMONOLOGY = "pulmonology"
    GASTROENTEROLOGY = "gastroenterology"
    UROLOGY = "urology"
    NEPHROLOGY = "nephrology"
    ENDOCRINOLOGY = "endocrinology"
    DERMATOLOGY = "dermatology"
    NEUROLOGY = "neurology"
    PSYCHIATRY = "psychiatry"
    ORTHOPEDICS = "orthopedics"
    OPHTHALMOLOGY = "ophthalmology"
    ENT = "ent"
    ANESTHESIOLOGY = "anesthesiology"
    EMERGENCY_MEDICINE = "emergency_medicine"
    PALLIATIVE_CARE = "palliative_care"
    GENETIC_COUNSELING = "genetic_counseling"
    PREVENTIVE_MEDICINE = "preventive_medicine"
    SPORTS_MEDICINE = "sports_medicine"
    GERIATRICS = "geriatrics"
    OTHER = "other"


# ============================================================================
# Hospital Model
# ============================================================================

class Hospital(Base, AuditMixin):
    """
    Hospital entity with comprehensive organizational information.
    """
    
    __tablename__ = "hospital"
    
    # Basic Information
    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    hospital_type: Mapped[str] = mapped_column(
        String(30), default=HospitalType.GENERAL.value, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default=HospitalStatus.ACTIVE.value, nullable=False, index=True
    )
    
    # Registration
    registration_number: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    accreditation_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    accreditation_body: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    accreditation_valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    license_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    established_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Contact
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    fax: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    emergency_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Address
    address_line1: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Capacity
    total_beds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    icu_beds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    available_beds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_operating_rooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_departments: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_staff: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Operating Hours
    opens_at: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    closes_at: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    is_24_hours: Mapped[bool] = mapped_column(Boolean, default=False)
    emergency_available: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Capabilities
    has_cancer_center: Mapped[bool] = mapped_column(Boolean, default=False)
    has_radiation_therapy: Mapped[bool] = mapped_column(Boolean, default=False)
    has_chemotherapy: Mapped[bool] = mapped_column(Boolean, default=False)
    has_immunotherapy: Mapped[bool] = mapped_column(Boolean, default=False)
    has_robotic_surgery: Mapped[bool] = mapped_column(Boolean, default=False)
    has_mri: Mapped[bool] = mapped_column(Boolean, default=False)
    has_ct_scan: Mapped[bool] = mapped_column(Boolean, default=False)
    has_pet_scan: Mapped[bool] = mapped_column(Boolean, default=False)
    has_ultrasound: Mapped[bool] = mapped_column(Boolean, default=False)
    has_lab: Mapped[bool] = mapped_column(Boolean, default=True)
    has_pharmacy: Mapped[bool] = mapped_column(Boolean, default=True)
    has_blood_bank: Mapped[bool] = mapped_column(Boolean, default=False)
    has_genetic_testing: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # AI Integration
    ai_integration_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    smartwatch_integration_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    telemedicine_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Media
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Rating
    average_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relationships
    departments: Mapped[List["HospitalDepartment"]] = relationship(
        "HospitalDepartment", back_populates="hospital", cascade="all, delete-orphan"
    )
    staff: Mapped[List["HospitalStaff"]] = relationship(
        "HospitalStaff", back_populates="hospital", cascade="all, delete-orphan"
    )
    doctors: Mapped[List["Doctor"]] = relationship(
        "Doctor", back_populates="hospital", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_hospital_location", "city", "state", "country"),
        Index("ix_hospital_type_status", "hospital_type", "status"),
    )


# ============================================================================
# Hospital Department Model
# ============================================================================

class HospitalDepartment(Base, AuditMixin):
    """Hospital department organization."""
    
    __tablename__ = "hospital_departments"
    
    hospital_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("hospital.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    department_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Head of Department
    head_doctor_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    head_nurse_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    # Contact
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    floor: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    wing: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    room_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Capacity
    total_beds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    available_beds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_staff: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Operating Hours
    opens_at: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    closes_at: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    is_24_hours: Mapped[bool] = mapped_column(Boolean, default=False)
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    specialties: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Relationships
    hospital: Mapped["Hospital"] = relationship("Hospital", back_populates="departments")
    
    __table_args__ = (
        UniqueConstraint("hospital_id", "code", name="uq_dept_code"),
        Index("ix_dept_type", "hospital_id", "department_type"),
    )


# ============================================================================
# Hospital Staff Model
# ============================================================================

class HospitalStaff(Base, AuditMixin):
    """Hospital staff member details."""
    
    __tablename__ = "hospital_staff"
    
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("user.id"), nullable=False, index=True
    )
    hospital_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("hospital.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospital_departments.id"), nullable=True
    )
    
    # Staff Details
    employee_id: Mapped[str] = mapped_column(String(50), nullable=False)
    position: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Work Schedule
    shift_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    work_days: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # JSON
    
    # Employment
    hire_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    employment_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    
    # Permissions
    can_view_patient_data: Mapped[bool] = mapped_column(Boolean, default=False)
    can_edit_patient_data: Mapped[bool] = mapped_column(Boolean, default=False)
    can_prescribe: Mapped[bool] = mapped_column(Boolean, default=False)
    can_order_tests: Mapped[bool] = mapped_column(Boolean, default=False)
    can_view_ai_predictions: Mapped[bool] = mapped_column(Boolean, default=False)
    can_manage_staff: Mapped[bool] = mapped_column(Boolean, default=False)
    can_access_reports: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationship
    hospital: Mapped["Hospital"] = relationship("Hospital", back_populates="staff")
    
    __table_args__ = (
        UniqueConstraint("hospital_id", "employee_id", name="uq_staff_employee"),
        Index("ix_staff_position", "hospital_id", "position"),
    )


# ============================================================================
# Doctor Model
# ============================================================================

class Doctor(Base, AuditMixin):
    """
    Doctor profile with specialization and credentials.
    """
    
    __tablename__ = "doctors"
    
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("user.id"), unique=True, nullable=False, index=True
    )
    hospital_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("hospital.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospital_departments.id"), nullable=True
    )
    
    # Professional Details
    medical_license_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    license_state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    license_valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    npi_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Specialization
    specialization: Mapped[str] = mapped_column(String(50), nullable=False)
    sub_specialization: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Qualifications
    degree: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    university: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    graduation_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    additional_qualifications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    board_certifications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Experience
    years_of_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_patients_treated: Mapped[int] = mapped_column(Integer, default=0)
    total_surgeries: Mapped[int] = mapped_column(Integer, default=0)
    research_publications: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Consultation
    consultation_fee: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    follow_up_fee: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    telemedicine_available: Mapped[bool] = mapped_column(Boolean, default=False)
    average_consultation_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Availability
    available_days: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # JSON
    morning_start: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    morning_end: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    evening_start: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    evening_end: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    max_patients_per_day: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Rating
    average_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    
    # Bio
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    languages_spoken: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    
    # Cancer Specialization
    cancer_types_treated: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    cancer_treatment_methods: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    clinical_trials_active: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Relationships
    hospital: Mapped["Hospital"] = relationship("Hospital", back_populates="doctors")
    
    __table_args__ = (
        Index("ix_doctor_specialization", "specialization"),
        Index("ix_doctor_hospital", "hospital_id", "specialization"),
    )
