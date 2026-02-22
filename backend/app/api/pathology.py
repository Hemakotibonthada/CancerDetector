"""
Pathology & Lab Management API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.pathology import (
    Specimen, PathologyBlock, PathologySlide, StainingProtocol,
    PathologyReport, TumorBoard, CytologyResult,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/pathology", tags=["Pathology"])

@router.get("/specimens")
async def list_specimens(patient_id: Optional[str] = None, status: Optional[str] = None, skip: int = 0, limit: int = 50,
                          db: AsyncSession = Depends(get_db_session)):
    q = select(Specimen).where(Specimen.is_deleted == False)
    if patient_id:
        q = q.where(Specimen.patient_id == patient_id)
    if status:
        q = q.where(Specimen.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/specimens")
async def create_specimen(patient_id: str = Body(...), specimen_type: str = Body(...), collection_site: str = Body(None),
                           collection_method: str = Body(None), user_id: str = Depends(get_current_user_id),
                           db: AsyncSession = Depends(get_db_session)):
    specimen = Specimen(patient_id=patient_id, specimen_type=specimen_type, collection_site=collection_site,
                        collection_method=collection_method, collected_by=user_id, collected_at=datetime.now(timezone.utc), status="received")
    db.add(specimen)
    await db.commit()
    await db.refresh(specimen)
    return specimen.to_dict()

@router.get("/blocks")
async def list_blocks(specimen_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(PathologyBlock).where(PathologyBlock.is_deleted == False)
    if specimen_id:
        q = q.where(PathologyBlock.specimen_id == specimen_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/blocks")
async def create_block(specimen_id: str = Body(...), block_id_label: str = Body(None), tissue_type: str = Body(None),
                        db: AsyncSession = Depends(get_db_session)):
    block = PathologyBlock(specimen_id=specimen_id, block_id_label=block_id_label, tissue_type=tissue_type)
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return block.to_dict()

@router.get("/slides")
async def list_slides(block_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(PathologySlide).where(PathologySlide.is_deleted == False)
    if block_id:
        q = q.where(PathologySlide.block_id == block_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/slides")
async def create_slide(block_id: str = Body(...), stain_type: str = Body("H&E"), slide_label: str = Body(None),
                        db: AsyncSession = Depends(get_db_session)):
    slide = PathologySlide(block_id=block_id, stain_type=stain_type, slide_label=slide_label, status="prepared")
    db.add(slide)
    await db.commit()
    await db.refresh(slide)
    return slide.to_dict()

@router.get("/staining-protocols")
async def list_staining_protocols(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(StainingProtocol).where(StainingProtocol.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/staining-protocols")
async def create_staining_protocol(name: str = Body(...), stain_type: str = Body(...), steps: str = Body(None),
                                     duration_minutes: int = Body(None), db: AsyncSession = Depends(get_db_session)):
    protocol = StainingProtocol(name=name, stain_type=stain_type, steps=steps, duration_minutes=duration_minutes)
    db.add(protocol)
    await db.commit()
    await db.refresh(protocol)
    return protocol.to_dict()

@router.get("/reports")
async def list_pathology_reports(patient_id: Optional[str] = None, status: Optional[str] = None,
                                  db: AsyncSession = Depends(get_db_session)):
    q = select(PathologyReport).where(PathologyReport.is_deleted == False)
    if patient_id:
        q = q.where(PathologyReport.patient_id == patient_id)
    if status:
        q = q.where(PathologyReport.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/reports")
async def create_pathology_report(patient_id: str = Body(...), specimen_id: str = Body(...), diagnosis: str = Body(None),
                                   microscopic_findings: str = Body(None), gross_description: str = Body(None),
                                   tnm_stage: str = Body(None), grade: str = Body(None), margins: str = Body(None),
                                   user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    report = PathologyReport(patient_id=patient_id, specimen_id=specimen_id, diagnosis=diagnosis,
                              microscopic_findings=microscopic_findings, gross_description=gross_description,
                              tnm_stage=tnm_stage, grade=grade, margins=margins, pathologist_id=user_id, status="draft")
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report.to_dict()

@router.put("/reports/{report_id}/finalize")
async def finalize_report(report_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    report = await db.get(PathologyReport, report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    report.status = "finalized"
    report.finalized_at = datetime.now(timezone.utc)
    await db.commit()
    return report.to_dict()

@router.get("/tumor-boards")
async def list_tumor_boards(status: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(TumorBoard).where(TumorBoard.is_deleted == False)
    if status:
        q = q.where(TumorBoard.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/tumor-boards")
async def create_tumor_board(patient_id: str = Body(...), scheduled_date: str = Body(None), agenda: str = Body(None),
                              attendees: str = Body(None), user_id: str = Depends(get_current_user_id),
                              db: AsyncSession = Depends(get_db_session)):
    board = TumorBoard(patient_id=patient_id, scheduled_date=scheduled_date, agenda=agenda, attendees=attendees,
                       created_by=user_id, status="scheduled")
    db.add(board)
    await db.commit()
    await db.refresh(board)
    return board.to_dict()

@router.post("/tumor-boards/{board_id}/conclude")
async def conclude_tumor_board(board_id: str, recommendations: str = Body(None), decision: str = Body(None),
                                db: AsyncSession = Depends(get_db_session)):
    board = await db.get(TumorBoard, board_id)
    if not board:
        raise HTTPException(404, "Tumor board not found")
    board.status = "completed"
    board.recommendations = recommendations
    board.decision = decision
    board.completed_at = datetime.now(timezone.utc)
    await db.commit()
    return board.to_dict()

@router.get("/cytology")
async def list_cytology_results(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(CytologyResult).where(CytologyResult.is_deleted == False)
    if patient_id:
        q = q.where(CytologyResult.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/dashboard/stats")
async def pathology_stats(db: AsyncSession = Depends(get_db_session)):
    specimens = await db.execute(select(func.count()).select_from(Specimen).where(Specimen.is_deleted == False))
    reports = await db.execute(select(func.count()).select_from(PathologyReport).where(PathologyReport.is_deleted == False))
    pending = await db.execute(select(func.count()).select_from(PathologyReport).where(PathologyReport.status == "draft"))
    boards = await db.execute(select(func.count()).select_from(TumorBoard).where(TumorBoard.status == "scheduled"))
    return {"total_specimens": specimens.scalar() or 0, "total_reports": reports.scalar() or 0,
            "pending_reports": pending.scalar() or 0, "scheduled_tumor_boards": boards.scalar() or 0}
