"""
Research & Clinical Studies API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.research import (
    ResearchStudy, ResearchCohort, CohortPatient, ResearchPublication,
    ResearchDataset, IRBSubmission, BiostatisticsAnalysis,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/research", tags=["Research"])

@router.get("/studies")
async def list_studies(status: Optional[str] = None, study_type: Optional[str] = None, skip: int = 0, limit: int = 50,
                       db: AsyncSession = Depends(get_db_session)):
    q = select(ResearchStudy).where(ResearchStudy.is_deleted == False)
    if status:
        q = q.where(ResearchStudy.status == status)
    if study_type:
        q = q.where(ResearchStudy.study_type == study_type)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/studies")
async def create_study(title: str = Body(...), study_type: str = Body(...), description: str = Body(None),
                       pi_name: str = Body(None), funding_source: str = Body(None),
                       user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    study = ResearchStudy(title=title, study_type=study_type, description=description, pi_name=pi_name,
                          funding_source=funding_source, created_by=user_id)
    db.add(study)
    await db.commit()
    await db.refresh(study)
    return study.to_dict()

@router.get("/studies/{study_id}")
async def get_study(study_id: str, db: AsyncSession = Depends(get_db_session)):
    study = await db.get(ResearchStudy, study_id)
    if not study or study.is_deleted:
        raise HTTPException(404, "Study not found")
    return study.to_dict()

@router.get("/cohorts")
async def list_cohorts(study_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(ResearchCohort).where(ResearchCohort.is_deleted == False)
    if study_id:
        q = q.where(ResearchCohort.study_id == study_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/cohorts")
async def create_cohort(study_id: str = Body(...), name: str = Body(...), criteria: str = Body(None),
                        db: AsyncSession = Depends(get_db_session)):
    cohort = ResearchCohort(study_id=study_id, name=name, inclusion_criteria=criteria)
    db.add(cohort)
    await db.commit()
    await db.refresh(cohort)
    return cohort.to_dict()

@router.post("/cohorts/{cohort_id}/patients")
async def add_patient_to_cohort(cohort_id: str, patient_id: str = Body(...), db: AsyncSession = Depends(get_db_session)):
    cp = CohortPatient(cohort_id=cohort_id, patient_id=patient_id, enrolled_at=datetime.now(timezone.utc))
    db.add(cp)
    await db.commit()
    await db.refresh(cp)
    return cp.to_dict()

@router.get("/publications")
async def list_publications(study_id: Optional[str] = None, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(ResearchPublication).where(ResearchPublication.is_deleted == False)
    if study_id:
        q = q.where(ResearchPublication.study_id == study_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/publications")
async def create_publication(title: str = Body(...), study_id: str = Body(None), journal: str = Body(None),
                             doi: str = Body(None), abstract: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    pub = ResearchPublication(title=title, study_id=study_id, journal=journal, doi=doi, abstract=abstract)
    db.add(pub)
    await db.commit()
    await db.refresh(pub)
    return pub.to_dict()

@router.get("/datasets")
async def list_datasets(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(ResearchDataset).where(ResearchDataset.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/datasets")
async def create_dataset(name: str = Body(...), study_id: str = Body(None), description: str = Body(None),
                         data_type: str = Body(None), record_count: int = Body(None),
                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    ds = ResearchDataset(name=name, study_id=study_id, description=description, data_type=data_type,
                         record_count=record_count, created_by=user_id)
    db.add(ds)
    await db.commit()
    await db.refresh(ds)
    return ds.to_dict()

@router.get("/irb-submissions")
async def list_irb_submissions(status: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(IRBSubmission).where(IRBSubmission.is_deleted == False)
    if status:
        q = q.where(IRBSubmission.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/irb-submissions")
async def create_irb_submission(study_id: str = Body(...), irb_number: str = Body(None), submission_type: str = Body("initial"),
                                 user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    irb = IRBSubmission(study_id=study_id, irb_number=irb_number, submission_type=submission_type, submitted_by=user_id,
                        submitted_at=datetime.now(timezone.utc))
    db.add(irb)
    await db.commit()
    await db.refresh(irb)
    return irb.to_dict()

@router.get("/biostatistics")
async def list_analyses(study_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(BiostatisticsAnalysis).where(BiostatisticsAnalysis.is_deleted == False)
    if study_id:
        q = q.where(BiostatisticsAnalysis.study_id == study_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/biostatistics")
async def create_analysis(study_id: str = Body(...), analysis_type: str = Body(...), methodology: str = Body(None),
                           results_summary: str = Body(None), user_id: str = Depends(get_current_user_id),
                           db: AsyncSession = Depends(get_db_session)):
    analysis = BiostatisticsAnalysis(study_id=study_id, analysis_type=analysis_type, methodology=methodology,
                                     results_summary=results_summary, performed_by=user_id)
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis.to_dict()

@router.get("/dashboard/stats")
async def research_stats(db: AsyncSession = Depends(get_db_session)):
    studies = await db.execute(select(func.count()).select_from(ResearchStudy).where(ResearchStudy.is_deleted == False))
    publications = await db.execute(select(func.count()).select_from(ResearchPublication).where(ResearchPublication.is_deleted == False))
    datasets = await db.execute(select(func.count()).select_from(ResearchDataset).where(ResearchDataset.is_deleted == False))
    return {"total_studies": studies.scalar() or 0, "total_publications": publications.scalar() or 0, "total_datasets": datasets.scalar() or 0}
