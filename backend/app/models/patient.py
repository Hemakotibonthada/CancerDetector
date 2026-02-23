"""
Patient Model - Patient Health Records & Demographics
=====================================================

Comprehensive patient data model including demographics, medical history,
allergies, family history, and health ID management.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone, date
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Text, Float, Date,
    Enum, ForeignKey, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, AuditMixin


# ============================================================================
# Enums
# ============================================================================

class MaritalStatus(str, enum.Enum):
    SINGLE = "single"
    MARRIED = "married"
    DIVORCED = "divorced"
    WIDOWED = "widowed"
    SEPARATED = "separated"
    DOMESTIC_PARTNERSHIP = "domestic_partnership"
    OTHER = "other"


class RiskLevel(str, enum.Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"
    CRITICAL = "critical"


class SmokingStatus(str, enum.Enum):
    NEVER = "never"
    FORMER = "former"
    CURRENT_LIGHT = "current_light"
    CURRENT_MODERATE = "current_moderate"
    CURRENT_HEAVY = "current_heavy"
    UNKNOWN = "unknown"


class AlcoholConsumption(str, enum.Enum):
    NONE = "none"
    OCCASIONAL = "occasional"
    MODERATE = "moderate"
    HEAVY = "heavy"
    UNKNOWN = "unknown"


class PhysicalActivityLevel(str, enum.Enum):
    SEDENTARY = "sedentary"
    LIGHTLY_ACTIVE = "lightly_active"
    MODERATELY_ACTIVE = "moderately_active"
    VERY_ACTIVE = "very_active"
    EXTREMELY_ACTIVE = "extremely_active"


class AllergyType(str, enum.Enum):
    DRUG = "drug"
    FOOD = "food"
    ENVIRONMENTAL = "environmental"
    LATEX = "latex"
    INSECT = "insect"
    ANIMAL = "animal"
    OTHER = "other"


class AllergySeverity(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    LIFE_THREATENING = "life_threatening"


class FamilyCancerHistory(str, enum.Enum):
    NONE = "none"
    ONE_RELATIVE = "one_relative"
    MULTIPLE_RELATIVES = "multiple_relatives"
    GENETIC_PREDISPOSITION = "genetic_predisposition"


# ============================================================================
# Patient Model
# ============================================================================

class Patient(Base, AuditMixin):
    """
    Patient profile linking to user account with detailed medical information.
    
    Features:
    - Unique Health ID for cross-hospital identification
    - Comprehensive medical history tracking
    - Risk assessment data
    - Lifestyle and demographic information
    - Insurance and emergency contact links
    """
    
    __tablename__ = "patient"
    
    # Link to User
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("user.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True
    )
    
    # Health ID (unique across the system)
    health_id: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    
    # Medical Record Number (hospital-specific)
    mrn: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, index=True
    )
    
    # Primary Hospital
    primary_hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospital.id"), nullable=True
    )
    
    # Primary Doctor
    primary_doctor_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("doctors.id"), nullable=True
    )
    
    # Physical Attributes
    height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bmi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    blood_type: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    rh_factor: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    
    # Demographic
    marital_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    employer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    education_level: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ethnicity: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    nationality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    primary_language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Lifestyle Factors (Critical for cancer risk)
    smoking_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    smoking_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    packs_per_day: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    alcohol_consumption: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    alcohol_units_per_week: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    physical_activity_level: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    exercise_minutes_per_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    diet_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sleep_hours_avg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stress_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sun_exposure_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    uses_sunscreen: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    # Environmental Factors
    environmental_exposures: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    chemical_exposure: Mapped[bool] = mapped_column(Boolean, default=False)
    radiation_exposure: Mapped[bool] = mapped_column(Boolean, default=False)
    asbestos_exposure: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Medical Conditions
    has_diabetes: Mapped[bool] = mapped_column(Boolean, default=False)
    diabetes_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    has_hypertension: Mapped[bool] = mapped_column(Boolean, default=False)
    has_heart_disease: Mapped[bool] = mapped_column(Boolean, default=False)
    has_autoimmune_disease: Mapped[bool] = mapped_column(Boolean, default=False)
    has_chronic_kidney_disease: Mapped[bool] = mapped_column(Boolean, default=False)
    has_liver_disease: Mapped[bool] = mapped_column(Boolean, default=False)
    has_lung_disease: Mapped[bool] = mapped_column(Boolean, default=False)
    has_hiv_aids: Mapped[bool] = mapped_column(Boolean, default=False)
    has_hepatitis: Mapped[bool] = mapped_column(Boolean, default=False)
    hepatitis_type: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    has_hpv: Mapped[bool] = mapped_column(Boolean, default=False)
    has_obesity: Mapped[bool] = mapped_column(Boolean, default=False)
    has_previous_cancer: Mapped[bool] = mapped_column(Boolean, default=False)
    previous_cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    previous_cancer_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cancer_in_remission: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    # Genetic Information
    genetic_testing_done: Mapped[bool] = mapped_column(Boolean, default=False)
    brca1_positive: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    brca2_positive: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    lynch_syndrome: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    tp53_mutation: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    other_genetic_markers: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Cancer Risk Assessment
    overall_cancer_risk: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    cancer_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    risk_factors_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Reproductive Health (for breast/reproductive cancer risk)
    age_at_menarche: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    age_at_menopause: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_postmenopausal: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    number_of_pregnancies: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    age_at_first_birth: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    breastfed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    hormone_replacement_therapy: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    hrt_duration_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    oral_contraceptive_use: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    oc_duration_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Surgical History
    surgical_history: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Vaccination Status
    hpv_vaccinated: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    hepatitis_b_vaccinated: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    # Smartwatch Connected
    has_smartwatch: Mapped[bool] = mapped_column(Boolean, default=False)
    smartwatch_device_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Notes
    medical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    special_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Consent
    data_collection_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_analysis_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    third_party_sharing_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    demographics: Mapped[Optional["PatientDemographics"]] = relationship(
        "PatientDemographics", back_populates="patient", uselist=False,
        cascade="all, delete-orphan"
    )
    allergies: Mapped[List["PatientAllergy"]] = relationship(
        "PatientAllergy", back_populates="patient", cascade="all, delete-orphan"
    )
    family_histories: Mapped[List["PatientFamilyHistory"]] = relationship(
        "PatientFamilyHistory", back_populates="patient", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_patients_risk", "overall_cancer_risk", "cancer_risk_score"),
    )
    
    def calculate_bmi(self) -> Optional[float]:
        """Calculate BMI from height and weight."""
        if self.height_cm and self.weight_kg and self.height_cm > 0:
            height_m = self.height_cm / 100
            self.bmi = round(self.weight_kg / (height_m ** 2), 2)
            return self.bmi
        return None
    
    def get_pack_years(self) -> Optional[float]:
        """Calculate pack years for smoking history."""
        if self.packs_per_day and self.smoking_years:
            return self.packs_per_day * self.smoking_years
        return None


# ============================================================================
# Patient Demographics Model
# ============================================================================

class PatientDemographics(Base):
    """Extended demographics information for patients."""
    
    __tablename__ = "patient_demographics"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True
    )
    
    # Additional Identity
    national_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    passport_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    drivers_license: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    social_security_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Socioeconomic
    annual_income_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    insurance_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    housing_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    number_of_dependents: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Healthcare Access
    has_primary_care_physician: Mapped[bool] = mapped_column(Boolean, default=False)
    last_physical_exam_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_dental_exam_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_eye_exam_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_mammogram_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_colonoscopy_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_pap_smear_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_psa_test_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_skin_check_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_chest_xray_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_ct_scan_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_mri_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Advanced Directives
    has_advance_directive: Mapped[bool] = mapped_column(Boolean, default=False)
    has_power_of_attorney: Mapped[bool] = mapped_column(Boolean, default=False)
    organ_donor: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    dnr_order: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationship
    patient: Mapped["Patient"] = relationship(
        "Patient", back_populates="demographics"
    )


# ============================================================================
# Patient Allergy Model
# ============================================================================

class PatientAllergy(Base):
    """Patient allergy records."""
    
    __tablename__ = "patient_allergies"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    allergy_type: Mapped[str] = mapped_column(String(30), nullable=False)
    allergen: Mapped[str] = mapped_column(String(200), nullable=False)
    reaction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    onset_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    diagnosed_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationship
    patient: Mapped["Patient"] = relationship(
        "Patient", back_populates="allergies"
    )
    
    __table_args__ = (
        Index("ix_allergy_patient_type", "patient_id", "allergy_type"),
    )


# ============================================================================
# Patient Family History Model
# ============================================================================

class PatientFamilyHistory(Base):
    """Patient family medical history - critical for cancer risk assessment."""
    
    __tablename__ = "patient_family_histories"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    # Family Member
    relationship_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # mother, father, sibling, maternal_grandmother, etc.
    relative_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    relative_gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    relative_living: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    relative_age_at_death: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cause_of_death: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Medical Condition
    condition_name: Mapped[str] = mapped_column(String(200), nullable=False)
    condition_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # cancer, cardiovascular, etc.
    age_at_diagnosis: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_cancer: Mapped[bool] = mapped_column(Boolean, default=False)
    cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cancer_stage: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    treatment_outcome: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Genetic
    genetic_testing_done: Mapped[bool] = mapped_column(Boolean, default=False)
    genetic_mutation_found: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_by_doctor: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationship
    patient: Mapped["Patient"] = relationship(
        "Patient", back_populates="family_histories"
    )
    
    __table_args__ = (
        Index("ix_family_history_patient", "patient_id", "is_cancer"),
    )
