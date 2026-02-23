"""
Medication Model - Prescriptions & Medication Management
=========================================================
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    String, Boolean, Integer, DateTime, Text, Float,
    ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, AuditMixin


class MedicationStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    DISCONTINUED = "discontinued"
    ON_HOLD = "on_hold"
    NOT_STARTED = "not_started"
    CANCELLED = "cancelled"


class MedicationRoute(str, enum.Enum):
    ORAL = "oral"
    INTRAVENOUS = "intravenous"
    INTRAMUSCULAR = "intramuscular"
    SUBCUTANEOUS = "subcutaneous"
    TOPICAL = "topical"
    INHALATION = "inhalation"
    RECTAL = "rectal"
    SUBLINGUAL = "sublingual"
    TRANSDERMAL = "transdermal"
    OPHTHALMIC = "ophthalmic"
    OTIC = "otic"
    NASAL = "nasal"
    INTRATHECAL = "intrathecal"
    OTHER = "other"


class MedicationFrequency(str, enum.Enum):
    ONCE_DAILY = "once_daily"
    TWICE_DAILY = "twice_daily"
    THREE_TIMES_DAILY = "three_times_daily"
    FOUR_TIMES_DAILY = "four_times_daily"
    EVERY_4_HOURS = "every_4_hours"
    EVERY_6_HOURS = "every_6_hours"
    EVERY_8_HOURS = "every_8_hours"
    EVERY_12_HOURS = "every_12_hours"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    AS_NEEDED = "as_needed"
    CONTINUOUS = "continuous"
    SINGLE_DOSE = "single_dose"
    OTHER = "other"


class PrescriptionStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    ON_HOLD = "on_hold"
    REFILL_REQUESTED = "refill_requested"


class AdherenceStatus(str, enum.Enum):
    TAKEN = "taken"
    MISSED = "missed"
    SKIPPED = "skipped"
    LATE = "late"
    EARLY = "early"
    PARTIAL = "partial"
    WRONG_DOSE = "wrong_dose"
    SIDE_EFFECT_REPORTED = "side_effect_reported"


# ============================================================================
# Medication Model
# ============================================================================

class Medication(Base, AuditMixin):
    """
    Master medication/drug database.
    """
    
    __tablename__ = "medications"
    
    # Drug Information
    generic_name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    brand_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    drug_class: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    drug_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Details
    strength: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    form: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # tablet, capsule, injection
    route: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    ndc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    rxnorm_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Cancer Treatment
    is_cancer_drug: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    cancer_type_indication: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    is_chemotherapy: Mapped[bool] = mapped_column(Boolean, default=False)
    is_immunotherapy: Mapped[bool] = mapped_column(Boolean, default=False)
    is_targeted_therapy: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hormone_therapy: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Safety
    contraindications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    drug_interactions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    side_effects: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    warnings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    pregnancy_category: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    requires_monitoring: Mapped[bool] = mapped_column(Boolean, default=False)
    monitoring_parameters: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Description
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mechanism_of_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    __table_args__ = (
        Index("ix_medication_name", "generic_name", "brand_name"),
        Index("ix_medication_cancer", "is_cancer_drug", "drug_class"),
    )


# ============================================================================
# Prescription Model
# ============================================================================

class Prescription(Base, AuditMixin):
    """
    Patient prescription records.
    """
    
    __tablename__ = "prescriptions"
    
    # Patient
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    health_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    
    # Prescriber
    doctor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("doctors.id"), nullable=False
    )
    hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospital.id"), nullable=True
    )
    
    # Prescription Details
    prescription_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(30), default=PrescriptionStatus.ACTIVE.value, nullable=False
    )
    
    # Medication
    medication_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("medications.id"), nullable=True
    )
    medication_name: Mapped[str] = mapped_column(String(300), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    dosage_unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    frequency: Mapped[str] = mapped_column(String(30), nullable=False)
    route: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    
    # Duration
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Quantity
    quantity_prescribed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    quantity_dispensed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    refills_authorized: Mapped[int] = mapped_column(Integer, default=0)
    refills_remaining: Mapped[int] = mapped_column(Integer, default=0)
    
    # Instructions
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    special_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    take_with_food: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    # Clinical Context
    diagnosis: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    icd10_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_cancer_treatment: Mapped[bool] = mapped_column(Boolean, default=False)
    treatment_cycle: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Pharmacy
    pharmacy_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    pharmacy_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    filled_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    filled_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Cost
    cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    insurance_covered: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    copay: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Substitution
    allow_generic_substitution: Mapped[bool] = mapped_column(Boolean, default=True)
    substituted: Mapped[bool] = mapped_column(Boolean, default=False)
    substituted_with: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    
    # Discontinuation
    discontinued_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    discontinuation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Notes
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Health Record Link
    health_record_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("health_records.id"), nullable=True
    )
    
    # Relationships
    schedules: Mapped[List["MedicationSchedule"]] = relationship(
        "MedicationSchedule", back_populates="prescription", cascade="all, delete-orphan"
    )
    adherence_records: Mapped[List["MedicationAdherence"]] = relationship(
        "MedicationAdherence", back_populates="prescription", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_prescription_patient", "patient_id", "status"),
        Index("ix_prescription_doctor", "doctor_id", "status"),
        Index("ix_prescription_dates", "start_date", "end_date"),
    )


# ============================================================================
# Medication Schedule Model
# ============================================================================

class MedicationSchedule(Base):
    """
    Individual medication schedule entries.
    """
    
    __tablename__ = "medication_schedules"
    
    prescription_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("prescriptions.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id"), nullable=False, index=True
    )
    
    # Schedule
    scheduled_time: Mapped[str] = mapped_column(String(10), nullable=False)  # HH:MM
    day_of_week: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    dose_number: Mapped[int] = mapped_column(Integer, nullable=False)
    dose_amount: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Configuration
    reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    reminder_minutes_before: Mapped[int] = mapped_column(Integer, default=15)
    snooze_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationship
    prescription: Mapped["Prescription"] = relationship(
        "Prescription", back_populates="schedules"
    )


# ============================================================================
# Medication Adherence Model
# ============================================================================

class MedicationAdherence(Base):
    """
    Medication adherence tracking.
    """
    
    __tablename__ = "medication_adherence"
    
    prescription_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("prescriptions.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id"), nullable=False, index=True
    )
    
    # Tracking
    scheduled_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    scheduled_time: Mapped[str] = mapped_column(String(10), nullable=False)
    actual_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Status
    adherence_status: Mapped[str] = mapped_column(String(30), nullable=False)
    dose_taken: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Side Effects
    side_effects_reported: Mapped[bool] = mapped_column(Boolean, default=False)
    side_effect_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    side_effect_severity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Confirmation
    confirmed_by: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Smartwatch Integration
    smartwatch_recorded: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationship
    prescription: Mapped["Prescription"] = relationship(
        "Prescription", back_populates="adherence_records"
    )
    
    __table_args__ = (
        Index("ix_adherence_patient_date", "patient_id", "scheduled_date"),
        Index("ix_adherence_status", "adherence_status", "scheduled_date"),
    )
