"""
Clinical Trials v2 API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.clinical_trials_v2 import (
    TrialProtocol, TrialSite, TrialParticipant, TrialVisit,
    TrialAdverseEvent, ConcomitantMedication, DataCollectionForm, ProtocolDeviation,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/clinical-trials", tags=["Clinical Trials"])

@router.get("/protocols")
async def list_protocols(status: Optional[str] = None, phase: Optional[str] = None, skip: int = 0, limit: int = 50,
                          db: AsyncSession = Depends(get_db_session)):
    q = select(TrialProtocol).where(TrialProtocol.is_deleted == False)
    if status:
        q = q.where(TrialProtocol.status == status)
    if phase:
        q = q.where(TrialProtocol.phase == phase)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/protocols")
async def create_protocol(title: str = Body(...), protocol_number: str = Body(None), phase: str = Body(None),
                           sponsor: str = Body(None), description: str = Body(None), pi_name: str = Body(None),
                           target_enrollment: int = Body(None), user_id: str = Depends(get_current_user_id),
                           db: AsyncSession = Depends(get_db_session)):
    protocol = TrialProtocol(title=title, protocol_number=protocol_number, phase=phase, sponsor=sponsor,
                              description=description, pi_name=pi_name, target_enrollment=target_enrollment,
                              created_by=user_id, status="draft")
    db.add(protocol)
    await db.commit()
    await db.refresh(protocol)
    return protocol.to_dict()

@router.get("/protocols/{protocol_id}")
async def get_protocol(protocol_id: str, db: AsyncSession = Depends(get_db_session)):
    protocol = await db.get(TrialProtocol, protocol_id)
    if not protocol or protocol.is_deleted:
        raise HTTPException(404, "Protocol not found")
    return protocol.to_dict()

@router.get("/sites")
async def list_sites(protocol_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(TrialSite).where(TrialSite.is_deleted == False)
    if protocol_id:
        q = q.where(TrialSite.protocol_id == protocol_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/sites")
async def create_site(protocol_id: str = Body(...), site_name: str = Body(...), location: str = Body(None),
                      pi_name: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    site = TrialSite(protocol_id=protocol_id, site_name=site_name, location=location, pi_name=pi_name, status="active")
    db.add(site)
    await db.commit()
    await db.refresh(site)
    return site.to_dict()

@router.get("/participants")
async def list_participants(protocol_id: Optional[str] = None, site_id: Optional[str] = None,
                             status: Optional[str] = None, skip: int = 0, limit: int = 50,
                             db: AsyncSession = Depends(get_db_session)):
    q = select(TrialParticipant).where(TrialParticipant.is_deleted == False)
    if protocol_id:
        q = q.where(TrialParticipant.protocol_id == protocol_id)
    if site_id:
        q = q.where(TrialParticipant.site_id == site_id)
    if status:
        q = q.where(TrialParticipant.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/participants")
async def enroll_participant(protocol_id: str = Body(...), site_id: str = Body(...), patient_id: str = Body(...),
                              arm: str = Body(None), user_id: str = Depends(get_current_user_id),
                              db: AsyncSession = Depends(get_db_session)):
    participant = TrialParticipant(protocol_id=protocol_id, site_id=site_id, patient_id=patient_id,
                                    arm=arm, enrolled_by=user_id, enrolled_at=datetime.now(timezone.utc), status="enrolled")
    db.add(participant)
    await db.commit()
    await db.refresh(participant)
    return participant.to_dict()

@router.put("/participants/{participant_id}/withdraw")
async def withdraw_participant(participant_id: str, reason: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    participant = await db.get(TrialParticipant, participant_id)
    if not participant:
        raise HTTPException(404, "Participant not found")
    participant.status = "withdrawn"
    participant.withdrawal_reason = reason
    participant.withdrawn_at = datetime.now(timezone.utc)
    await db.commit()
    return participant.to_dict()

@router.get("/visits")
async def list_visits(participant_id: Optional[str] = None, protocol_id: Optional[str] = None,
                       skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(TrialVisit).where(TrialVisit.is_deleted == False)
    if participant_id:
        q = q.where(TrialVisit.participant_id == participant_id)
    if protocol_id:
        q = q.where(TrialVisit.protocol_id == protocol_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/visits")
async def create_visit(participant_id: str = Body(...), protocol_id: str = Body(...), visit_name: str = Body(...),
                        scheduled_date: str = Body(None), notes: str = Body(None),
                        user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    visit = TrialVisit(participant_id=participant_id, protocol_id=protocol_id, visit_name=visit_name,
                        scheduled_date=scheduled_date, notes=notes, status="scheduled")
    db.add(visit)
    await db.commit()
    await db.refresh(visit)
    return visit.to_dict()

@router.get("/adverse-events")
async def list_trial_adverse_events(protocol_id: Optional[str] = None, severity: Optional[str] = None,
                                      db: AsyncSession = Depends(get_db_session)):
    q = select(TrialAdverseEvent).where(TrialAdverseEvent.is_deleted == False)
    if protocol_id:
        q = q.where(TrialAdverseEvent.protocol_id == protocol_id)
    if severity:
        q = q.where(TrialAdverseEvent.severity == severity)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/adverse-events")
async def report_trial_adverse_event(participant_id: str = Body(...), protocol_id: str = Body(...),
                                       event_term: str = Body(...), severity: str = Body("moderate"),
                                       is_serious: bool = Body(False), causality: str = Body(None),
                                       description: str = Body(None), user_id: str = Depends(get_current_user_id),
                                       db: AsyncSession = Depends(get_db_session)):
    ae = TrialAdverseEvent(participant_id=participant_id, protocol_id=protocol_id, event_term=event_term,
                            severity=severity, is_serious=is_serious, causality=causality, description=description,
                            reported_by=user_id, reported_at=datetime.now(timezone.utc))
    db.add(ae)
    await db.commit()
    await db.refresh(ae)
    return ae.to_dict()

@router.get("/concomitant-medications")
async def list_concomitant_meds(participant_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(ConcomitantMedication).where(ConcomitantMedication.is_deleted == False)
    if participant_id:
        q = q.where(ConcomitantMedication.participant_id == participant_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/data-collection-forms")
async def list_dcfs(protocol_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(DataCollectionForm).where(DataCollectionForm.is_deleted == False)
    if protocol_id:
        q = q.where(DataCollectionForm.protocol_id == protocol_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/protocol-deviations")
async def list_deviations(protocol_id: Optional[str] = None, severity: Optional[str] = None,
                           db: AsyncSession = Depends(get_db_session)):
    q = select(ProtocolDeviation).where(ProtocolDeviation.is_deleted == False)
    if protocol_id:
        q = q.where(ProtocolDeviation.protocol_id == protocol_id)
    if severity:
        q = q.where(ProtocolDeviation.severity == severity)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/protocol-deviations")
async def report_deviation(protocol_id: str = Body(...), participant_id: str = Body(None),
                             deviation_type: str = Body(...), severity: str = Body("minor"),
                             description: str = Body(...), corrective_action: str = Body(None),
                             user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    deviation = ProtocolDeviation(protocol_id=protocol_id, participant_id=participant_id, deviation_type=deviation_type,
                                   severity=severity, description=description, corrective_action=corrective_action,
                                   reported_by=user_id, reported_at=datetime.now(timezone.utc))
    db.add(deviation)
    await db.commit()
    await db.refresh(deviation)
    return deviation.to_dict()

@router.get("/dashboard/stats")
async def clinical_trial_stats(db: AsyncSession = Depends(get_db_session)):
    protocols = await db.execute(select(func.count()).select_from(TrialProtocol).where(TrialProtocol.is_deleted == False))
    active = await db.execute(select(func.count()).select_from(TrialProtocol).where(TrialProtocol.status == "active"))
    participants = await db.execute(select(func.count()).select_from(TrialParticipant).where(TrialParticipant.status == "enrolled"))
    adverse = await db.execute(select(func.count()).select_from(TrialAdverseEvent).where(TrialAdverseEvent.is_serious == True))
    deviations = await db.execute(select(func.count()).select_from(ProtocolDeviation).where(ProtocolDeviation.is_deleted == False))
    return {"total_protocols": protocols.scalar() or 0, "active_trials": active.scalar() or 0,
            "enrolled_participants": participants.scalar() or 0, "serious_adverse_events": adverse.scalar() or 0,
            "protocol_deviations": deviations.scalar() or 0}
