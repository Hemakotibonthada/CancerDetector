"""Insurance Model"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, AuditMixin

class InsuranceProvider(str, enum.Enum):
    AETNA = "aetna"
    BLUE_CROSS = "blue_cross"
    CIGNA = "cigna"
    HUMANA = "humana"
    UNITED_HEALTH = "united_health"
    KAISER = "kaiser"
    MEDICARE = "medicare"
    MEDICAID = "medicaid"
    TRICARE = "tricare"
    OTHER = "other"

class Insurance(Base, AuditMixin):
    __tablename__ = "insurance"
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_name: Mapped[str] = mapped_column(String(200), nullable=False)
    provider_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    policy_number: Mapped[str] = mapped_column(String(100), nullable=False)
    group_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    member_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    plan_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    plan_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    coverage_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    coverage_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)
    copay_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    deductible: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    deductible_met: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    out_of_pocket_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    subscriber_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    subscriber_relationship: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    pre_authorization_required: Mapped[bool] = mapped_column(Boolean, default=False)
    cancer_coverage: Mapped[bool] = mapped_column(Boolean, default=True)
    cancer_coverage_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    __table_args__ = (
        Index("ix_insurance_patient", "patient_id", "is_primary"),
    )

class InsuranceClaim(Base, AuditMixin):
    __tablename__ = "insurance_claims"
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id", ondelete="CASCADE"), nullable=False, index=True)
    insurance_id: Mapped[str] = mapped_column(String(36), ForeignKey("insurance.id"), nullable=False)
    health_record_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("health_records.id"), nullable=True)
    claim_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    claim_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    service_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="submitted", nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    covered_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    patient_responsibility: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    diagnosis_codes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    procedure_codes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    denial_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
