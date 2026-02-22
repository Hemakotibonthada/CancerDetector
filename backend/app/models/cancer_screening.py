"""
Cancer Screening Model - Cancer Detection & Risk Assessment
============================================================
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    String, Boolean, Integer, DateTime, Text, Float,
    ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, AuditMixin


class CancerType(str, enum.Enum):
    LUNG = "lung"
    BREAST = "breast"
    COLORECTAL = "colorectal"
    PROSTATE = "prostate"
    SKIN_MELANOMA = "skin_melanoma"
    SKIN_NON_MELANOMA = "skin_non_melanoma"
    BLADDER = "bladder"
    KIDNEY = "kidney"
    THYROID = "thyroid"
    PANCREATIC = "pancreatic"
    LIVER = "liver"
    STOMACH = "stomach"
    ESOPHAGEAL = "esophageal"
    CERVICAL = "cervical"
    OVARIAN = "ovarian"
    UTERINE = "uterine"
    LEUKEMIA = "leukemia"
    LYMPHOMA_HODGKIN = "lymphoma_hodgkin"
    LYMPHOMA_NON_HODGKIN = "lymphoma_non_hodgkin"
    MULTIPLE_MYELOMA = "multiple_myeloma"
    BRAIN = "brain"
    HEAD_NECK = "head_neck"
    TESTICULAR = "testicular"
    BONE = "bone"
    SOFT_TISSUE_SARCOMA = "soft_tissue_sarcoma"
    MESOTHELIOMA = "mesothelioma"
    ORAL = "oral"
    GALLBLADDER = "gallbladder"
    SMALL_INTESTINE = "small_intestine"
    ADRENAL = "adrenal"
    OTHER = "other"
    UNKNOWN = "unknown"


class ScreeningMethod(str, enum.Enum):
    MAMMOGRAPHY = "mammography"
    COLONOSCOPY = "colonoscopy"
    LOW_DOSE_CT = "low_dose_ct"
    PAP_SMEAR = "pap_smear"
    PSA_TEST = "psa_test"
    SKIN_EXAMINATION = "skin_examination"
    BLOOD_TEST = "blood_test"
    LIQUID_BIOPSY = "liquid_biopsy"
    BIOPSY = "biopsy"
    MRI = "mri"
    CT_SCAN = "ct_scan"
    PET_SCAN = "pet_scan"
    ULTRASOUND = "ultrasound"
    X_RAY = "x_ray"
    ENDOSCOPY = "endoscopy"
    GENETIC_TESTING = "genetic_testing"
    AI_ANALYSIS = "ai_analysis"
    SMARTWATCH_MONITORING = "smartwatch_monitoring"
    BIOMARKER_PANEL = "biomarker_panel"
    OTHER = "other"


class RiskCategory(str, enum.Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"
    CRITICAL = "critical"


class PredictionConfidence(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"


# ============================================================================
# Cancer Screening Model
# ============================================================================

class CancerScreening(Base, AuditMixin):
    """
    Cancer screening records and results.
    """
    
    __tablename__ = "cancer_screenings"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    health_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    
    # Screening Info
    screening_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    screening_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    cancer_type_screened: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    screening_method: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Hospital/Doctor
    hospital_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("hospitals.id"), nullable=True
    )
    doctor_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("doctors.id"), nullable=True
    )
    
    # Results
    result: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    result_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    findings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    abnormalities_found: Mapped[bool] = mapped_column(Boolean, default=False)
    suspicious_areas: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Staging (if cancer detected)
    cancer_detected: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    cancer_stage: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    cancer_grade: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    tnm_classification: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Histology
    histology_type: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    differentiation: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Recommendations
    follow_up_required: Mapped[bool] = mapped_column(Boolean, default=False)
    follow_up_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    follow_up_tests: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    referral_required: Mapped[bool] = mapped_column(Boolean, default=False)
    referral_specialist: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # AI Analysis
    ai_analyzed: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_risk_category: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ai_detailed_analysis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Linked Records
    health_record_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("health_records.id"), nullable=True
    )
    blood_sample_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("blood_samples.id"), nullable=True
    )
    
    # Clinical Notes
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    patient_symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    __table_args__ = (
        Index("ix_screening_patient_date", "patient_id", "screening_date"),
        Index("ix_screening_cancer_type", "cancer_type_screened", "cancer_detected"),
        Index("ix_screening_ai_risk", "ai_risk_score", "ai_risk_category"),
    )


# ============================================================================
# Cancer Risk Assessment Model
# ============================================================================

class CancerRiskAssessment(Base, AuditMixin):
    """
    Comprehensive cancer risk assessment combining all data sources.
    """
    
    __tablename__ = "cancer_risk_assessments"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    health_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    
    # Assessment Info
    assessment_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    assessment_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    assessment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Overall Risk
    overall_risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    overall_risk_category: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    overall_risk_percentile: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_change_from_last: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Risk by Cancer Type
    lung_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    breast_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    colorectal_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    prostate_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    skin_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    liver_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pancreatic_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    kidney_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bladder_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    thyroid_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stomach_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ovarian_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cervical_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    leukemia_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lymphoma_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    brain_cancer_risk: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Risk Factor Analysis
    genetic_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lifestyle_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    environmental_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    biomarker_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    smartwatch_anomaly_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    family_history_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    age_risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Data Sources Used
    blood_data_used: Mapped[bool] = mapped_column(Boolean, default=False)
    smartwatch_data_used: Mapped[bool] = mapped_column(Boolean, default=False)
    genetic_data_used: Mapped[bool] = mapped_column(Boolean, default=False)
    imaging_data_used: Mapped[bool] = mapped_column(Boolean, default=False)
    clinical_data_used: Mapped[bool] = mapped_column(Boolean, default=False)
    family_history_used: Mapped[bool] = mapped_column(Boolean, default=False)
    lifestyle_data_used: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Feature Importance
    top_risk_factors: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    protective_factors: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    modifiable_risk_factors: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # AI Model Details
    ai_model_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ai_model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    prediction_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shap_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Recommendations
    screening_recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    lifestyle_recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    follow_up_recommendations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    urgency_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Doctor Review
    reviewed_by_doctor: Mapped[bool] = mapped_column(Boolean, default=False)
    reviewing_doctor_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    doctor_agreement: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    doctor_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    doctor_reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Notification
    patient_notified: Mapped[bool] = mapped_column(Boolean, default=False)
    patient_notified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    __table_args__ = (
        Index("ix_risk_assessment_patient", "patient_id", "assessment_date"),
        Index("ix_risk_assessment_category", "overall_risk_category", "assessment_date"),
    )


# ============================================================================
# Cancer Prediction Model
# ============================================================================

class CancerPrediction(Base):
    """
    Individual cancer type prediction from AI model.
    """
    
    __tablename__ = "cancer_predictions"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    risk_assessment_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("cancer_risk_assessments.id"), nullable=True
    )
    
    # Prediction
    cancer_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    prediction_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    
    # Results
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    risk_category: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Model Info
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    feature_set: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Explanation
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shap_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    lime_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    key_contributing_features: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Validation
    validated: Mapped[bool] = mapped_column(Boolean, default=False)
    actual_outcome: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    outcome_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    __table_args__ = (
        Index("ix_prediction_patient_type", "patient_id", "cancer_type"),
        Index("ix_prediction_probability", "probability", "cancer_type"),
    )


# ============================================================================
# Screening Recommendation Model
# ============================================================================

class ScreeningRecommendation(Base):
    """
    AI-generated screening recommendations.
    """
    
    __tablename__ = "screening_recommendations"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    risk_assessment_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("cancer_risk_assessments.id"), nullable=True
    )
    
    # Recommendation
    cancer_type: Mapped[str] = mapped_column(String(50), nullable=False)
    screening_method: Mapped[str] = mapped_column(String(50), nullable=False)
    urgency: Mapped[str] = mapped_column(String(20), nullable=False)
    recommended_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    frequency: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Rationale
    rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    risk_factors_cited: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    guideline_reference: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Status
    accepted_by_patient: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    accepted_by_doctor: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    scheduled: Mapped[bool] = mapped_column(Boolean, default=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    __table_args__ = (
        Index("ix_screening_rec_patient", "patient_id", "urgency"),
    )


# ============================================================================
# Tumor Marker Model
# ============================================================================

class TumorMarker(Base):
    """
    Tumor marker tracking over time.
    """
    
    __tablename__ = "tumor_markers"
    
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    blood_sample_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("blood_samples.id"), nullable=True
    )
    
    # Marker Info
    marker_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    marker_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    test_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    
    # Results
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    reference_range_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reference_range_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_elevated: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Cancer Types Associated
    associated_cancer_types: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    
    # Trending
    previous_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trend: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    percent_change: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Clinical Significance
    clinical_significance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    __table_args__ = (
        Index("ix_tumor_marker_patient", "patient_id", "marker_name", "test_date"),
    )
