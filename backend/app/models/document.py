"""Document & Insurance Models"""
from __future__ import annotations
import enum
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class DocumentCategory(str, enum.Enum):
    MEDICAL_REPORT = "medical_report"
    LAB_RESULT = "lab_result"
    PRESCRIPTION = "prescription"
    IMAGING = "imaging"
    DISCHARGE_SUMMARY = "discharge_summary"
    SURGERY_REPORT = "surgery_report"
    INSURANCE_CARD = "insurance_card"
    INSURANCE_CLAIM = "insurance_claim"
    INSURANCE_EOB = "insurance_eob"
    IDENTITY = "identity"
    CONSENT_FORM = "consent_form"
    REFERRAL = "referral"
    VACCINATION = "vaccination"
    PATHOLOGY = "pathology"
    OTHER = "other"


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    VERIFIED = "verified"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class InsurancePlanType(str, enum.Enum):
    HMO = "hmo"
    PPO = "ppo"
    EPO = "epo"
    POS = "pos"
    HDHP = "hdhp"
    MEDICARE = "medicare"
    MEDICAID = "medicaid"
    TRICARE = "tricare"
    OTHER = "other"


class InsuranceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Document(Base):
    """Uploaded documents (medical reports, insurance docs, etc.)"""
    __tablename__ = "documents"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), default=DocumentCategory.OTHER.value, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=DocumentStatus.UPLOADED.value, nullable=False)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    # Metadata
    doctor_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    hospital_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    document_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expiry_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string of tags
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Sharing
    is_shared_with_doctor: Mapped[bool] = mapped_column(Boolean, default=False)
    shared_with_ids: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string
    # Insurance link
    insurance_policy_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("insurance_policies.id"), nullable=True)


class InsurancePolicy(Base):
    """User's insurance policies"""
    __tablename__ = "insurance_policies"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False, index=True)
    # Policy details
    policy_number: Mapped[str] = mapped_column(String(100), nullable=False)
    group_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    member_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # Insurer info
    insurance_company: Mapped[str] = mapped_column(String(200), nullable=False)
    plan_name: Mapped[str] = mapped_column(String(200), nullable=False)
    plan_type: Mapped[str] = mapped_column(String(30), default=InsurancePlanType.PPO.value, nullable=False)
    # Status & dates
    status: Mapped[str] = mapped_column(String(20), default=InsuranceStatus.ACTIVE.value, nullable=False)
    effective_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    # Coverage details
    coverage_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # individual, family
    deductible: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    deductible_met: Mapped[Optional[float]] = mapped_column(Float, default=0)
    copay: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    coinsurance_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    out_of_pocket_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    out_of_pocket_spent: Mapped[Optional[float]] = mapped_column(Float, default=0)
    premium_monthly: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Contact info
    customer_service_phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    claims_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Front/back card images (document IDs)
    card_front_document_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    card_back_document_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    # Additional
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rx_bin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    rx_pcn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    rx_group: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class UserInsuranceClaim(Base):
    """Insurance claims tracking (user-submitted)"""
    __tablename__ = "user_insurance_claims"
    
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False, index=True)
    policy_id: Mapped[str] = mapped_column(String(36), ForeignKey("insurance_policies.id"), nullable=False)
    claim_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    service_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    provider_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    service_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    billed_amount: Mapped[float] = mapped_column(Float, default=0)
    allowed_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    insurance_paid: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    patient_responsibility: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="submitted")  # submitted, processing, approved, denied, appealed
    denial_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    eob_document_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
