"""
Telehealth & Remote Care API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.telehealth import (
    VideoSession, VirtualWaitingRoom, RemoteMonitoringPlan, RemoteMonitoringData,
    EPrescription, TelehealthChat, TelehealthConsent,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/telehealth", tags=["Telehealth"])

@router.get("/sessions")
async def list_video_sessions(status: Optional[str] = None, skip: int = 0, limit: int = 50,
                               user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    q = select(VideoSession).where(VideoSession.is_deleted == False)
    if status:
        q = q.where(VideoSession.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/sessions")
async def create_video_session(patient_id: str = Body(...), provider_id: str = Body(None), scheduled_at: str = Body(None),
                                session_type: str = Body("consultation"), user_id: str = Depends(get_current_user_id),
                                db: AsyncSession = Depends(get_db_session)):
    session = VideoSession(patient_id=patient_id, provider_id=provider_id or user_id, scheduled_at=scheduled_at,
                           session_type=session_type, status="scheduled", created_by=user_id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session.to_dict()

@router.put("/sessions/{session_id}/start")
async def start_session(session_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    session = await db.get(VideoSession, session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    session.status = "in_progress"
    session.started_at = datetime.now(timezone.utc)
    await db.commit()
    return session.to_dict()

@router.put("/sessions/{session_id}/end")
async def end_session(session_id: str, notes: str = Body(None), user_id: str = Depends(get_current_user_id),
                      db: AsyncSession = Depends(get_db_session)):
    session = await db.get(VideoSession, session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)
    session.notes = notes
    await db.commit()
    return session.to_dict()

@router.get("/waiting-room")
async def list_waiting_room(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(VirtualWaitingRoom).where(VirtualWaitingRoom.is_deleted == False, VirtualWaitingRoom.status == "waiting"))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/waiting-room/join")
async def join_waiting_room(session_id: str = Body(...), user_id: str = Depends(get_current_user_id),
                             db: AsyncSession = Depends(get_db_session)):
    entry = VirtualWaitingRoom(session_id=session_id, patient_id=user_id, joined_at=datetime.now(timezone.utc), status="waiting")
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry.to_dict()

@router.get("/monitoring-plans")
async def list_monitoring_plans(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(RemoteMonitoringPlan).where(RemoteMonitoringPlan.is_deleted == False)
    if patient_id:
        q = q.where(RemoteMonitoringPlan.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/monitoring-plans")
async def create_monitoring_plan(patient_id: str = Body(...), plan_name: str = Body(...), parameters: str = Body(None),
                                  frequency: str = Body(None), alert_thresholds: str = Body(None),
                                  user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    plan = RemoteMonitoringPlan(patient_id=patient_id, plan_name=plan_name, parameters=parameters,
                                frequency=frequency, alert_thresholds=alert_thresholds, created_by=user_id)
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan.to_dict()

@router.get("/monitoring-data")
async def list_monitoring_data(plan_id: Optional[str] = None, patient_id: Optional[str] = None,
                                skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db_session)):
    q = select(RemoteMonitoringData).where(RemoteMonitoringData.is_deleted == False)
    if plan_id:
        q = q.where(RemoteMonitoringData.plan_id == plan_id)
    if patient_id:
        q = q.where(RemoteMonitoringData.patient_id == patient_id)
    result = await db.execute(q.order_by(desc(RemoteMonitoringData.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/monitoring-data")
async def submit_monitoring_data(plan_id: str = Body(...), patient_id: str = Body(...), parameter: str = Body(...),
                                  value: str = Body(...), unit: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    data = RemoteMonitoringData(plan_id=plan_id, patient_id=patient_id, parameter=parameter, value=value, unit=unit,
                                 recorded_at=datetime.now(timezone.utc))
    db.add(data)
    await db.commit()
    await db.refresh(data)
    return data.to_dict()

@router.get("/e-prescriptions")
async def list_e_prescriptions(patient_id: Optional[str] = None, status: Optional[str] = None, skip: int = 0, limit: int = 50,
                                db: AsyncSession = Depends(get_db_session)):
    q = select(EPrescription).where(EPrescription.is_deleted == False)
    if patient_id:
        q = q.where(EPrescription.patient_id == patient_id)
    if status:
        q = q.where(EPrescription.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/e-prescriptions")
async def create_e_prescription(patient_id: str = Body(...), medication_name: str = Body(...), dosage: str = Body(...),
                                 frequency: str = Body(...), duration: str = Body(None), pharmacy_id: str = Body(None),
                                 notes: str = Body(None), user_id: str = Depends(get_current_user_id),
                                 db: AsyncSession = Depends(get_db_session)):
    rx = EPrescription(patient_id=patient_id, medication_name=medication_name, dosage=dosage, frequency=frequency,
                       duration=duration, pharmacy_id=pharmacy_id, notes=notes, prescribed_by=user_id,
                       prescribed_at=datetime.now(timezone.utc), status="active")
    db.add(rx)
    await db.commit()
    await db.refresh(rx)
    return rx.to_dict()

@router.get("/chat/{session_id}")
async def list_chat_messages(session_id: str, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(TelehealthChat).where(TelehealthChat.session_id == session_id, TelehealthChat.is_deleted == False)
                               .order_by(TelehealthChat.created_at).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/chat/{session_id}")
async def send_chat_message(session_id: str, message: str = Body(...), user_id: str = Depends(get_current_user_id),
                             db: AsyncSession = Depends(get_db_session)):
    chat = TelehealthChat(session_id=session_id, sender_id=user_id, message=message, sent_at=datetime.now(timezone.utc))
    db.add(chat)
    await db.commit()
    await db.refresh(chat)
    return chat.to_dict()

@router.get("/consents")
async def list_telehealth_consents(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(TelehealthConsent).where(TelehealthConsent.is_deleted == False)
    if patient_id:
        q = q.where(TelehealthConsent.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/consents")
async def create_telehealth_consent(patient_id: str = Body(...), consent_type: str = Body("telehealth"),
                                     db: AsyncSession = Depends(get_db_session)):
    consent = TelehealthConsent(patient_id=patient_id, consent_type=consent_type, consented_at=datetime.now(timezone.utc), consented=True)
    db.add(consent)
    await db.commit()
    await db.refresh(consent)
    return consent.to_dict()

@router.get("/dashboard/stats")
async def telehealth_stats(db: AsyncSession = Depends(get_db_session)):
    sessions = await db.execute(select(func.count()).select_from(VideoSession).where(VideoSession.is_deleted == False))
    active = await db.execute(select(func.count()).select_from(VideoSession).where(VideoSession.status == "in_progress"))
    monitoring = await db.execute(select(func.count()).select_from(RemoteMonitoringPlan).where(RemoteMonitoringPlan.is_deleted == False))
    prescriptions = await db.execute(select(func.count()).select_from(EPrescription).where(EPrescription.is_deleted == False))
    return {"total_sessions": sessions.scalar() or 0, "active_sessions": active.scalar() or 0,
            "monitoring_plans": monitoring.scalar() or 0, "e_prescriptions": prescriptions.scalar() or 0}
