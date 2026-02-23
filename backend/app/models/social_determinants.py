"""
Social Determinants of Health (SDOH) Models
=============================================
SDOH assessments, social risks, community programs,
transportation, food insecurity, and housing.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class RiskLevel(str, enum.Enum):
    NO_RISK = "no_risk"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class SDOHDomain(str, enum.Enum):
    ECONOMIC = "economic_stability"
    EDUCATION = "education_access"
    HEALTHCARE = "healthcare_access"
    NEIGHBORHOOD = "neighborhood_environment"
    SOCIAL = "social_community"
    FOOD = "food_access"
    HOUSING = "housing"
    TRANSPORTATION = "transportation"


class SDOHAssessment(Base):
    """Social determinants of health assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    assessor_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    screening_tool: Mapped[str] = mapped_column(String(50), default="PRAPARE")
    overall_risk: Mapped[str] = mapped_column(String(20), default=RiskLevel.NO_RISK.value)
    economic_stability: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    education_access: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    healthcare_access: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    neighborhood_environment: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    social_community: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    employment_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    income_level: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    insurance_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    housing_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    food_security: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    transportation_access: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    social_isolation: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    domestic_violence_risk: Mapped[bool] = mapped_column(Boolean, default=False)
    veteran_status: Mapped[bool] = mapped_column(Boolean, default=False)
    refugee_status: Mapped[bool] = mapped_column(Boolean, default=False)
    language_barrier: Mapped[bool] = mapped_column(Boolean, default=False)
    primary_language: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    digital_literacy: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    identified_needs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    referrals_made: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    follow_up_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class SocialRisk(Base):
    """Individual social risk factor tracking."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    assessment_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    domain: Mapped[str] = mapped_column(String(30), nullable=False)
    risk_factor: Mapped[str] = mapped_column(String(200), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), default=RiskLevel.LOW.value)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    onset_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    intervention: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    referral_made: Mapped[bool] = mapped_column(Boolean, default=False)
    resource_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="active")


class CommunityProgram(Base):
    """Community assistance program."""
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    organization: Mapped[str] = mapped_column(String(200), nullable=False)
    program_type: Mapped[str] = mapped_column(String(50), nullable=False)
    sdoh_domain: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    eligibility_criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    services_offered: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    service_area: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    hours_of_operation: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    languages_served: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    wait_time_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost: Mapped[str] = mapped_column(String(50), default="free")
    accepting_new: Mapped[bool] = mapped_column(Boolean, default=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_verified: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class ProgramReferral(Base):
    """Referral to community program."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    program_id: Mapped[str] = mapped_column(String(36), ForeignKey("community_program.id"), nullable=False)
    referred_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    referral_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    accepted_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    enrolled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    follow_up_needed: Mapped[bool] = mapped_column(Boolean, default=True)


class TransportationNeed(Base):
    """Transportation assistance tracking."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    need_type: Mapped[str] = mapped_column(String(50), nullable=False)
    appointment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    pickup_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    destination: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    distance_miles: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wheelchair_accessible: Mapped[bool] = mapped_column(Boolean, default=False)
    stretcher_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    companion_allowed: Mapped[bool] = mapped_column(Boolean, default=True)
    recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    frequency: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    provider: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    covered_by_insurance: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class FoodInsecurityRecord(Base):
    """Food insecurity assessment and assistance."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    screening_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    food_insecure: Mapped[bool] = mapped_column(Boolean, default=False)
    severity: Mapped[str] = mapped_column(String(20), default="none")
    hunger_frequency: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    skip_meals: Mapped[bool] = mapped_column(Boolean, default=False)
    snap_enrolled: Mapped[bool] = mapped_column(Boolean, default=False)
    wic_enrolled: Mapped[bool] = mapped_column(Boolean, default=False)
    food_bank_access: Mapped[bool] = mapped_column(Boolean, default=False)
    meal_delivery_enrolled: Mapped[bool] = mapped_column(Boolean, default=False)
    cooking_ability: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    kitchen_access: Mapped[bool] = mapped_column(Boolean, default=True)
    refrigerator_access: Mapped[bool] = mapped_column(Boolean, default=True)
    special_diet_barriers: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    intervention_provided: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    follow_up_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class HousingAssessment(Base):
    """Housing status assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    housing_status: Mapped[str] = mapped_column(String(30), nullable=False)
    housing_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    homeless: Mapped[bool] = mapped_column(Boolean, default=False)
    homeless_duration: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    shelter_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    at_risk_of_homelessness: Mapped[bool] = mapped_column(Boolean, default=False)
    housing_unsafe: Mapped[bool] = mapped_column(Boolean, default=False)
    safety_concerns: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    lead_exposure_risk: Mapped[bool] = mapped_column(Boolean, default=False)
    mold_exposure: Mapped[bool] = mapped_column(Boolean, default=False)
    pest_infestation: Mapped[bool] = mapped_column(Boolean, default=False)
    adequate_heating_cooling: Mapped[bool] = mapped_column(Boolean, default=True)
    utilities_at_risk: Mapped[bool] = mapped_column(Boolean, default=False)
    number_of_residents: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    monthly_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    percent_of_income: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    assistance_programs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    referrals_made: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
