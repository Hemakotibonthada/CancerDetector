"""
Enhanced Billing & Revenue Cycle Models
========================================
Invoices, payments, insurance verification, prior auth,
cost estimates, charge capture, and denial management.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class ClaimStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    ADJUDICATED = "adjudicated"
    PAID = "paid"
    DENIED = "denied"
    APPEALED = "appealed"


class Invoice(Base):
    """Medical invoice for services rendered."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    encounter_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    service_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0)
    insurance_amount: Mapped[float] = mapped_column(Float, default=0.0)
    patient_amount: Mapped[float] = mapped_column(Float, default=0.0)
    copay: Mapped[float] = mapped_column(Float, default=0.0)
    deductible: Mapped[float] = mapped_column(Float, default=0.0)
    coinsurance: Mapped[float] = mapped_column(Float, default=0.0)
    discount: Mapped[float] = mapped_column(Float, default=0.0)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0)
    balance: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    line_items: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PaymentTransaction(Base):
    """Payment transaction record."""
    invoice_id: Mapped[str] = mapped_column(String(36), ForeignKey("invoice.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), nullable=False)
    transaction_ref: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=PaymentStatus.PENDING.value)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    gateway_response: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    refund_amount: Mapped[float] = mapped_column(Float, default=0.0)
    refund_reason: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)


class InsurancePlan(Base):
    """Insurance plan information."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    payer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    plan_name: Mapped[str] = mapped_column(String(200), nullable=False)
    plan_type: Mapped[str] = mapped_column(String(30), nullable=False)
    member_id: Mapped[str] = mapped_column(String(50), nullable=False)
    group_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    subscriber_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    subscriber_dob: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    relationship: Mapped[str] = mapped_column(String(20), default="self")
    effective_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    termination_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)
    copay_amount: Mapped[float] = mapped_column(Float, default=0.0)
    deductible_amount: Mapped[float] = mapped_column(Float, default=0.0)
    deductible_met: Mapped[float] = mapped_column(Float, default=0.0)
    out_of_pocket_max: Mapped[float] = mapped_column(Float, default=0.0)
    out_of_pocket_met: Mapped[float] = mapped_column(Float, default=0.0)
    coverage_details: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    verification_status: Mapped[str] = mapped_column(String(20), default="unverified")


class InsuranceVerification(Base):
    """Insurance eligibility verification."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    insurance_plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("insurance_plan.id"), nullable=False)
    verification_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    is_eligible: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    coverage_active: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    benefits_summary: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    response_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    reference_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PriorAuthorization(Base):
    """Prior authorization request for procedures/medications."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    insurance_plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("insurance_plan.id"), nullable=False)
    requesting_provider_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    auth_type: Mapped[str] = mapped_column(String(50), nullable=False)
    service_description: Mapped[str] = mapped_column(String(500), nullable=False)
    diagnosis_codes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    procedure_codes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    requested_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    service_from_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    service_to_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    auth_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    approved_units: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    used_units: Mapped[int] = mapped_column(Integer, default=0)
    clinical_justification: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decision_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    denial_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    appeal_filed: Mapped[bool] = mapped_column(Boolean, default=False)


class CostEstimate(Base):
    """Treatment cost estimation for price transparency."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    procedure_codes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    diagnosis_codes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    estimated_total: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_insurance: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_patient: Mapped[float] = mapped_column(Float, default=0.0)
    breakdown: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    assumptions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    disclaimer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shared_with_patient: Mapped[bool] = mapped_column(Boolean, default=False)


class ChargeCapture(Base):
    """Clinical charge capture for billing."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    encounter_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    service_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cpt_code: Mapped[str] = mapped_column(String(20), nullable=False)
    icd10_codes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    modifiers: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    units: Mapped[int] = mapped_column(Integer, default=1)
    charge_amount: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="captured")
    place_of_service: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    rendering_provider_npi: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)


class ClaimSubmission(Base):
    """Insurance claim submission."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    invoice_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("invoice.id"), nullable=True)
    payer_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    claim_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    claim_type: Mapped[str] = mapped_column(String(20), default="professional")
    total_charged: Mapped[float] = mapped_column(Float, default=0.0)
    total_allowed: Mapped[float] = mapped_column(Float, default=0.0)
    total_paid: Mapped[float] = mapped_column(Float, default=0.0)
    patient_responsibility: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default=ClaimStatus.DRAFT.value)
    submitted_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    adjudicated_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    claim_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    eob_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    rejection_codes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    denial_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class DenialManagement(Base):
    """Claim denial tracking and appeal management."""
    claim_id: Mapped[str] = mapped_column(String(36), ForeignKey("claim_submission.id"), nullable=False)
    denial_code: Mapped[str] = mapped_column(String(20), nullable=False)
    denial_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    denial_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    amount_denied: Mapped[float] = mapped_column(Float, default=0.0)
    appeal_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    appeal_filed: Mapped[bool] = mapped_column(Boolean, default=False)
    appeal_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    appeal_level: Mapped[int] = mapped_column(Integer, default=1)
    appeal_outcome: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    supporting_docs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    recovered_amount: Mapped[float] = mapped_column(Float, default=0.0)


class FinancialCounseling(Base):
    """Financial counseling and assistance programs."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    counselor_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    session_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_costs: Mapped[float] = mapped_column(Float, default=0.0)
    financial_hardship: Mapped[bool] = mapped_column(Boolean, default=False)
    assistance_programs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    payment_plan_offered: Mapped[bool] = mapped_column(Boolean, default=False)
    payment_plan_terms: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    charity_care_eligible: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    follow_up_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
