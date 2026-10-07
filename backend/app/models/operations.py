"""Persisted operational records that existing screens had nowhere to store."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class HospitalBed(Base):
    """An individual hospital bed and its current occupancy."""

    __tablename__ = "hospital_beds"

    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False, index=True)
    ward: Mapped[str] = mapped_column(String(120), nullable=False)
    bed_code: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="available", nullable=False)
    patient_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("patient.id"), nullable=True)
    diagnosis: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    attending_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    acuity: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    admitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    transfer_to_ward: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    transfer_reason: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    transfer_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)


class OperatingRoom(Base):
    """An operating room and its current status."""

    __tablename__ = "operating_rooms"

    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="available", nullable=False)
    current_procedure: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)


class ExerciseSession(Base):
    """A patient-logged exercise session."""

    __tablename__ = "exercise_sessions"

    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False, index=True)
    session_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    exercise_type: Mapped[str] = mapped_column(String(80), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    calories_burned: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    steps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class SecondOpinionRequest(Base):
    """A patient request for a second clinical opinion. No automated diagnosis is stored."""

    __tablename__ = "second_opinion_requests"

    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False, index=True)
    original_diagnosis: Mapped[str] = mapped_column(String(500), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="requested", nullable=False)
    reviewer_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    hospital_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    agreement_recorded: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)


class PharmacyStockItem(Base):
    """On-hand pharmacy stock. Quantities are recorded by staff, not estimated."""

    __tablename__ = "pharmacy_stock_items"

    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True, index=True)
    drug_name: Mapped[str] = mapped_column(String(200), nullable=False)
    generic_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reorder_level: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    batch_number: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class IntegrationConnection(Base):
    """Saved integration settings. Connecting does not call the remote endpoint."""

    __tablename__ = "integration_connections"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    integration_type: Mapped[str] = mapped_column(String(40), nullable=False)
    endpoint_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    api_key_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    sync_frequency: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="configured", nullable=False)
    records_synced: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)


class DatabaseExportLog(Base):
    """Metadata for an on-demand JSON export. The dump itself is not stored."""

    __tablename__ = "database_export_logs"

    requested_by: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    export_type: Mapped[str] = mapped_column(String(40), default="json", nullable=False)
    byte_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    table_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    row_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="completed", nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class PlatformInvoice(Base):
    """A hospital billing invoice. Patient invoices stay on the invoice table."""

    __tablename__ = "platform_invoices"

    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    hospital_name: Mapped[str] = mapped_column(String(200), nullable=False)
    plan_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
