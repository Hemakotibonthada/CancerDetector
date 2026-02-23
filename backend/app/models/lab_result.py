"""Lab Result, Medical Image, Insurance, Emergency Contact, Device, Report, Feedback, System Config Models"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, AuditMixin

# ============================================================================
# Lab Result Models
# ============================================================================
class LabTestCategory(str, enum.Enum):
    HEMATOLOGY = "hematology"
    BIOCHEMISTRY = "biochemistry"
    MICROBIOLOGY = "microbiology"
    IMMUNOLOGY = "immunology"
    MOLECULAR = "molecular"
    PATHOLOGY = "pathology"
    TOXICOLOGY = "toxicology"
    GENETICS = "genetics"
    URINALYSIS = "urinalysis"
    OTHER = "other"

class LabTest(Base):
    __tablename__ = "lab_tests"
    test_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    test_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    specimen_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reference_range: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    turnaround_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    requires_fasting: Mapped[bool] = mapped_column(Boolean, default=False)
    cancer_related: Mapped[bool] = mapped_column(Boolean, default=False)
    
class LabOrder(Base, AuditMixin):
    __tablename__ = "lab_orders"
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="ordered", nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="routine", nullable=False)
    tests_ordered: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    clinical_indication: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
class LabResult(Base, AuditMixin):
    __tablename__ = "lab_results"
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id", ondelete="CASCADE"), nullable=False, index=True)
    lab_order_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("lab_orders.id"), nullable=True)
    lab_test_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("lab_tests.id"), nullable=True)
    result_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    test_name: Mapped[str] = mapped_column(String(200), nullable=False)
    test_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    result_value: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    result_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    reference_range: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    flag: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_abnormal: Mapped[bool] = mapped_column(Boolean, default=False)
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False)
    interpretation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    performing_lab: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    verified_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    report_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    __table_args__ = (
        Index("ix_lab_result_patient_date", "patient_id", "test_date"),
    )
