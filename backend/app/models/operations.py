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
