"""Write paths for admin and hospital dialogs that previously closed without saving."""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import inspect, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models.clinical_trials_v2 import TrialProtocol
from app.models.education import TrainingModule
from app.models.emergency import TriageAssessment
from app.models.hospital import Doctor, Hospital
from app.models.lab_result import LabOrder
from app.models.medical_image import MedicalImage
from app.models.operations import (
    DatabaseExportLog,
    HospitalBed,
    IntegrationConnection,
    PlatformInvoice,
)
from app.models.patient import Patient
from app.models.telehealth import VideoSession
from app.models.user import User
from app.schemas.dates import parse_optional_datetime
from app.security import (
    generate_record_number,
    require_any_admin,
    require_billing_access,
    require_clinical_write,
    require_super_admin,
)

training_router = APIRouter(prefix="/training", tags=["Training"])
data_router = APIRouter(prefix="/data", tags=["Data management"])
integrations_router = APIRouter(prefix="/integrations", tags=["Integrations"])
lab_router = APIRouter(prefix="/lab", tags=["Lab orders"])
telemedicine_router = APIRouter(prefix="/telemedicine", tags=["Telemedicine"])
radiology_orders_router = APIRouter(prefix="/radiology", tags=["Radiology orders"])
emergency_cases_router = APIRouter(prefix="/emergency", tags=["Emergency cases"])
trials_router = APIRouter(prefix="/clinical-trials", tags=["Clinical trials"])
admissions_router = APIRouter(prefix="/hospitals", tags=["Admissions"])
hospital_invoice_router = APIRouter(prefix="/billing", tags=["Hospital invoices"])

_TRIAGE = {
    "immediate": "1_resuscitation",
    "emergency": "2_emergent",
    "urgent": "3_urgent",
    "semi-urgent": "4_less_urgent",
    "non-urgent": "5_non_urgent",
}
_TRIAGE_LABEL = {value: key.title().replace("Semi-Urgent", "Semi-Urgent") for key, value in {
    "Immediate": "1_resuscitation",
    "Emergency": "2_emergent",
    "Urgent": "3_urgent",
    "Semi-Urgent": "4_less_urgent",
    "Non-Urgent": "5_non_urgent",
}.items()}
_PHASE = {
    "phase i": "phase_i",
    "phase ii": "phase_ii",
    "phase iii": "phase_iii",
    "phase iv": "phase_iv",
}
_PHASE_LABEL = {
    "phase_i": "Phase I",
    "phase_ii": "Phase II",
    "phase_iii": "Phase III",
    "phase_iv": "Phase IV",
}
_IMAGE_TYPE = {
    "ct": "ct_scan",
    "mri": "mri",
    "xray": "xray",
    "ultrasound": "ultrasound",
    "pet": "pet_scan",
    "mammography": "mammogram",
}
_LEVEL = {
    "beginner": "Beginner",
    "intermediate": "Intermediate",
    "advanced": "Advanced",
    "expert": "Expert",
    "all": "All Levels",
}
_SYNC = {
    "realtime": "Real-time",
    "5": "Every 5 minutes",
    "15": "Every 15 minutes",
    "30": "Every 30 minutes",
    "60": "Every hour",
}


def _aware(value: Any) -> Optional[datetime]:
    if value is None or value == "":
        return None
    try:
        return parse_optional_datetime(value, naive=False)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


async def _patient(db: AsyncSession, health_id: Optional[str] = None, patient_id: Optional[str] = None) -> Patient:
    patient = None
    if patient_id:
        patient = (await db.execute(select(Patient).where(Patient.id == patient_id))).scalar_one_or_none()
    elif health_id:
        patient = (await db.execute(select(Patient).where(Patient.health_id == health_id.strip()))).scalar_one_or_none()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


async def _patient_name(db: AsyncSession, patient: Patient) -> str:
    user = (await db.execute(select(User).where(User.id == patient.user_id))).scalar_one_or_none()
    if user is None:
        return patient.health_id
    return f"{user.first_name} {user.last_name}".strip()


async def _hospital(db: AsyncSession) -> Hospital:
    hospital = (await db.execute(
        select(Hospital).where(Hospital.is_deleted == False).order_by(Hospital.created_at.asc())
    )).scalars().first()
    if hospital is None:
        raise HTTPException(status_code=400, detail="Record a hospital first")
    return hospital


async def _doctor(db: AsyncSession, doctor_id: str) -> Doctor:
    doctor = (await db.execute(select(Doctor).where(Doctor.id == doctor_id))).scalar_one_or_none()
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


class CourseCreate(BaseModel):
    title: str
    category: str
    level: Optional[str] = None
    instructor: Optional[str] = None
    duration_hours: Optional[float] = None
    module_count: Optional[int] = None
    description: Optional[str] = None


def _course_view(row: TrainingModule) -> dict:
    objectives = row.objectives if isinstance(row.objectives, dict) else {}
    level = _LEVEL.get((row.department or "").lower(), row.department or "All Levels")
    hours = (row.duration_minutes or 0) / 60
    return {
        "id": row.id,
        "title": row.title,
        "category": row.category,
        "level": level,
        "instructor": row.accreditation_body,
        "duration": f"{hours:g} h" if hours else "—",
        "modules": objectives.get("module_count") or 0,
        "rating": None,
        "enrolled": 0,
        "completed": 0,
        "mandatory": row.mandatory,
        "description": row.description,
    }


@training_router.get("/courses")
async def list_courses(token_data=Depends(require_any_admin), db: AsyncSession = Depends(get_db_session)):
    rows = (await db.execute(
        select(TrainingModule).where(TrainingModule.is_deleted == False).order_by(TrainingModule.created_at.desc())
    )).scalars().all()
    return [_course_view(row) for row in rows]


@training_router.post("/courses", status_code=201)
async def create_course(
    payload: CourseCreate,
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session),
):
    minutes = int((payload.duration_hours or 0) * 60)
    row = TrainingModule(
        title=payload.title,
        category=payload.category,
        description=payload.description,
        department=(payload.level or "all").lower(),
        accreditation_body=payload.instructor,
        duration_minutes=minutes or 30,
        objectives={"module_count": payload.module_count or 0},
        published=True,
    )
    db.add(row)
    await db.flush()
    return _course_view(row)


@training_router.get("/certifications")
async def list_certifications(token_data=Depends(require_any_admin)):
    return []


class IntegrationCreate(BaseModel):
    name: str
    type: str
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    sync_frequency: Optional[str] = "15"
    enabled: bool = True


def _integration_view(row: IntegrationConnection) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "type": row.integration_type,
        "status": row.status,
        "syncFreq": _SYNC.get(row.sync_frequency or "", row.sync_frequency),
        "records": row.records_synced or 0,
        "apiKey": "stored" if row.api_key_hash else "none",
        "enabled": row.enabled,
        "endpoint_url": row.endpoint_url,
    }


@integrations_router.get("")
async def list_integrations(token_data=Depends(require_any_admin), db: AsyncSession = Depends(get_db_session)):
    rows = (await db.execute(
        select(IntegrationConnection).where(IntegrationConnection.is_deleted == False)
        .order_by(IntegrationConnection.created_at.desc())
    )).scalars().all()
    return [_integration_view(row) for row in rows]


@integrations_router.post("", status_code=201)
async def create_integration(
    payload: IntegrationCreate,
    token_data=Depends(require_any_admin),
    db: AsyncSession = Depends(get_db_session),
):
    key_hash = None
    if payload.api_key:
        key_hash = hashlib.sha256(payload.api_key.encode("utf-8")).hexdigest()
    row = IntegrationConnection(
        name=payload.name,
        integration_type=payload.type,
        endpoint_url=payload.endpoint_url,
        api_key_hash=key_hash,
        sync_frequency=payload.sync_frequency,
        enabled=payload.enabled,
        status="configured",
        records_synced=0,
        created_by=token_data.get("sub"),
    )
    db.add(row)
    await db.flush()
    body = _integration_view(row)
    body["api_key"] = None
    return body


def _sensitive(column: str) -> bool:
    lowered = column.lower()
    return any(part in lowered for part in ("password", "secret", "api_key", "token"))


def _safe_identifier(name: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name))


async def _export_payload(db: AsyncSession) -> tuple[dict, int, int]:
    def _read(sync_session) -> tuple[dict, int, int]:
        connection = sync_session.connection()
        inspector = inspect(connection)
        tables: dict[str, list] = {}
        row_count = 0
        for table in inspector.get_table_names():
            if table.startswith("sqlite_") or not _safe_identifier(table):
                continue
            columns = []
            for column in inspector.get_columns(table):
                name = column["name"]
                if _safe_identifier(name) and not _sensitive(name):
                    columns.append(name)
            if not columns:
                tables[table] = []
                continue
            quoted_cols = ", ".join(f'"{name}"' for name in columns)
            result = connection.execute(text(f'SELECT {quoted_cols} FROM "{table}"'))
            dumped = []
            for mapping in result.mappings():
                dumped.append({key: value for key, value in dict(mapping).items()})
            tables[table] = dumped
            row_count += len(dumped)
        return tables, len(tables), row_count

    tables, table_count, row_count = await db.run_sync(_read)
    payload = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "note": "Credential columns are omitted. This file is not stored on the server.",
        "tables": tables,
    }
    return payload, table_count, row_count


def _backup_view(row: DatabaseExportLog) -> dict:
    return {
        "id": row.id,
        "type": "JSON export",
        "size": f"{row.byte_size} bytes",
        "started": row.created_at.isoformat() if row.created_at else None,
        "completed": row.completed_at.isoformat() if row.completed_at else None,
        "location": "downloaded by super admin",
        "retention": "not retained on server",
        "status": row.status,
    }


@data_router.get("/backups")
async def list_backups(token_data=Depends(require_any_admin), db: AsyncSession = Depends(get_db_session)):
    rows = (await db.execute(
        select(DatabaseExportLog).where(DatabaseExportLog.is_deleted == False)
        .order_by(DatabaseExportLog.created_at.desc())
    )).scalars().all()
    return [_backup_view(row) for row in rows]


@data_router.post("/backups")
async def download_export(token_data=Depends(require_super_admin), db: AsyncSession = Depends(get_db_session)):
    payload, table_count, row_count = await _export_payload(db)
    body = json.dumps(payload, default=str).encode("utf-8")
    log = DatabaseExportLog(
        requested_by=token_data.get("sub"),
        export_type="json",
        byte_size=len(body),
        table_count=table_count,
        row_count=row_count,
        status="completed",
        completed_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.flush()
    return Response(
        content=body,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="cancerguard-export.json"'},
    )


@data_router.get("/storage")
async def storage_stats(token_data=Depends(require_any_admin)):
    return {
        "measured": False,
        "breakdown": [],
        "trend": [],
        "note": "Database capacity is not measured inside the application.",
    }


@data_router.get("/retention-policies")
async def retention_policies(token_data=Depends(require_any_admin)):
    return []


class LabOrderCreate(BaseModel):
    health_id: str
    doctor_id: str
    test_type: str
    priority: str = "routine"
    notes: Optional[str] = None


def _lab_view(order: LabOrder, patient_name: str, doctor_name: str) -> dict:
    return {
        "id": order.order_number,
        "record_id": order.id,
        "patient": patient_name,
        "patient_name": patient_name,
        "patient_id": order.patient_id,
        "doctor": doctor_name,
        "ordering_doctor": doctor_name,
        "type": order.tests_ordered,
        "test_type": order.tests_ordered,
        "priority": order.priority,
        "status": order.status,
        "collected": order.order_date.isoformat() if order.order_date else None,
        "result": "Pending",
        "notes": order.notes,
    }


@lab_router.get("/orders")
async def list_lab_orders(token_data=Depends(require_clinical_write), db: AsyncSession = Depends(get_db_session)):
    orders = (await db.execute(
        select(LabOrder).where(LabOrder.is_deleted == False).order_by(LabOrder.order_date.desc())
    )).scalars().all()
    payload = []
    for order in orders:
        patient = (await db.execute(select(Patient).where(Patient.id == order.patient_id))).scalar_one_or_none()
        doctor = (await db.execute(select(Doctor).where(Doctor.id == order.doctor_id))).scalar_one_or_none()
        doctor_user = None
        if doctor:
            doctor_user = (await db.execute(select(User).where(User.id == doctor.user_id))).scalar_one_or_none()
        doctor_name = f"Dr. {doctor_user.first_name} {doctor_user.last_name}".strip() if doctor_user else "—"
        patient_name = await _patient_name(db, patient) if patient else "—"
        payload.append(_lab_view(order, patient_name, doctor_name))
    return payload


@lab_router.post("/orders", status_code=201)
async def create_lab_order(
    payload: LabOrderCreate,
    token_data=Depends(require_clinical_write),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await _patient(db, health_id=payload.health_id)
    doctor = await _doctor(db, payload.doctor_id)
    doctor_user = (await db.execute(select(User).where(User.id == doctor.user_id))).scalar_one_or_none()
    order = LabOrder(
        patient_id=patient.id,
        doctor_id=doctor.id,
        hospital_id=doctor.hospital_id,
        order_number=generate_record_number("LAB"),
        order_date=datetime.now(timezone.utc),
        status="ordered",
        priority=payload.priority,
        tests_ordered=payload.test_type,
        notes=payload.notes,
    )
    db.add(order)
    await db.flush()
    doctor_name = f"Dr. {doctor_user.first_name} {doctor_user.last_name}".strip() if doctor_user else "—"
    return _lab_view(order, await _patient_name(db, patient), doctor_name)


class StudyOrder(BaseModel):
    health_id: str
    modality: str
    body_part: Optional[str] = None
    priority: str = "routine"
    clinical_indication: Optional[str] = None


def _study_view(image: MedicalImage, patient_name: str) -> dict:
    return {
        "id": image.id,
        "patient": patient_name,
        "modality": image.modality or image.image_type,
        "body_part": image.body_part,
        "priority": image.order_priority or "routine",
        "status": "ordered",
        "ai_status": "not_available",
        "ai_confidence": None,
        "ai_findings": None,
        "clinical_indication": image.clinical_indication,
        "ordered": image.image_date.isoformat() if image.image_date else None,
    }


@radiology_orders_router.get("/studies")
async def list_studies(token_data=Depends(require_clinical_write), db: AsyncSession = Depends(get_db_session)):
    images = (await db.execute(
        select(MedicalImage).where(MedicalImage.is_deleted == False).order_by(MedicalImage.image_date.desc())
    )).scalars().all()
    payload = []
    for image in images:
        patient = (await db.execute(select(Patient).where(Patient.id == image.patient_id))).scalar_one_or_none()
        payload.append(_study_view(image, await _patient_name(db, patient) if patient else "—"))
    return payload


@radiology_orders_router.post("/studies", status_code=201)
async def order_study(
    payload: StudyOrder,
    token_data=Depends(require_clinical_write),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await _patient(db, health_id=payload.health_id)
    hospital = await _hospital(db)
    image_type = _IMAGE_TYPE.get(payload.modality.lower(), payload.modality.lower())
    image = MedicalImage(
        patient_id=patient.id,
        image_type=image_type,
        image_date=datetime.now(timezone.utc),
        body_part=payload.body_part,
        modality=payload.modality,
        file_path="pending-upload",
        file_name="order-pending",
        clinical_indication=payload.clinical_indication,
        hospital_id=hospital.id,
        ai_analyzed=False,
        order_priority=payload.priority,
    )
    db.add(image)
    await db.flush()
    return _study_view(image, await _patient_name(db, patient))


class CaseCreate(BaseModel):
    health_id: str
    triage_level: str
    chief_complaint: str
    heart_rate: Optional[float] = None
    blood_pressure: Optional[str] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    assigned_doctor_id: Optional[str] = None


def _case_view(row: TriageAssessment, patient_name: str, assigned: str) -> dict:
    vitals = row.vital_signs if isinstance(row.vital_signs, dict) else {}
    return {
        "id": row.id,
        "patient": patient_name,
        "patient_name": patient_name,
        "triage": _TRIAGE_LABEL.get(row.triage_level, row.triage_level),
        "triage_level": row.triage_level,
        "chief": row.chief_complaint,
        "chief_complaint": row.chief_complaint,
        "vitals": {
            "hr": vitals.get("heart_rate"),
            "bp": vitals.get("blood_pressure"),
            "spo2": vitals.get("spo2"),
            "temp": vitals.get("temperature"),
        },
        "time": row.triage_time.isoformat() if row.triage_time else None,
        "arrival_time": row.arrival_time.isoformat() if row.arrival_time else None,
        "status": row.disposition or "waiting",
        "assigned": assigned,
    }


@emergency_cases_router.get("/cases")
async def list_cases(token_data=Depends(require_clinical_write), db: AsyncSession = Depends(get_db_session)):
    rows = (await db.execute(
        select(TriageAssessment).where(TriageAssessment.is_deleted == False).order_by(TriageAssessment.created_at.desc())
    )).scalars().all()
    payload = []
    for row in rows:
        patient = (await db.execute(select(Patient).where(Patient.id == row.patient_id))).scalar_one_or_none()
        payload.append(_case_view(row, await _patient_name(db, patient) if patient else "—", row.assigned_clinician or "—"))
    return payload


@emergency_cases_router.post("/cases", status_code=201)
async def create_case(
    payload: CaseCreate,
    token_data=Depends(require_clinical_write),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await _patient(db, health_id=payload.health_id)
    hospital = await _hospital(db)
    level = _TRIAGE.get(payload.triage_level.strip().lower())
    if level is None:
        raise HTTPException(status_code=400, detail="Unknown triage level")
    assigned = "—"
    if payload.assigned_doctor_id:
        doctor = await _doctor(db, payload.assigned_doctor_id)
        doctor_user = (await db.execute(select(User).where(User.id == doctor.user_id))).scalar_one_or_none()
        if doctor_user:
            assigned = f"Dr. {doctor_user.first_name} {doctor_user.last_name}".strip()
    now = datetime.now(timezone.utc)
    row = TriageAssessment(
        patient_id=patient.id,
        nurse_id=token_data.get("sub"),
        hospital_id=hospital.id,
        arrival_time=now,
        triage_time=now,
        triage_level=level,
        chief_complaint=payload.chief_complaint,
        vital_signs={
            "heart_rate": payload.heart_rate,
            "blood_pressure": payload.blood_pressure,
            "spo2": payload.spo2,
            "temperature": payload.temperature,
        },
        disposition="waiting",
        assigned_clinician=assigned,
    )
    db.add(row)
    await db.flush()
    return _case_view(row, await _patient_name(db, patient), assigned)


@emergency_cases_router.get("/dashboard")
async def emergency_dashboard(token_data=Depends(require_clinical_write), db: AsyncSession = Depends(get_db_session)):
    cases = await list_cases(token_data, db)
    return {"cases": len(cases), "triage_distribution": None}


class SessionCreate(BaseModel):
    health_id: str
    doctor_id: str
    session_type: str
    date: str
    time: str
    duration_minutes: int = 30
    platform: str = "video"
    notes: Optional[str] = None


def _session_view(row: VideoSession, patient_name: str, doctor_name: str) -> dict:
    start = row.scheduled_start
    return {
        "id": row.id,
        "patient": patient_name,
        "doctor": doctor_name,
        "specialty": None,
        "type": row.visit_type,
        "date": start.strftime("%Y-%m-%d") if start else None,
        "time": start.strftime("%H:%M") if start else None,
        "duration": row.duration_minutes,
        "platform": "Video" if (row.room_id or "video") == "video" else "Phone",
        "status": row.status or "scheduled",
        "notes": row.clinical_notes,
    }


@telemedicine_router.get("/sessions")
async def list_sessions(token_data=Depends(require_clinical_write), db: AsyncSession = Depends(get_db_session)):
    rows = (await db.execute(
        select(VideoSession).where(VideoSession.is_deleted == False).order_by(VideoSession.scheduled_start.desc())
    )).scalars().all()
    payload = []
    for row in rows:
        patient = (await db.execute(select(Patient).where(Patient.id == row.patient_id))).scalar_one_or_none()
        doctor_user = (await db.execute(select(User).where(User.id == row.provider_id))).scalar_one_or_none()
        doctor_name = f"Dr. {doctor_user.first_name} {doctor_user.last_name}".strip() if doctor_user else "—"
        payload.append(_session_view(row, await _patient_name(db, patient) if patient else "—", doctor_name))
    return payload


@telemedicine_router.post("/sessions", status_code=201)
async def create_session(
    payload: SessionCreate,
    token_data=Depends(require_clinical_write),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await _patient(db, health_id=payload.health_id)
    doctor = await _doctor(db, payload.doctor_id)
    doctor_user = (await db.execute(select(User).where(User.id == doctor.user_id))).scalar_one_or_none()
    scheduled = _aware(f"{payload.date}T{payload.time}")
    row = VideoSession(
        patient_id=patient.id,
        provider_id=doctor.user_id,
        scheduled_start=scheduled,
        duration_minutes=payload.duration_minutes,
        visit_type=payload.session_type,
        clinical_notes=payload.notes,
        room_id=payload.platform,
        status="scheduled",
    )
    db.add(row)
    await db.flush()
    doctor_name = f"Dr. {doctor_user.first_name} {doctor_user.last_name}".strip() if doctor_user else "—"
    return _session_view(row, await _patient_name(db, patient), doctor_name)


class TrialCreate(BaseModel):
    title: str
    phase: str
    target_enrollment: int = 0
    principal_investigator: Optional[str] = None
    sponsor: str
    cancer_type: Optional[str] = None
    primary_endpoint: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    arms: Optional[str] = None


def _trial_view(row: TrialProtocol) -> dict:
    arms = row.treatment_arms if isinstance(row.treatment_arms, list) else []
    return {
        "id": row.id,
        "title": row.title,
        "phase": _PHASE_LABEL.get(row.phase, row.phase),
        "enrolled": row.current_enrollment or 0,
        "target": row.target_enrollment or 0,
        "pi": row.principal_investigator,
        "sponsor": row.sponsor,
        "cancer_type": row.cancer_type,
        "primary_endpoint": row.primary_endpoint,
        "start_date": row.start_date.isoformat() if row.start_date else None,
        "end_date": row.estimated_completion.isoformat() if row.estimated_completion else None,
        "arms": arms,
        "status": row.status,
        "protocol_number": row.protocol_number,
    }


@trials_router.get("")
async def list_trials(token_data=Depends(require_clinical_write), db: AsyncSession = Depends(get_db_session)):
    rows = (await db.execute(
        select(TrialProtocol).where(TrialProtocol.is_deleted == False).order_by(TrialProtocol.created_at.desc())
    )).scalars().all()
    return [_trial_view(row) for row in rows]


@trials_router.post("", status_code=201)
async def create_trial(
    payload: TrialCreate,
    token_data=Depends(require_clinical_write),
    db: AsyncSession = Depends(get_db_session),
):
    phase = _PHASE.get(payload.phase.strip().lower(), payload.phase.strip().lower().replace(" ", "_"))
    arms = [line.strip() for line in (payload.arms or "").splitlines() if line.strip()]
    row = TrialProtocol(
        protocol_number=generate_record_number("TRL"),
        title=payload.title,
        phase=phase,
        sponsor=payload.sponsor,
        principal_investigator=payload.principal_investigator,
        indication=payload.cancer_type or payload.title,
        cancer_type=payload.cancer_type,
        primary_endpoint=payload.primary_endpoint,
        target_enrollment=payload.target_enrollment or 0,
        current_enrollment=0,
        treatment_arms=arms,
        start_date=_aware(payload.start_date),
        estimated_completion=_aware(payload.end_date),
        status="planning",
    )
    db.add(row)
    await db.flush()
    return _trial_view(row)


class AdmitCreate(BaseModel):
    health_id: str
    ward: str
    attending_name: Optional[str] = None
    doctor_id: Optional[str] = None
    reason: Optional[str] = None


@admissions_router.post("/admissions", status_code=201)
async def admit_patient(
    payload: AdmitCreate,
    token_data=Depends(require_clinical_write),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await _patient(db, health_id=payload.health_id)
    hospital = await _hospital(db)
    attending = payload.attending_name
    if payload.doctor_id and not attending:
        doctor = await _doctor(db, payload.doctor_id)
        doctor_user = (await db.execute(select(User).where(User.id == doctor.user_id))).scalar_one_or_none()
        if doctor_user:
            attending = f"Dr. {doctor_user.first_name} {doctor_user.last_name}".strip()
    bed = (await db.execute(
        select(HospitalBed).where(
            HospitalBed.hospital_id == hospital.id,
            HospitalBed.ward == payload.ward,
            HospitalBed.status == "available",
            HospitalBed.is_deleted == False,
        )
    )).scalars().first()
    if bed is None:
        existing = (await db.execute(
            select(HospitalBed).where(HospitalBed.hospital_id == hospital.id, HospitalBed.ward == payload.ward)
        )).scalars().all()
        bed = HospitalBed(
            hospital_id=hospital.id,
            ward=payload.ward,
            bed_code=f"{payload.ward[:3].upper()}-{len(existing) + 1:02d}",
            status="available",
        )
        db.add(bed)
        await db.flush()
    bed.status = "occupied"
    bed.patient_id = patient.id
    bed.diagnosis = payload.reason
    bed.attending_name = attending
    bed.admitted_at = datetime.now(timezone.utc)
    await db.flush()
    return {
        "id": bed.id,
        "bed_code": bed.bed_code,
        "ward": bed.ward,
        "patient": await _patient_name(db, patient),
        "health_id": patient.health_id,
        "status": bed.status,
        "diagnosis": bed.diagnosis,
        "doctor": bed.attending_name,
    }


class HospitalInvoiceCreate(BaseModel):
    hospital_name: str
    billing_period: Optional[str] = None
    amount: float = Field(..., ge=0)
    due_date: Optional[str] = None
    notes: Optional[str] = None


@hospital_invoice_router.post("/hospital-invoices", status_code=201)
async def create_hospital_invoice(
    payload: HospitalInvoiceCreate,
    token_data=Depends(require_billing_access),
    db: AsyncSession = Depends(get_db_session),
):
    row = PlatformInvoice(
        invoice_number=generate_record_number("INV"),
        hospital_name=payload.hospital_name,
        plan_name=payload.billing_period,
        amount=payload.amount,
        due_date=_aware(payload.due_date),
        notes=payload.notes,
        status="pending",
        created_by=token_data.get("sub"),
    )
    db.add(row)
    await db.flush()
    return {
        "id": row.invoice_number,
        "record_id": row.id,
        "hospital": row.hospital_name,
        "plan": row.plan_name,
        "amount": row.amount,
        "date": row.created_at.isoformat() if row.created_at else None,
        "dueDate": row.due_date.isoformat() if row.due_date else None,
        "status": row.status,
    }
