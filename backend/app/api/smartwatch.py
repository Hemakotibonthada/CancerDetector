"""Smartwatch API"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.smartwatch_data import SmartwatchData, SmartwatchDevice
from app.models.patient import Patient
from app.schemas.smartwatch_data import SmartwatchDataCreate, SmartwatchDataResponse, SmartwatchDashboard
from app.security import get_current_user_id, get_current_user_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/smartwatch", tags=["Smartwatch"])

@router.get("/dashboard", response_model=SmartwatchDashboard)
async def get_smartwatch_dashboard(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Get smartwatch dashboard for current patient."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check for connected devices
    device_result = await db.execute(
        select(SmartwatchDevice).where(
            SmartwatchDevice.patient_id == patient.id,
            SmartwatchDevice.is_paired == True
        )
    )
    device = device_result.scalar_one_or_none()
    
    return SmartwatchDashboard(
        patient_id=patient.id,
        device_connected=device is not None,
        last_sync=device.last_synced if device else None,
    )

@router.post("/data", status_code=201)
async def ingest_smartwatch_data(
    data: SmartwatchDataCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Ingest smartwatch data."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    smartwatch_entry = SmartwatchData(
        patient_id=patient.id,
        device_id=data.device_id,
        timestamp=data.timestamp,
        period_start=data.timestamp,
        period_end=data.timestamp,
        period_type="minute",
        heart_rate_avg=data.heart_rate_avg,
        heart_rate_min=data.heart_rate_min,
        heart_rate_max=data.heart_rate_max,
        spo2_avg=data.spo2_avg,
        steps=data.steps,
        calories_burned=data.calories_burned,
        sleep_duration_minutes=data.sleep_duration_minutes,
        stress_level=data.stress_level,
        skin_temperature=data.skin_temperature,
    )
    db.add(smartwatch_entry)
    return {"success": True, "message": "Data ingested"}

@router.get("/data", response_model=list[SmartwatchDataResponse])
async def get_smartwatch_data(
    days: int = Query(7, ge=1, le=90),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Get smartwatch data for period."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    query = select(SmartwatchData).where(
        SmartwatchData.patient_id == patient.id
    ).order_by(SmartwatchData.timestamp.desc()).limit(100)
    
    data_result = await db.execute(query)
    data = data_result.scalars().all()
    return [SmartwatchDataResponse.model_validate(d) for d in data]

@router.post("/devices/register", status_code=201)
async def register_device(
    device_id: str,
    device_name: str,
    device_brand: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """Register a new smartwatch device."""
    result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    device = SmartwatchDevice(
        patient_id=patient.id,
        device_id=device_id,
        device_name=device_name,
        device_brand=device_brand,
        is_paired=True,
        paired_at=datetime.now(timezone.utc),
    )
    db.add(device)
    
    patient.has_smartwatch = True
    patient.smartwatch_device_id = device_id
    
    return {"success": True, "message": "Device registered"}
