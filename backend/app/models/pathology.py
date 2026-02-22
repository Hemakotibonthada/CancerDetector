"""
Digital Pathology Models
=========================
Specimens, slides, staining protocols, pathology reports,
tumor boards, and cytology.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SpecimenStatus(str, enum.Enum):
    COLLECTED = "collected"
    IN_TRANSIT = "in_transit"
    RECEIVED = "received"
    PROCESSING = "processing"
    ANALYZED = "analyzed"
    ARCHIVED = "archived"


class SlideStatus(str, enum.Enum):
    PREPARED = "prepared"
    STAINED = "stained"
    SCANNED = "scanned"
    UNDER_REVIEW = "under_review"
    REVIEWED = "reviewed"


class Specimen(Base):
    """Pathology specimen tracking."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    accession_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    specimen_type: Mapped[str] = mapped_column(String(100), nullable=False)
    collection_site: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    collection_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    collected_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    collected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    received_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=SpecimenStatus.COLLECTED.value)
    fixative: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    fixation_time_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    gross_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dimensions: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    weight_grams: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    block_count: Mapped[int] = mapped_column(Integer, default=0)
    priority: Mapped[str] = mapped_column(String(20), default="routine")
    clinical_history: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    requesting_physician_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)


class PathologyBlock(Base):
    """Tissue block from specimen."""
    specimen_id: Mapped[str] = mapped_column(String(36), ForeignKey("specimen.id"), nullable=False)
    block_id: Mapped[str] = mapped_column(String(20), nullable=False)
    tissue_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    embedding_medium: Mapped[str] = mapped_column(String(50), default="paraffin")
    sections_cut: Mapped[int] = mapped_column(Integer, default=0)
    storage_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PathologySlide(Base):
    """Pathology slide preparation and analysis."""
    specimen_id: Mapped[str] = mapped_column(String(36), ForeignKey("specimen.id"), nullable=False)
    block_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("pathology_block.id"), nullable=True)
    slide_number: Mapped[str] = mapped_column(String(20), nullable=False)
    staining_protocol_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("staining_protocol.id"), nullable=True)
    stain_type: Mapped[str] = mapped_column(String(100), default="H&E")
    status: Mapped[str] = mapped_column(String(20), default=SlideStatus.PREPARED.value)
    prepared_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    prepared_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    scanned: Mapped[bool] = mapped_column(Boolean, default=False)
    scan_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    scan_magnification: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    scan_resolution: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ai_analysis_result: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pathologist_review: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class StainingProtocol(Base):
    """Staining protocol definition."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    stain_type: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    steps: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    reagents: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    temperature: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    target_markers: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    quality_criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    approved: Mapped[bool] = mapped_column(Boolean, default=True)


class PathologyReport(Base):
    """Final pathology report."""
    specimen_id: Mapped[str] = mapped_column(String(36), ForeignKey("specimen.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    pathologist_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    report_number: Mapped[str] = mapped_column(String(50), nullable=False)
    report_type: Mapped[str] = mapped_column(String(50), default="surgical")
    diagnosis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    microscopic_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gross_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    clinical_correlation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    synoptic_report: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    tnm_staging: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    grade: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    margins: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    lymph_nodes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    immunohistochemistry: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    molecular_testing: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    ancillary_studies: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    addenda: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    turnaround_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    amendments: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class TumorBoard(Base):
    """Tumor board case discussion."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=False)
    case_number: Mapped[str] = mapped_column(String(50), nullable=False)
    meeting_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancer_type: Mapped[str] = mapped_column(String(100), nullable=False)
    stage: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    presenting_physician_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    attendees: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    case_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    imaging_reviewed: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    pathology_reviewed: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    genomic_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    discussion_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    treatment_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    clinical_trial_eligible: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    trial_recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    follow_up_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="scheduled")
    recording_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class CytologyResult(Base):
    """Cytology screening result."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    specimen_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("specimen.id"), nullable=True)
    test_type: Mapped[str] = mapped_column(String(50), nullable=False)
    collection_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    result: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bethesda_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    adequacy: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    organisms: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    epithelial_abnormalities: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    hpv_testing: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    review_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
