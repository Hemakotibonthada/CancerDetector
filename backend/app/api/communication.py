"""
Communication & Care Coordination API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.communication import (
    SecureMessage, CareTeam, CareTeamMember, Referral,
    ClinicalHandoff, ConsentForm, CareCoordinationTask, CommunicationPreference,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/communication", tags=["Communication"])

@router.get("/messages")
async def list_messages(folder: str = Query("inbox"), skip: int = 0, limit: int = 50,
                        user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    if folder == "inbox":
        q = select(SecureMessage).where(SecureMessage.recipient_id == user_id, SecureMessage.is_deleted == False)
    elif folder == "sent":
        q = select(SecureMessage).where(SecureMessage.sender_id == user_id, SecureMessage.is_deleted == False)
    else:
        q = select(SecureMessage).where(or_(SecureMessage.sender_id == user_id, SecureMessage.recipient_id == user_id), SecureMessage.is_deleted == False)
    result = await db.execute(q.order_by(desc(SecureMessage.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/messages")
async def send_message(recipient_id: str = Body(...), subject: str = Body(...), body: str = Body(...),
                       priority: str = Body("normal"), parent_message_id: str = Body(None),
                       user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    msg = SecureMessage(sender_id=user_id, recipient_id=recipient_id, subject=subject, body=body,
                        priority=priority, parent_message_id=parent_message_id, sent_at=datetime.now(timezone.utc))
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg.to_dict()

@router.put("/messages/{message_id}/read")
async def mark_message_read(message_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    msg = await db.get(SecureMessage, message_id)
    if not msg:
        raise HTTPException(404, "Message not found")
    msg.read_at = datetime.now(timezone.utc)
    msg.is_read = True
    await db.commit()
    return msg.to_dict()

@router.get("/messages/unread-count")
async def unread_message_count(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(func.count()).select_from(SecureMessage).where(
        SecureMessage.recipient_id == user_id, SecureMessage.is_read == False, SecureMessage.is_deleted == False))
    return {"unread_count": result.scalar() or 0}

@router.get("/care-teams")
async def list_care_teams(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(CareTeam).where(CareTeam.is_deleted == False)
    if patient_id:
        q = q.where(CareTeam.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/care-teams")
async def create_care_team(patient_id: str = Body(...), name: str = Body(...), description: str = Body(None),
                           user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    team = CareTeam(patient_id=patient_id, name=name, description=description, created_by=user_id)
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team.to_dict()

@router.post("/care-teams/{team_id}/members")
async def add_team_member(team_id: str, member_id: str = Body(...), role: str = Body(...),
                          db: AsyncSession = Depends(get_db_session)):
    member = CareTeamMember(care_team_id=team_id, member_id=member_id, role=role)
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member.to_dict()

@router.get("/referrals")
async def list_referrals(status: Optional[str] = None, skip: int = 0, limit: int = 50,
                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    q = select(Referral).where(Referral.is_deleted == False, or_(Referral.referring_provider_id == user_id, Referral.receiving_provider_id == user_id))
    if status:
        q = q.where(Referral.status == status)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/referrals")
async def create_referral(patient_id: str = Body(...), receiving_provider_id: str = Body(...), reason: str = Body(...),
                          urgency: str = Body("routine"), clinical_notes: str = Body(None),
                          user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    referral = Referral(patient_id=patient_id, referring_provider_id=user_id, receiving_provider_id=receiving_provider_id,
                        reason=reason, urgency=urgency, clinical_notes=clinical_notes, referred_at=datetime.now(timezone.utc))
    db.add(referral)
    await db.commit()
    await db.refresh(referral)
    return referral.to_dict()

@router.put("/referrals/{referral_id}/accept")
async def accept_referral(referral_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    referral = await db.get(Referral, referral_id)
    if not referral:
        raise HTTPException(404, "Referral not found")
    referral.status = "accepted"
    referral.accepted_at = datetime.now(timezone.utc)
    await db.commit()
    return referral.to_dict()

@router.get("/handoffs")
async def list_handoffs(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(ClinicalHandoff).where(
        or_(ClinicalHandoff.from_provider_id == user_id, ClinicalHandoff.to_provider_id == user_id),
        ClinicalHandoff.is_deleted == False).order_by(desc(ClinicalHandoff.created_at)))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/handoffs")
async def create_handoff(patient_id: str = Body(...), to_provider_id: str = Body(...), summary: str = Body(...),
                         active_issues: str = Body(None), pending_tasks: str = Body(None),
                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    handoff = ClinicalHandoff(patient_id=patient_id, from_provider_id=user_id, to_provider_id=to_provider_id,
                              summary=summary, active_issues=active_issues, pending_tasks=pending_tasks,
                              handoff_time=datetime.now(timezone.utc))
    db.add(handoff)
    await db.commit()
    await db.refresh(handoff)
    return handoff.to_dict()

@router.get("/consent-forms")
async def list_consent_forms(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(ConsentForm).where(ConsentForm.is_deleted == False)
    if patient_id:
        q = q.where(ConsentForm.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/consent-forms")
async def create_consent_form(patient_id: str = Body(...), form_type: str = Body(...), description: str = Body(None),
                               db: AsyncSession = Depends(get_db_session)):
    form = ConsentForm(patient_id=patient_id, form_type=form_type, description=description)
    db.add(form)
    await db.commit()
    await db.refresh(form)
    return form.to_dict()

@router.put("/consent-forms/{form_id}/sign")
async def sign_consent_form(form_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    form = await db.get(ConsentForm, form_id)
    if not form:
        raise HTTPException(404, "Consent form not found")
    form.signed = True
    form.signed_at = datetime.now(timezone.utc)
    form.signed_by = user_id
    await db.commit()
    return form.to_dict()

@router.get("/coordination-tasks")
async def list_coordination_tasks(status: Optional[str] = None, user_id: str = Depends(get_current_user_id),
                                   db: AsyncSession = Depends(get_db_session)):
    q = select(CareCoordinationTask).where(CareCoordinationTask.is_deleted == False, CareCoordinationTask.assigned_to == user_id)
    if status:
        q = q.where(CareCoordinationTask.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/coordination-tasks")
async def create_coordination_task(patient_id: str = Body(...), assigned_to: str = Body(...), title: str = Body(...),
                                    description: str = Body(None), priority: str = Body("normal"), due_date: str = Body(None),
                                    user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    task = CareCoordinationTask(patient_id=patient_id, assigned_to=assigned_to, title=title, description=description,
                                 priority=priority, due_date=due_date, created_by=user_id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task.to_dict()

@router.get("/preferences")
async def get_communication_preferences(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(CommunicationPreference).where(CommunicationPreference.user_id == user_id))
    pref = result.scalar_one_or_none()
    if not pref:
        pref = CommunicationPreference(user_id=user_id)
        db.add(pref)
        await db.commit()
        await db.refresh(pref)
    return pref.to_dict()

@router.put("/preferences")
async def update_communication_preferences(email_enabled: bool = Body(True), sms_enabled: bool = Body(False),
                                            push_enabled: bool = Body(True), preferred_language: str = Body("en"),
                                            user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(CommunicationPreference).where(CommunicationPreference.user_id == user_id))
    pref = result.scalar_one_or_none()
    if not pref:
        pref = CommunicationPreference(user_id=user_id)
        db.add(pref)
    pref.email_enabled = email_enabled
    pref.sms_enabled = sms_enabled
    pref.push_enabled = push_enabled
    pref.preferred_language = preferred_language
    await db.commit()
    await db.refresh(pref)
    return pref.to_dict()
