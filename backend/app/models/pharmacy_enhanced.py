"""
Enhanced Pharmacy Models
=========================
Formulary, drug utilization review, medication reconciliation,
compounding, controlled substances, and clinical pharmacy.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class FormularyStatus(str, enum.Enum):
    PREFERRED = "preferred"
    NON_PREFERRED = "non_preferred"
    RESTRICTED = "restricted"
    NON_FORMULARY = "non_formulary"


class DURSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class FormularyItem(Base):
    """Hospital formulary medication."""
    medication_name: Mapped[str] = mapped_column(String(300), nullable=False)
    generic_name: Mapped[str] = mapped_column(String(300), nullable=False)
    brand_names: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    ndc_codes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    drug_class: Mapped[str] = mapped_column(String(100), nullable=False)
    therapeutic_category: Mapped[str] = mapped_column(String(100), nullable=False)
    formulary_status: Mapped[str] = mapped_column(String(20), default=FormularyStatus.PREFERRED.value)
    tier: Mapped[int] = mapped_column(Integer, default=1)
    restrictions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    criteria_for_use: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    available_forms: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    available_strengths: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    routes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    cost_per_unit: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    awp: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    therapeutic_alternatives: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    black_box_warning: Mapped[bool] = mapped_column(Boolean, default=False)
    rems_required: Mapped[bool] = mapped_column(Boolean, default=False)
    biosimilar_available: Mapped[bool] = mapped_column(Boolean, default=False)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    last_reviewed: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class DrugUtilizationReview(Base):
    """Drug utilization review alert."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    pharmacist_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    medication_name: Mapped[str] = mapped_column(String(300), nullable=False)
    dur_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default=DURSeverity.WARNING.value)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    interacting_drug: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    clinical_significance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    override_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    overridden_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    outcome: Mapped[str] = mapped_column(String(20), default="pending")
    reference: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)


class MedicationReconciliation(Base):
    """Medication reconciliation record."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    pharmacist_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    encounter_type: Mapped[str] = mapped_column(String(30), nullable=False)
    reconciliation_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    home_medications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    inpatient_medications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    discharge_medications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    discrepancies_found: Mapped[int] = mapped_column(Integer, default=0)
    discrepancies: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    interventions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    patient_education_provided: Mapped[bool] = mapped_column(Boolean, default=False)
    sources_verified: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    best_possible_medication_history: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class CompoundedMedication(Base):
    """Compounded medication record."""
    patient_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("patient.id"), nullable=True)
    pharmacist_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    compound_name: Mapped[str] = mapped_column(String(300), nullable=False)
    formula_number: Mapped[str] = mapped_column(String(50), nullable=False)
    ingredients: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    concentration: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    total_volume: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    dosage_form: Mapped[str] = mapped_column(String(50), nullable=False)
    route: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    beyond_use_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    storage_conditions: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    preparation_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    lot_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    usp_chapter: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    sterile: Mapped[bool] = mapped_column(Boolean, default=False)
    hazardous: Mapped[bool] = mapped_column(Boolean, default=False)
    quality_check: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    checked_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    master_formula_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class ControlledSubstanceLog(Base):
    """Controlled substance dispensing log."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    pharmacist_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    prescriber_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    medication_name: Mapped[str] = mapped_column(String(300), nullable=False)
    dea_schedule: Mapped[str] = mapped_column(String(5), nullable=False)
    ndc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    quantity_dispensed: Mapped[float] = mapped_column(Float, nullable=False)
    quantity_remaining: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dispense_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    prescription_number: Mapped[str] = mapped_column(String(30), nullable=False)
    days_supply: Mapped[int] = mapped_column(Integer, nullable=False)
    morphine_equivalent_dose: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pdmp_checked: Mapped[bool] = mapped_column(Boolean, default=True)
    pdmp_alerts: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    naloxone_coprescribed: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    witness_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    waste_documented: Mapped[bool] = mapped_column(Boolean, default=False)
    waste_witness: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)


class ClinicalPharmacyIntervention(Base):
    """Clinical pharmacy intervention record."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    pharmacist_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    provider_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    intervention_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    intervention_type: Mapped[str] = mapped_column(String(50), nullable=False)
    medication_involved: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    problem_identified: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    clinical_significance: Mapped[str] = mapped_column(String(20), default="moderate")
    accepted: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cost_avoidance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    time_spent_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    references: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    follow_up_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    follow_up_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class AntibioticStewardship(Base):
    """Antibiotic stewardship program tracking."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    pharmacist_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    antibiotic_name: Mapped[str] = mapped_column(String(200), nullable=False)
    indication: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    culture_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    sensitivity_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    review_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    review_type: Mapped[str] = mapped_column(String(30), default="prospective_audit")
    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendation_type: Mapped[str] = mapped_column(String(30), default="de_escalation")
    accepted: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    days_of_therapy: Mapped[int] = mapped_column(Integer, default=0)
    iv_to_po_conversion: Mapped[bool] = mapped_column(Boolean, default=False)
    dose_optimization: Mapped[bool] = mapped_column(Boolean, default=False)
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class AdverseReactionHistory(Base):
    """Patient adverse drug reaction history."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    medication_name: Mapped[str] = mapped_column(String(300), nullable=False)
    reaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    symptoms: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    onset_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reported_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    cross_reactivity: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    rechallenge: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    naranjo_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
