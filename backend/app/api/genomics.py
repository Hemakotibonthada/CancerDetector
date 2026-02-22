"""
Genomics & Precision Medicine API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.genomics import (
    GenomicSequence, GeneticVariant, GenePanel, GenomicReport,
    LiquidBiopsy, GeneExpression, PharmacogenomicProfile, HereditaryCancerPanel,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/genomics", tags=["Genomics"])

@router.get("/sequences")
async def list_sequences(patient_id: Optional[str] = None, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(GenomicSequence).where(GenomicSequence.is_deleted == False)
    if patient_id:
        q = q.where(GenomicSequence.patient_id == patient_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/sequences")
async def create_sequence(patient_id: str = Body(...), sequence_type: str = Body(...), sample_source: str = Body(None),
                          lab_name: str = Body(None), user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    seq = GenomicSequence(patient_id=patient_id, sequence_type=sequence_type, sample_source=sample_source, lab_name=lab_name, ordered_by=user_id)
    db.add(seq)
    await db.commit()
    await db.refresh(seq)
    return seq.to_dict()

@router.get("/variants")
async def list_variants(patient_id: Optional[str] = None, gene: Optional[str] = None, pathogenicity: Optional[str] = None,
                        skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(GeneticVariant).where(GeneticVariant.is_deleted == False)
    if patient_id:
        q = q.where(GeneticVariant.patient_id == patient_id)
    if gene:
        q = q.where(GeneticVariant.gene_name == gene)
    if pathogenicity:
        q = q.where(GeneticVariant.pathogenicity == pathogenicity)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/variants")
async def create_variant(patient_id: str = Body(...), gene_name: str = Body(...), chromosome: str = Body(None),
                         position: str = Body(None), ref_allele: str = Body(None), alt_allele: str = Body(None),
                         variant_type: str = Body(None), pathogenicity: str = Body(None), clinical_significance: str = Body(None),
                         db: AsyncSession = Depends(get_db_session)):
    variant = GeneticVariant(patient_id=patient_id, gene_name=gene_name, chromosome=chromosome, position=position,
                              ref_allele=ref_allele, alt_allele=alt_allele, variant_type=variant_type,
                              pathogenicity=pathogenicity, clinical_significance=clinical_significance)
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    return variant.to_dict()

@router.get("/panels")
async def list_gene_panels(panel_type: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(GenePanel).where(GenePanel.is_deleted == False)
    if panel_type:
        q = q.where(GenePanel.panel_type == panel_type)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/panels")
async def create_gene_panel(name: str = Body(...), panel_type: str = Body(...), genes: str = Body(None),
                            description: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    panel = GenePanel(name=name, panel_type=panel_type, genes=genes, description=description)
    db.add(panel)
    await db.commit()
    await db.refresh(panel)
    return panel.to_dict()

@router.get("/reports")
async def list_genomic_reports(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(GenomicReport).where(GenomicReport.is_deleted == False)
    if patient_id:
        q = q.where(GenomicReport.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/reports")
async def create_genomic_report(patient_id: str = Body(...), report_type: str = Body(...), summary: str = Body(None),
                                actionable_findings: str = Body(None), user_id: str = Depends(get_current_user_id),
                                db: AsyncSession = Depends(get_db_session)):
    report = GenomicReport(patient_id=patient_id, report_type=report_type, summary=summary,
                           actionable_findings=actionable_findings, generated_by=user_id)
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report.to_dict()

@router.get("/liquid-biopsies")
async def list_liquid_biopsies(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(LiquidBiopsy).where(LiquidBiopsy.is_deleted == False)
    if patient_id:
        q = q.where(LiquidBiopsy.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/liquid-biopsies")
async def create_liquid_biopsy(patient_id: str = Body(...), sample_type: str = Body("cfDNA"),
                                ctdna_fraction: float = Body(None), mutations_detected: str = Body(None),
                                user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    biopsy = LiquidBiopsy(patient_id=patient_id, sample_type=sample_type, ctdna_fraction=ctdna_fraction,
                          mutations_detected=mutations_detected, ordered_by=user_id)
    db.add(biopsy)
    await db.commit()
    await db.refresh(biopsy)
    return biopsy.to_dict()

@router.get("/gene-expression/{patient_id}")
async def get_gene_expression(patient_id: str, db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(GeneExpression).where(GeneExpression.patient_id == patient_id, GeneExpression.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/pharmacogenomics/{patient_id}")
async def get_pharmacogenomic_profile(patient_id: str, db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(PharmacogenomicProfile).where(PharmacogenomicProfile.patient_id == patient_id, PharmacogenomicProfile.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/pharmacogenomics")
async def create_pharmacogenomic_profile(patient_id: str = Body(...), gene: str = Body(...), phenotype: str = Body(None),
                                          metabolizer_status: str = Body(None), affected_drugs: str = Body(None),
                                          recommendations: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    profile = PharmacogenomicProfile(patient_id=patient_id, gene=gene, phenotype=phenotype,
                                     metabolizer_status=metabolizer_status, affected_drugs=affected_drugs,
                                     recommendations=recommendations)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile.to_dict()

@router.get("/hereditary-panels")
async def list_hereditary_panels(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(HereditaryCancerPanel).where(HereditaryCancerPanel.is_deleted == False)
    if patient_id:
        q = q.where(HereditaryCancerPanel.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/dashboard/stats")
async def genomics_stats(db: AsyncSession = Depends(get_db_session)):
    sequences = await db.execute(select(func.count()).select_from(GenomicSequence).where(GenomicSequence.is_deleted == False))
    variants = await db.execute(select(func.count()).select_from(GeneticVariant).where(GeneticVariant.is_deleted == False))
    biopsies = await db.execute(select(func.count()).select_from(LiquidBiopsy).where(LiquidBiopsy.is_deleted == False))
    return {"total_sequences": sequences.scalar() or 0, "total_variants": variants.scalar() or 0, "total_liquid_biopsies": biopsies.scalar() or 0}
