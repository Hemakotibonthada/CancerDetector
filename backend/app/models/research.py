"""
Research & Clinical Studies Models
====================================
Research studies, cohorts, publications, datasets, IRB management,
biostatistics, and academic collaboration tools.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class StudyStatus(str, enum.Enum):
    PLANNING = "planning"
    ETHICS_REVIEW = "ethics_review"
    RECRUITING = "recruiting"
    ACTIVE = "active"
    ANALYSIS = "analysis"
    COMPLETED = "completed"
    PUBLISHED = "published"
    TERMINATED = "terminated"


class StudyDesign(str, enum.Enum):
    COHORT = "cohort"
    CASE_CONTROL = "case_control"
    RCT = "randomized_controlled_trial"
    CROSS_SECTIONAL = "cross_sectional"
    RETROSPECTIVE = "retrospective"
    PROSPECTIVE = "prospective"
    META_ANALYSIS = "meta_analysis"


class ResearchStudy(Base):
    """Research study or clinical investigation."""
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    protocol_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    principal_investigator: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    study_design: Mapped[str] = mapped_column(String(50), default=StudyDesign.PROSPECTIVE.value)
    status: Mapped[str] = mapped_column(String(30), default=StudyStatus.PLANNING.value)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hypothesis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    primary_endpoint: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    secondary_endpoints: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    inclusion_criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    exclusion_criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    target_enrollment: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_enrollment: Mapped[int] = mapped_column(Integer, default=0)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    irb_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    irb_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    funding_source: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    budget: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class ResearchCohort(Base):
    """Define patient cohorts for research."""
    study_id: Mapped[str] = mapped_column(String(36), ForeignKey("research_study.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    patient_count: Mapped[int] = mapped_column(Integer, default=0)
    arm_label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_control: Mapped[bool] = mapped_column(Boolean, default=False)
    demographics: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class CohortPatient(Base):
    """Patient enrolled in a research cohort."""
    cohort_id: Mapped[str] = mapped_column(String(36), ForeignKey("research_cohort.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    enrolled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    consent_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    consent_document: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="enrolled")
    withdrawal_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    withdrawal_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class ResearchPublication(Base):
    """Published research papers."""
    study_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("research_study.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    authors: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    journal: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    doi: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pubmed_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    abstract: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    publication_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    impact_factor: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)
    pdf_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    keywords: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="draft")


class ResearchDataset(Base):
    """Research dataset for analysis."""
    study_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("research_study.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data_type: Mapped[str] = mapped_column(String(50), nullable=False)
    format: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    record_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    variables: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_size_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    anonymized: Mapped[bool] = mapped_column(Boolean, default=True)
    access_level: Mapped[str] = mapped_column(String(20), default="restricted")
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")


class IRBSubmission(Base):
    """Institutional Review Board submissions."""
    study_id: Mapped[str] = mapped_column(String(36), ForeignKey("research_study.id"), nullable=False)
    submission_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    submission_type: Mapped[str] = mapped_column(String(50), nullable=False)
    submitted_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending")
    review_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    decision: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    conditions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    approval_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    documents: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    amendments: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    committee_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class BiostatisticsAnalysis(Base):
    """Statistical analysis results."""
    study_id: Mapped[str] = mapped_column(String(36), ForeignKey("research_study.id"), nullable=False)
    dataset_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("research_dataset.id"), nullable=True)
    analysis_type: Mapped[str] = mapped_column(String(100), nullable=False)
    method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    parameters: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    results: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    p_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence_interval: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    effect_size: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sample_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    conclusion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    performed_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    performed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    visualization_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
