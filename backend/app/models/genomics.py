"""
Genomics & Precision Medicine Models
=====================================
DNA sequencing, genetic variants, gene panels, pharmacogenomics,
liquid biopsy, tumor mutational burden, and gene expression profiling.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class VariantClassification(str, enum.Enum):
    PATHOGENIC = "pathogenic"
    LIKELY_PATHOGENIC = "likely_pathogenic"
    UNCERTAIN = "uncertain_significance"
    LIKELY_BENIGN = "likely_benign"
    BENIGN = "benign"


class SequencingMethod(str, enum.Enum):
    WGS = "whole_genome"
    WES = "whole_exome"
    TARGETED_PANEL = "targeted_panel"
    RNA_SEQ = "rna_sequencing"
    SINGLE_CELL = "single_cell"
    METHYLATION = "methylation"


class GenomicSequence(Base):
    """Genomic sequencing data for a patient."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    sample_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    sequencing_method: Mapped[str] = mapped_column(String(30), default=SequencingMethod.TARGETED_PANEL.value)
    platform: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    reference_genome: Mapped[str] = mapped_column(String(20), default="GRCh38")
    coverage_depth: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_variants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    lab_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    ordered_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    report_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="processing")


class GeneticVariant(Base):
    """Individual genetic variant found in sequencing."""
    sequence_id: Mapped[str] = mapped_column(String(36), ForeignKey("genomic_sequence.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    gene: Mapped[str] = mapped_column(String(50), nullable=False)
    chromosome: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    position: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reference_allele: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    alternate_allele: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    variant_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zygosity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    classification: Mapped[str] = mapped_column(String(30), default=VariantClassification.UNCERTAIN.value)
    allele_frequency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    clinical_significance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    associated_conditions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    dbsnp_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    cosmic_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    clinvar_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_actionable: Mapped[bool] = mapped_column(Boolean, default=False)
    is_somatic: Mapped[bool] = mapped_column(Boolean, default=False)
    vaf: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class GenePanel(Base):
    """Predefined gene panel for targeted testing."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    genes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    gene_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cancer_types: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    methodology: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    turnaround_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lab_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")


class GenomicReport(Base):
    """Comprehensive genomic analysis report."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    sequence_id: Mapped[str] = mapped_column(String(36), ForeignKey("genomic_sequence.id"), nullable=False)
    panel_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("gene_panel.id"), nullable=True)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pathogenic_variants: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    therapeutic_implications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    clinical_trials_matched: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    risk_assessments: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="draft")
    pdf_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)


class LiquidBiopsy(Base):
    """Circulating tumor DNA (ctDNA) monitoring."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    sample_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ctdna_fraction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_cfDNA: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    variants_detected: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    tmb_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    msi_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    interpretation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    trend: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    lab_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    ordered_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)


class GeneExpression(Base):
    """Gene expression profiling results."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    assay_type: Mapped[str] = mapped_column(String(100), nullable=False)
    cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expression_data: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    risk_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_category: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    recurrence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    chemotherapy_benefit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    molecular_subtype: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    report_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    interpretation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class PharmacogenomicProfile(Base):
    """Pharmacogenomic testing results."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    gene: Mapped[str] = mapped_column(String(50), nullable=False)
    diplotype: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    phenotype: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    metabolizer_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    affected_drugs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    dosing_recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    clinical_annotations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    cpic_guideline: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    evidence_level: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)


class HereditaryCancerPanel(Base):
    """Hereditary cancer risk panel results."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    panel_type: Mapped[str] = mapped_column(String(100), nullable=False)
    genes_tested: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    positive_findings: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    risk_scores: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    brca1_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    brca2_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    lynch_syndrome: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    overall_risk: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    genetic_counselor: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    counseling_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
