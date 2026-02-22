"""Appointments API"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.security import get_current_user_id, get_current_user_token, generate_record_number

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("/my")
async def get_my_appointments(
    status: str = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    query = select(Appointment).where(Appointment.patient_id == patient.id)
    if status:
        query = query.where(Appointment.status == status)
    query = query.order_by(Appointment.scheduled_date.desc()).limit(50)
    
    appt_result = await db.execute(query)
    appointments = appt_result.scalars().all()
    return [a.to_dict() for a in appointments]

@router.post("/", status_code=201)
async def create_appointment(
    patient_id: str, doctor_id: str, appointment_type: str,
    scheduled_date: datetime, duration_minutes: int = 30,
    reason: str = None, is_telemedicine: bool = False,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    appt = Appointment(
        patient_id=patient_id,
        health_id=patient.health_id,
        doctor_id=doctor_id,
        appointment_number=generate_record_number("APT"),
        appointment_type=appointment_type,
        scheduled_date=scheduled_date,
        duration_minutes=duration_minutes,
        reason=reason,
        is_telemedicine=is_telemedicine,
    )
    db.add(appt)
    await db.flush()
    return {"success": True, "appointment_id": appt.id, "appointment_number": appt.appointment_number}

@router.put("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str, new_status: str,
    cancellation_reason: str = None,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session)
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appt.status = new_status
    if new_status == "cancelled":
        appt.cancellation_reason = cancellation_reason
        appt.cancelled_at = datetime.now(timezone.utc)
    
    return {"success": True, "message": f"Appointment status updated to {new_status}"}
