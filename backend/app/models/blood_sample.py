"""
Blood Sample Model - Blood Test & Biomarker Analysis
=====================================================

Models for blood sample collection, testing, biomarker analysis,
and cancer-specific blood markers.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    String, Boolean, Integer, DateTime, Text, Float,
    ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, AuditMixin


class BloodTestType(str, enum.Enum):
    COMPLETE_BLOOD_COUNT = "complete_blood_count"
    COMPREHENSIVE_METABOLIC_PANEL = "comprehensive_metabolic_panel"
    BASIC_METABOLIC_PANEL = "basic_metabolic_panel"
    LIPID_PANEL = "lipid_panel"
    LIVER_FUNCTION_TEST = "liver_function_test"
    RENAL_FUNCTION_TEST = "renal_function_test"
    THYROID_FUNCTION_TEST = "thyroid_function_test"
    COAGULATION_PANEL = "coagulation_panel"
    TUMOR_MARKERS = "tumor_markers"
    HORMONE_PANEL = "hormone_panel"
    INFLAMMATORY_MARKERS = "inflammatory_markers"
    IRON_STUDIES = "iron_studies"
    VITAMIN_PANEL = "vitamin_panel"
    IMMUNOGLOBULIN_PANEL = "immunoglobulin_panel"
    BLOOD_GAS_ANALYSIS = "blood_gas_analysis"
    HEMOGLOBIN_A1C = "hemoglobin_a1c"
    GENETIC_MARKERS = "genetic_markers"
    LIQUID_BIOPSY = "liquid_biopsy"
    CIRCULATING_TUMOR_DNA = "circulating_tumor_dna"
    CIRCULATING_TUMOR_CELLS = "circulating_tumor_cells"
    CANCER_ANTIGEN_PANEL = "cancer_antigen_panel"
    CYTOKINE_PANEL = "cytokine_panel"
    ALLERGY_PANEL = "allergy_panel"
    DRUG_SCREENING = "drug_screening"
    BLOOD_TYPING = "blood_typing"
    CROSS_MATCH = "cross_match"
    BLOOD_CULTURE = "blood_culture"
    URINALYSIS = "urinalysis"
    OTHER = "other"


class SampleStatus(str, enum.Enum):
    COLLECTED = "collected"
    IN_TRANSIT = "in_transit"
    RECEIVED_AT_LAB = "received_at_lab"
    PROCESSING = "processing"
    ANALYSIS_IN_PROGRESS = "analysis_in_progress"
    QUALITY_CHECK = "quality_check"
    COMPLETED = "completed"
    RESULTS_READY = "results_ready"
    RESULTS_DELIVERED = "results_delivered"
    REJECTED = "rejected"
    HEMOLYZED = "hemolyzed"
    INSUFFICIENT = "insufficient"
    REPEAT_REQUIRED = "repeat_required"


class BiomarkerCategory(str, enum.Enum):
    HEMATOLOGY = "hematology"
    BIOCHEMISTRY = "biochemistry"
    TUMOR_MARKER = "tumor_marker"
    HORMONES = "hormones"
    IMMUNOLOGY = "immunology"
    COAGULATION = "coagulation"
    INFLAMMATORY = "inflammatory"
    METABOLIC = "metabolic"
    GENETIC = "genetic"
    VITAMIN_MINERAL = "vitamin_mineral"
    LIVER = "liver"
    RENAL = "renal"
    CARDIAC = "cardiac"
    THYROID = "thyroid"
    LIPID = "lipid"
    OTHER = "other"


class ResultFlag(str, enum.Enum):
    NORMAL = "normal"
    LOW = "low"
    HIGH = "high"
    CRITICAL_LOW = "critical_low"
    CRITICAL_HIGH = "critical_high"
    ABNORMAL = "abnormal"
    BORDERLINE = "borderline"
    INCONCLUSIVE = "inconclusive"
    NOT_DETECTED = "not_detected"
    DETECTED = "detected"
    POSITIVE = "positive"
    NEGATIVE = "negative"


# ============================================================================
# Blood Sample Model
# ============================================================================

class BloodSample(Base, AuditMixin):
    """
    Blood sample collection and processing record.
    """
    
    __tablename__ = "blood_samples"
    
    # Patient
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    health_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    
    # Sample Info
    sample_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    barcode: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    test_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    sample_status: Mapped[str] = mapped_column(
        String(30), default=SampleStatus.COLLECTED.value, nullable=False
    )
    
    # Collection Details
    collection_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    collection_time: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    collected_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    collection_site: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    collection_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Collection Conditions
    fasting: Mapped[bool] = mapped_column(Boolean, default=False)
    fasting_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tube_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    volume_ml: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Hospital/Lab
    hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospital.id"), nullable=True
    )
    lab_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    ordering_doctor_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("doctors.id"), nullable=True
    )
    
    # Processing
    received_at_lab: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    processing_started: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    processing_completed: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    results_ready_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    turnaround_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Quality
    sample_quality: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hemolysis_index: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lipemia_index: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    icterus_index: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Results Summary
    total_tests: Mapped[int] = mapped_column(Integer, default=0)
    normal_results: Mapped[int] = mapped_column(Integer, default=0)
    abnormal_results: Mapped[int] = mapped_column(Integer, default=0)
    critical_results: Mapped[int] = mapped_column(Integer, default=0)
    
    # AI Analysis
    ai_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_cancer_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ai_anomalies_detected: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    ai_recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    ai_analysis_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ai_model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Verification
    verified_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    pathologist_review: Mapped[bool] = mapped_column(Boolean, default=False)
    pathologist_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Clinical Context
    clinical_indication: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    patient_medications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Linked Records
    health_record_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("health_records.id"), nullable=True
    )
    
    # Relationships
    biomarkers: Mapped[List["BloodBiomarker"]] = relationship(
        "BloodBiomarker", back_populates="blood_sample", cascade="all, delete-orphan"
    )
    test_results: Mapped[List["BloodTestResult"]] = relationship(
        "BloodTestResult", back_populates="blood_sample", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_blood_sample_patient_date", "patient_id", "collection_date"),
        Index("ix_blood_sample_type_status", "test_type", "sample_status"),
        Index("ix_blood_sample_ai_risk", "ai_cancer_risk_score"),
    )


# ============================================================================
# Blood Biomarker Model
# ============================================================================

class BloodBiomarker(Base):
    """
    Individual biomarker results from blood tests.
    Each result includes reference ranges and AI analysis.
    """
    
    __tablename__ = "blood_biomarkers"
    
    blood_sample_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("blood_samples.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    # Biomarker Identification
    biomarker_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    biomarker_code: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    
    # Results
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    result_flag: Mapped[str] = mapped_column(
        String(20), default=ResultFlag.NORMAL.value, nullable=False
    )
    
    # Reference Ranges
    reference_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reference_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    critical_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    critical_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    optimal_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    optimal_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Percentage Deviation
    deviation_from_normal: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    percentile: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Trending
    previous_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trend_direction: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    trend_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_trending_abnormal: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Cancer Relevance
    is_cancer_marker: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    cancer_type_relevance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    cancer_risk_contribution: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # AI Analysis
    ai_significance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_pattern_detected: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_recommended_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Method
    testing_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    analyzer_used: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False)
    critical_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    critical_notified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationship
    blood_sample: Mapped["BloodSample"] = relationship(
        "BloodSample", back_populates="biomarkers"
    )
    
    __table_args__ = (
        Index("ix_biomarker_name_flag", "biomarker_name", "result_flag"),
        Index("ix_biomarker_cancer_marker", "is_cancer_marker", "cancer_risk_contribution"),
        Index("ix_biomarker_sample_name", "blood_sample_id", "biomarker_name"),
    )


# ============================================================================
# Blood Test Result Model
# ============================================================================

class BloodTestResult(Base, AuditMixin):
    """
    Comprehensive blood test result with interpretation.
    """
    
    __tablename__ = "blood_test_results"
    
    blood_sample_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("blood_samples.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    
    # Test Details
    test_name: Mapped[str] = mapped_column(String(200), nullable=False)
    test_code: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    test_category: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Results
    result_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    result_unit: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    result_flag: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Reference
    reference_range: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Interpretation
    interpretation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    clinical_significance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Review
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationship
    blood_sample: Mapped["BloodSample"] = relationship(
        "BloodSample", back_populates="test_results"
    )
    
    __table_args__ = (
        Index("ix_test_result_sample", "blood_sample_id", "test_name"),
    )
