"""Surgery schedules are appointments of type surgery. Room status is stored."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models.appointment import Appointment
from app.models.hospital import Doctor
from app.models.operations import OperatingRoom
from app.models.patient import Patient
from app.models.user import User
from app.schemas.dates import parse_optional_datetime
from app.security import generate_record_number, require_clinical_write

router = APIRouter(prefix="/surgery", tags=["Surgery"])


class RoomCreate(BaseModel):
    hospital_id: str
    name: str


class SurgeryCreate(BaseModel):
    patient_id: Optional[str] = None
    health_id: Optional[str] = None
    doctor_id: str
    scheduled_date: str
    reason: Optional[str] = None
    procedure: Optional[str] = None
    duration_minutes: Optional[int] = None
    duration_hours: Optional[float] = None
    priority: Optional[str] = None
    anesthesia: Optional[str] = None
    operating_room: Optional[str] = None


_ROOM_LABELS = {
    "available": "Available",
    "in_use": "In Use",
    "preparing": "Preparing",
    "cleaning": "Cleaning",
    "maintenance": "Maintenance",
}


def _room_view(room: OperatingRoom) -> dict:
    item = room.to_dict()
    item["room"] = room.name
    item["status"] = _ROOM_LABELS.get((room.status or "").lower(), room.status)
    item["patient"] = room.current_procedure or "-"
    item["surgeon"] = None
    item["start"] = None
    item["estimated_end"] = None
    return item


@router.get("/or-schedule")
async def or_schedule(token_data=Depends(require_clinical_write), db: AsyncSession = Depends(get_db_session)):
    rooms = (await db.execute(select(OperatingRoom).where(OperatingRoom.is_deleted == False))).scalars().all()
    return [_room_view(room) for room in rooms]


@router.post("/or-schedule", status_code=201)
async def create_room(
    payload: RoomCreate,
    token_data=Depends(require_clinical_write),
    db: AsyncSession = Depends(get_db_session),
):
    room = OperatingRoom(hospital_id=payload.hospital_id, name=payload.name, status="available")
    db.add(room)
    await db.flush()
    return room.to_dict()


@router.get("/")
async def list_surgeries(token_data=Depends(require_clinical_write), db: AsyncSession = Depends(get_db_session)):
    rows = (await db.execute(
        select(Appointment).where(Appointment.appointment_type == "surgery", Appointment.is_deleted == False)
        .order_by(Appointment.scheduled_date.desc())
    )).scalars().all()
    surgeries = []
    for row in rows:
        patient = (await db.execute(select(Patient).where(Patient.id == row.patient_id))).scalar_one_or_none()
        person = None
        if patient:
            person = (await db.execute(select(User).where(User.id == patient.user_id))).scalar_one_or_none()
        doctor = (await db.execute(select(Doctor).where(Doctor.id == row.doctor_id))).scalar_one_or_none()
        surgeon = None
        if doctor:
            surgeon_user = (await db.execute(select(User).where(User.id == doctor.user_id))).scalar_one_or_none()
            if surgeon_user:
                surgeon = f"Dr. {surgeon_user.first_name} {surgeon_user.last_name}".strip()
        when = row.scheduled_date
        surgeries.append({
            "id": row.appointment_number,
            "record_id": row.id,
            "patient": f"{person.first_name} {person.last_name}".strip() if person else None,
            "type": row.reason,
            "surgeon": surgeon,
            "or": row.symptoms,
            "date": when.strftime("%Y-%m-%d %H:%M") if when else "",
            "scheduled_at": when.isoformat() if when else None,
            "duration": row.duration_minutes,
            "priority": row.priority,
            "status": row.status or "scheduled",
        })
    return {"surgeries": surgeries, "weekly_stats": [], "type_distribution": []}


@router.post("/", status_code=201)
async def schedule_surgery(
    payload: SurgeryCreate,
    token_data=Depends(require_clinical_write),
    db: AsyncSession = Depends(get_db_session),
):
    patient = None
    if payload.patient_id:
        patient = (await db.execute(select(Patient).where(Patient.id == payload.patient_id))).scalar_one_or_none()
    elif payload.health_id:
        patient = (await db.execute(select(Patient).where(Patient.health_id == payload.health_id.strip()))).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    doctor = (await db.execute(select(Doctor).where(Doctor.id == payload.doctor_id))).scalar_one_or_none()
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    try:
        scheduled = parse_optional_datetime(payload.scheduled_date, naive=False)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="scheduled_date must be a date or datetime") from exc
    if scheduled is None:
        raise HTTPException(status_code=400, detail="scheduled_date is required")
    minutes = payload.duration_minutes
    if minutes is None and payload.duration_hours is not None:
        minutes = int(payload.duration_hours * 60)
    procedure = payload.procedure or payload.reason
    appt = Appointment(
        patient_id=patient.id,
        health_id=patient.health_id,
        doctor_id=doctor.id,
        hospital_id=doctor.hospital_id,
        appointment_number=generate_record_number("SRG"),
        appointment_type="surgery",
        scheduled_date=scheduled,
        duration_minutes=minutes or 60,
        reason=procedure,
        priority=payload.priority,
        notes=payload.anesthesia,
        symptoms=payload.operating_room,
        status="scheduled",
    )
    db.add(appt)
    if payload.operating_room:
        room = (await db.execute(
            select(OperatingRoom).where(OperatingRoom.name == payload.operating_room, OperatingRoom.is_deleted == False)
        )).scalars().first()
        if room:
            person = (await db.execute(select(User).where(User.id == patient.user_id))).scalar_one_or_none()
            label = f"{person.first_name} {person.last_name}".strip() if person else patient.health_id
            room.status = "in_use"
            room.current_procedure = f"{label} — {procedure or 'Surgery'}"
    await db.flush()
    return {"id": appt.id, "appointment_number": appt.appointment_number}


@router.put("/{surgery_id}/status")
async def update_surgery_status(
    surgery_id: str,
    status: str,
    token_data=Depends(require_clinical_write),
    db: AsyncSession = Depends(get_db_session),
):
    appt = (await db.execute(select(Appointment).where(Appointment.id == surgery_id))).scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Surgery not found")
    appt.status = status
    return {"id": appt.id, "status": appt.status}
