"""Surgery schedules are appointments of type surgery. Room status is stored."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models.appointment import Appointment
from app.models.operations import OperatingRoom
from app.models.patient import Patient
from app.security import generate_record_number, get_current_user_token

router = APIRouter(prefix="/surgery", tags=["Surgery"])


class RoomCreate(BaseModel):
    hospital_id: str
    name: str


@router.get("/or-schedule")
async def or_schedule(token_data=Depends(get_current_user_token), db: AsyncSession = Depends(get_db_session)):
    rooms = (await db.execute(select(OperatingRoom).where(OperatingRoom.is_deleted == False))).scalars().all()
    return [room.to_dict() for room in rooms]


@router.post("/or-schedule", status_code=201)
async def create_room(
    payload: RoomCreate,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session),
):
    room = OperatingRoom(hospital_id=payload.hospital_id, name=payload.name, status="available")
    db.add(room)
    await db.flush()
    return room.to_dict()


@router.get("/")
async def list_surgeries(token_data=Depends(get_current_user_token), db: AsyncSession = Depends(get_db_session)):
    rows = (await db.execute(
        select(Appointment).where(Appointment.appointment_type == "surgery", Appointment.is_deleted == False)
        .order_by(Appointment.scheduled_date.desc())
    )).scalars().all()
    surgeries = []
    for row in rows:
        item = row.to_dict()
        item["duration"] = row.duration_minutes
        item["scheduled_at"] = row.scheduled_date.isoformat() if row.scheduled_date else None
        surgeries.append(item)
    return {"surgeries": surgeries, "weekly_stats": [], "type_distribution": []}


@router.post("/", status_code=201)
async def schedule_surgery(
    patient_id: str,
    doctor_id: str,
    scheduled_date: datetime,
    reason: str = None,
    duration_minutes: int = 60,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session),
):
    patient = (await db.execute(select(Patient).where(Patient.id == patient_id))).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    appt = Appointment(
        patient_id=patient.id,
        health_id=patient.health_id,
        doctor_id=doctor_id,
        appointment_number=generate_record_number("SRG"),
        appointment_type="surgery",
        scheduled_date=scheduled_date,
        duration_minutes=duration_minutes,
        reason=reason,
    )
    db.add(appt)
    await db.flush()
    return {"id": appt.id, "appointment_number": appt.appointment_number}


@router.put("/{surgery_id}/status")
async def update_surgery_status(
    surgery_id: str,
    status: str,
    token_data=Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db_session),
):
    appt = (await db.execute(select(Appointment).where(Appointment.id == surgery_id))).scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Surgery not found")
    appt.status = status
    return {"id": appt.id, "status": appt.status}
