"""Aggregates computed from persisted rows. Missing series stay empty."""
from __future__ import annotations

import os
import shutil
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.billing_enhanced import Invoice
from app.models.blood_sample import BloodSample
from app.models.cancer_screening import CancerRiskAssessment, CancerScreening
from app.models.hospital import Doctor, Hospital
from app.models.notification import Notification
from app.models.operations import HospitalBed, OperatingRoom
from app.models.patient import Patient
from app.models.report import Report
from app.models.user import User


def _month_key(value: datetime) -> str:
    return value.strftime("%Y-%m")


def host_resources() -> dict[str, Any]:
    """Read host memory and disk. CPU percent and network throughput are not invented."""
    memory_percent: Optional[float] = None
    try:
        info: dict[str, int] = {}
        with open("/proc/meminfo", "r", encoding="utf-8") as handle:
            for line in handle:
                parts = line.split()
                if len(parts) >= 2 and parts[0].endswith(":"):
                    info[parts[0][:-1]] = int(parts[1])
        total = info.get("MemTotal") or 0
        available = info.get("MemAvailable") or 0
        if total:
            memory_percent = round((total - available) / total * 100, 1)
    except OSError:
        memory_percent = None

    disk_percent: Optional[float] = None
    try:
        usage = shutil.disk_usage("/")
        if usage.total:
            disk_percent = round(usage.used / usage.total * 100, 1)
    except OSError:
        disk_percent = None

    load_average = None
    if hasattr(os, "getloadavg"):
        try:
            load_average = round(os.getloadavg()[0], 2)
        except OSError:
            load_average = None

    return {
        "memory_percent": memory_percent,
        "disk_percent": disk_percent,
        "load_average_1m": load_average,
        "cpu_percent": None,
        "network_mbps": None,
        "cpu_status": "not_available",
        "network_status": "not_available",
        "note": "Memory and disk are read from the host. CPU percent and network throughput are not measured, so they are not shown.",
    }


def ai_model_status() -> dict[str, Any]:
    """No trained artifact ships with the app. Do not claim a model is loaded."""
    return {
        "status": "not_available",
        "loaded": False,
        "version": None,
        "reason": "No trained model artifact is installed. Risk scores that exist are an unvalidated rule prototype or a biomarker-flag ratio, not a validated cancer model.",
    }


async def platform_snapshot(db: AsyncSession) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = start_today.replace(day=1)

    total_users = (await db.execute(select(func.count(User.id)).where(User.is_deleted == False))).scalar() or 0
    total_patients = (await db.execute(select(func.count(Patient.id)))).scalar() or 0
    total_hospitals = (await db.execute(select(func.count(Hospital.id)).where(Hospital.is_deleted == False))).scalar() or 0
    total_doctors = (await db.execute(select(func.count(Doctor.id)).where(Doctor.is_deleted == False))).scalar() or 0
    total_screenings = (await db.execute(select(func.count(CancerScreening.id)))).scalar() or 0
    total_assessments = (await db.execute(select(func.count(CancerRiskAssessment.id)))).scalar() or 0
    total_blood = (await db.execute(select(func.count(BloodSample.id)))).scalar() or 0
    cancer_detected = (await db.execute(
        select(func.count(CancerScreening.id)).where(CancerScreening.cancer_detected == True)
    )).scalar() or 0
    high_risk = (await db.execute(
        select(func.count(Patient.id)).where(Patient.overall_cancer_risk.in_(["high", "very_high", "critical"]))
    )).scalar() or 0
    today_appointments = (await db.execute(
        select(func.count(Appointment.id)).where(Appointment.scheduled_date >= start_today)
    )).scalar() or 0
    pending_labs = (await db.execute(
        select(func.count(BloodSample.id)).where(BloodSample.sample_status.notin_(["completed", "cancelled"]))
    )).scalar() or 0
    critical_alerts = (await db.execute(
        select(func.count(Notification.id)).where(
            Notification.is_read == False,
            Notification.priority.in_(["high", "critical", "emergency"]),
        )
    )).scalar() or 0
    predictions_today = (await db.execute(
        select(func.count(CancerRiskAssessment.id)).where(CancerRiskAssessment.assessment_date >= start_today)
    )).scalar() or 0
    total_reports = (await db.execute(select(func.count(Report.id)))).scalar() or 0
    total_beds = (await db.execute(select(func.count(HospitalBed.id)).where(HospitalBed.is_deleted == False))).scalar() or 0
    occupied_beds = (await db.execute(
        select(func.count(HospitalBed.id)).where(HospitalBed.status.in_(["occupied", "discharge_pending"]))
    )).scalar() or 0
    audit_total = (await db.execute(select(func.count(AuditLog.id)))).scalar() or 0
    audit_failed = (await db.execute(
        select(func.count(AuditLog.id)).where(AuditLog.status != "success")
    )).scalar() or 0
    invoice_totals = (await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0), func.coalesce(func.sum(Invoice.paid_amount), 0))
    )).one()
    billed = float(invoice_totals[0] or 0)
    paid = float(invoice_totals[1] or 0)
    collection_rate = round(paid / billed, 4) if billed else None
    month_revenue = (await db.execute(
        select(func.coalesce(func.sum(Invoice.paid_amount), 0)).where(Invoice.service_date >= month_start)
    )).scalar() or 0

    role_rows = (await db.execute(
        select(User.role, func.count(User.id)).where(User.is_deleted == False).group_by(User.role)
    )).all()
    user_distribution = [{"role": role, "count": count} for role, count in role_rows]

    type_rows = (await db.execute(
        select(Appointment.appointment_type, func.count(Appointment.id)).group_by(Appointment.appointment_type)
    )).all()
    palette = ["#1565c0", "#4caf50", "#f57c00", "#7b1fa2", "#00897b", "#d32f2f", "#5e92f3"]
    appointment_types = [
        {"name": name or "unspecified", "value": count, "color": palette[i % len(palette)]}
        for i, (name, count) in enumerate(type_rows)
    ]

    risk_rows = (await db.execute(
        select(Patient, User)
        .join(User, User.id == Patient.user_id)
        .where(Patient.overall_cancer_risk.in_(["high", "very_high", "critical"]))
        .limit(50)
    )).all()
    risk_patients = []
    for patient, user in risk_rows:
        score = patient.cancer_risk_score
        risk_patients.append({
            "id": patient.health_id,
            "patient_id": patient.id,
            "name": f"{user.first_name} {user.last_name}".strip(),
            "risk": round((score or 0) * 100, 1) if score is not None else None,
            "cancer": patient.overall_cancer_risk,
            "status": patient.overall_cancer_risk or "unknown",
            "ward": None,
            "doctor": None,
            "age": None,
        })

    bed_rows = (await db.execute(select(HospitalBed).where(HospitalBed.is_deleted == False))).scalars().all()
    wards: dict[str, dict[str, Any]] = {}
    for bed in bed_rows:
        bucket = wards.setdefault(bed.ward, {"name": bed.ward, "total": 0, "occupied": 0, "available": 0, "maintenance": 0, "floor": "", "color": "#1565c0"})
        bucket["total"] += 1
        if bed.status in ("occupied", "discharge_pending"):
            bucket["occupied"] += 1
        elif bed.status == "available":
            bucket["available"] += 1
        elif bed.status == "maintenance":
            bucket["maintenance"] += 1
    department_stats = []
    for ward in wards.values():
        occupancy = round(ward["occupied"] / ward["total"] * 100, 1) if ward["total"] else 0
        department_stats.append({**ward, "patients": ward["occupied"], "beds": ward["total"], "occupancy": occupancy})

    since = now - timedelta(days=180)
    user_months = (await db.execute(
        select(User.created_at).where(User.created_at >= since, User.is_deleted == False)
    )).scalars().all()
    assessment_months = (await db.execute(
        select(CancerRiskAssessment.assessment_date).where(CancerRiskAssessment.assessment_date >= since)
    )).scalars().all()
    invoice_months = (await db.execute(
        select(Invoice.service_date, Invoice.paid_amount).where(Invoice.service_date >= since)
    )).all()

    growth: dict[str, dict[str, Any]] = {}
    for stamp in user_months:
        if stamp is None:
            continue
        key = _month_key(stamp)
        growth.setdefault(key, {"month": key, "users": 0, "predictions": 0})
        growth[key]["users"] += 1
    for stamp in assessment_months:
        if stamp is None:
            continue
        key = _month_key(stamp)
        growth.setdefault(key, {"month": key, "users": 0, "predictions": 0})
        growth[key]["predictions"] += 1
    platform_stats = [growth[key] for key in sorted(growth)]

    revenue: dict[str, float] = {}
    for stamp, amount in invoice_months:
        if stamp is None:
            continue
        key = _month_key(stamp)
        revenue[key] = revenue.get(key, 0) + float(amount or 0)
    monthly_revenue = [{"month": key, "revenue": revenue[key]} for key in sorted(revenue)]

    day_rows = (await db.execute(
        select(Appointment.scheduled_date).where(Appointment.scheduled_date >= now - timedelta(days=7))
    )).scalars().all()
    by_day: dict[str, int] = {}
    for stamp in day_rows:
        if stamp is None:
            continue
        label = stamp.strftime("%a")
        by_day[label] = by_day.get(label, 0) + 1
    patient_stats = [
        {"day": day, "admissions": 0, "discharges": 0, "outpatient": count}
        for day, count in by_day.items()
    ]

    recent_logs = (await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(20)
    )).scalars().all()
    recent_activity = [
        {
            "action": log.action,
            "detail": log.description or log.resource_type,
            "time": log.created_at.isoformat() if log.created_at else None,
            "type": "alert" if log.status != "success" else "lab",
            "user": log.user_id,
            "id": log.id,
            "status": log.status,
        }
        for log in recent_logs
    ]

    screening_types = (await db.execute(
        select(CancerScreening.cancer_type_screened, func.count(CancerScreening.id))
        .group_by(CancerScreening.cancer_type_screened)
    )).all()
    disease_prevalence = [
        {"name": name or "unspecified", "value": count, "color": palette[i % len(palette)]}
        for i, (name, count) in enumerate(screening_types)
    ]

    occupancy = round(occupied_beds / total_beds * 100, 1) if total_beds else None
    or_rooms = (await db.execute(select(func.count(OperatingRoom.id)))).scalar() or 0
    or_busy = (await db.execute(
        select(func.count(OperatingRoom.id)).where(OperatingRoom.status == "in_use")
    )).scalar() or 0

    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_hospitals": total_hospitals,
        "total_doctors": total_doctors,
        "total_screenings": total_screenings,
        "total_blood_samples": total_blood,
        "total_risk_assessments": total_assessments,
        "total_predictions": total_assessments,
        "cancer_detected_count": cancer_detected,
        "detection_rate": (cancer_detected / total_screenings) if total_screenings else None,
        "high_risk_patients": high_risk,
        "today_appointments": today_appointments,
        "pending_lab_results": pending_labs,
        "critical_alerts": critical_alerts,
        "ai_predictions_today": predictions_today,
        "total_reports": total_reports,
        "total_beds": total_beds,
        "occupied_beds": occupied_beds,
        "bed_occupancy_percent": occupancy,
        "operating_rooms": or_rooms,
        "operating_rooms_in_use": or_busy,
        "audit_events": audit_total,
        "audit_failed": audit_failed,
        "collection_rate": collection_rate,
        "revenue_this_month": float(month_revenue or 0),
        "user_distribution": user_distribution,
        "appointment_types": appointment_types,
        "risk_patients": risk_patients,
        "department_stats": department_stats,
        "platform_stats": platform_stats,
        "user_growth": platform_stats,
        "monthly_revenue": monthly_revenue,
        "patient_stats": patient_stats,
        "daily_stats": patient_stats,
        "recent_activity": recent_activity,
        "recent_activities": recent_activity,
        "revenue_data": monthly_revenue,
        "disease_prevalence": disease_prevalence,
        "saved_reports": [],
        "feature_adoption": [],
        "geo_distribution": [],
        "device_breakdown": [],
        "kpis": [],
        "model_accuracy": None,
        "model_accuracy_status": "not_available",
        "early_detection_rate": None,
        "survival_rate": None,
        "false_positive_rate": None,
        "engagement_rate": None,
        "open_rate": None,
        "attacks_blocked": None,
        "compliance_score": None,
        "ai_models": ai_model_status(),
        "resources": host_resources(),
        "timestamp": now.isoformat(),
    }
