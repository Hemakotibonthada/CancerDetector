"""
Enhanced Radiology & Imaging Models
=====================================
AI-assisted reading, tumor measurements, radiation dose tracking,
structured reports, imaging protocols, and contrast reactions.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ModalityType(str, enum.Enum):
    CT = "ct"
    MRI = "mri"
    PET = "pet"
    PET_CT = "pet_ct"
    XRAY = "xray"
    ULTRASOUND = "ultrasound"
    MAMMOGRAPHY = "mammography"
    FLUOROSCOPY = "fluoroscopy"
    NUCLEAR = "nuclear"
    DEXA = "dexa"


class RecistResponse(str, enum.Enum):
    COMPLETE = "complete_response"
    PARTIAL = "partial_response"
    STABLE = "stable_disease"
    PROGRESSIVE = "progressive_disease"
    NOT_EVALUABLE = "not_evaluable"


class AIReadingResult(Base):
    """AI-assisted radiology reading result."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    study_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    modality: Mapped[str] = mapped_column(String(20), default=ModalityType.CT.value)
    body_region: Mapped[str] = mapped_column(String(100), nullable=False)
    ai_model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    ai_model_version: Mapped[str] = mapped_column(String(20), nullable=False)
    findings: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    primary_finding: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    abnormality_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    priority_flag: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    heatmap_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    segmentation_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    measurements: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    comparison_studies: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    radiologist_agreement: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    radiologist_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    radiologist_reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    processing_time_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dicom_series_uid: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)


class TumorMeasurement(Base):
    """Tumor measurement tracking (RECIST/WHO)."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    study_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ai_reading_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("ai_reading_result.id"), nullable=True)
    lesion_id: Mapped[str] = mapped_column(String(50), nullable=False)
    lesion_type: Mapped[str] = mapped_column(String(30), default="target")
    anatomy: Mapped[str] = mapped_column(String(100), nullable=False)
    measurement_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    longest_diameter_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    perpendicular_diameter_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    volume_mm3: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    suv_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    suv_mean: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hounsfield_units: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    change_from_baseline_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    change_from_nadir_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recist_response: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    measurement_method: Mapped[str] = mapped_column(String(20), default="recist_1.1")
    measured_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    verified_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    coordinates: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    annotation_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class RadiationDoseRecord(Base):
    """Radiation dose tracking for patient safety."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    study_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    modality: Mapped[str] = mapped_column(String(20), nullable=False)
    procedure_name: Mapped[str] = mapped_column(String(200), nullable=False)
    body_region: Mapped[str] = mapped_column(String(100), nullable=False)
    ctdi_vol_mgy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dlp_mgy_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    effective_dose_msv: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dap_gy_cm2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fluoroscopy_time_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    kvp: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ma: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    number_of_exposures: Mapped[int] = mapped_column(Integer, default=1)
    protocol_used: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    dose_reduction_technique: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    cumulative_dose_msv: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exceeds_drl: Mapped[bool] = mapped_column(Boolean, default=False)
    technologist_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    equipment_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)


class StructuredRadiologyReport(Base):
    """Structured radiology report."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    radiologist_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    study_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ai_reading_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("ai_reading_result.id"), nullable=True)
    accession_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    modality: Mapped[str] = mapped_column(String(20), nullable=False)
    exam_name: Mapped[str] = mapped_column(String(200), nullable=False)
    clinical_indication: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    technique: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    comparison: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    findings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    structured_findings: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    impression: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    birads_category: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    lung_rads: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    li_rads: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    pi_rads: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    ti_rads: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    critical_finding: Mapped[bool] = mapped_column(Boolean, default=False)
    critical_finding_communicated: Mapped[bool] = mapped_column(Boolean, default=False)
    communicated_to: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    communicated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    addendum: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ImagingProtocol(Base):
    """Standardized imaging protocol."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    modality: Mapped[str] = mapped_column(String(20), nullable=False)
    body_region: Mapped[str] = mapped_column(String(100), nullable=False)
    indication: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parameters: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    contrast_required: Mapped[bool] = mapped_column(Boolean, default=False)
    contrast_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contrast_volume_ml: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    contrast_rate: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    delay_seconds: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    patient_prep: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    estimated_duration_min: Mapped[int] = mapped_column(Integer, default=30)
    dose_reference_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    approved: Mapped[bool] = mapped_column(Boolean, default=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)


class ContrastReaction(Base):
    """Contrast media adverse reaction record."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    study_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    contrast_agent: Mapped[str] = mapped_column(String(200), nullable=False)
    contrast_volume_ml: Mapped[float] = mapped_column(Float, nullable=False)
    reaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    onset_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    symptoms: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    treatment_given: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    outcome: Mapped[str] = mapped_column(String(50), default="resolved")
    premedication_given: Mapped[bool] = mapped_column(Boolean, default=False)
    premedication_details: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    prior_reactions: Mapped[bool] = mapped_column(Boolean, default=False)
    creatinine_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    egfr_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reported_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ImagingOrderTracking(Base):
    """Imaging order tracking and scheduling."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    ordering_provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    modality: Mapped[str] = mapped_column(String(20), nullable=False)
    exam_name: Mapped[str] = mapped_column(String(200), nullable=False)
    clinical_indication: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icd10_codes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="routine")
    status: Mapped[str] = mapped_column(String(20), default="ordered")
    ordered_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    prior_auth_required: Mapped[bool] = mapped_column(Boolean, default=False)
    prior_auth_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    contrast_required: Mapped[bool] = mapped_column(Boolean, default=False)
    prep_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    special_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    report_available: Mapped[bool] = mapped_column(Boolean, default=False)
    turnaround_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
