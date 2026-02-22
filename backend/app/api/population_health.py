"""
Population Health Management API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.population_health import (
    DiseaseRegistry, RegistryEntry, ChronicDiseaseProgram, ProgramEnrollment,
    CareGap, HealthEquityMetric, CommunityResource, PublicHealthAlert, HealthScreeningCampaign,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/population-health", tags=["Population Health"])

@router.get("/registries")
async def list_registries(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(DiseaseRegistry).where(DiseaseRegistry.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/registries")
async def create_registry(name: str = Body(...), disease_type: str = Body(...), description: str = Body(None),
                           db: AsyncSession = Depends(get_db_session)):
    registry = DiseaseRegistry(name=name, disease_type=disease_type, description=description)
    db.add(registry)
    await db.commit()
    await db.refresh(registry)
    return registry.to_dict()

@router.get("/registries/{registry_id}/entries")
async def list_registry_entries(registry_id: str, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(RegistryEntry).where(RegistryEntry.registry_id == registry_id, RegistryEntry.is_deleted == False).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/registries/{registry_id}/entries")
async def add_registry_entry(registry_id: str, patient_id: str = Body(...), diagnosis_date: str = Body(None),
                              stage: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    entry = RegistryEntry(registry_id=registry_id, patient_id=patient_id, diagnosis_date=diagnosis_date, stage=stage)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry.to_dict()

@router.get("/chronic-programs")
async def list_chronic_programs(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(ChronicDiseaseProgram).where(ChronicDiseaseProgram.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/chronic-programs")
async def create_chronic_program(name: str = Body(...), disease_type: str = Body(...), description: str = Body(None),
                                  care_plan_template: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    program = ChronicDiseaseProgram(name=name, disease_type=disease_type, description=description, care_plan_template=care_plan_template)
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return program.to_dict()

@router.post("/chronic-programs/{program_id}/enroll")
async def enroll_in_program(program_id: str, patient_id: str = Body(...), user_id: str = Depends(get_current_user_id),
                             db: AsyncSession = Depends(get_db_session)):
    enrollment = ProgramEnrollment(program_id=program_id, patient_id=patient_id, enrolled_by=user_id, enrolled_at=datetime.now(timezone.utc))
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment.to_dict()

@router.get("/care-gaps")
async def list_care_gaps(patient_id: Optional[str] = None, status: Optional[str] = None, priority: Optional[str] = None,
                         skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    q = select(CareGap).where(CareGap.is_deleted == False)
    if patient_id:
        q = q.where(CareGap.patient_id == patient_id)
    if status:
        q = q.where(CareGap.status == status)
    if priority:
        q = q.where(CareGap.priority == priority)
    result = await db.execute(q.offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.put("/care-gaps/{gap_id}/close")
async def close_care_gap(gap_id: str, resolution: str = Body(None), user_id: str = Depends(get_current_user_id),
                         db: AsyncSession = Depends(get_db_session)):
    gap = await db.get(CareGap, gap_id)
    if not gap:
        raise HTTPException(404, "Care gap not found")
    gap.status = "closed"
    gap.resolved_at = datetime.now(timezone.utc)
    gap.resolved_by = user_id
    await db.commit()
    return gap.to_dict()

@router.get("/equity-metrics")
async def list_equity_metrics(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(HealthEquityMetric).where(HealthEquityMetric.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/community-resources")
async def list_community_resources(resource_type: Optional[str] = None, zip_code: Optional[str] = None,
                                    db: AsyncSession = Depends(get_db_session)):
    q = select(CommunityResource).where(CommunityResource.is_deleted == False)
    if resource_type:
        q = q.where(CommunityResource.resource_type == resource_type)
    if zip_code:
        q = q.where(CommunityResource.zip_code == zip_code)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/community-resources")
async def create_community_resource(name: str = Body(...), resource_type: str = Body(...), address: str = Body(None),
                                     phone: str = Body(None), zip_code: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    resource = CommunityResource(name=name, resource_type=resource_type, address=address, phone=phone, zip_code=zip_code)
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource.to_dict()

@router.get("/public-health-alerts")
async def list_public_health_alerts(severity: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(PublicHealthAlert).where(PublicHealthAlert.is_deleted == False, PublicHealthAlert.is_active == True)
    if severity:
        q = q.where(PublicHealthAlert.severity == severity)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/screening-campaigns")
async def list_screening_campaigns(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(HealthScreeningCampaign).where(HealthScreeningCampaign.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/screening-campaigns")
async def create_screening_campaign(name: str = Body(...), cancer_type: str = Body(...), target_population: str = Body(None),
                                     description: str = Body(None), db: AsyncSession = Depends(get_db_session)):
    campaign = HealthScreeningCampaign(name=name, cancer_type=cancer_type, target_population=target_population, description=description)
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign.to_dict()

@router.get("/dashboard/stats")
async def population_health_stats(db: AsyncSession = Depends(get_db_session)):
    registries = await db.execute(select(func.count()).select_from(DiseaseRegistry).where(DiseaseRegistry.is_deleted == False))
    gaps = await db.execute(select(func.count()).select_from(CareGap).where(CareGap.is_deleted == False, CareGap.status == "open"))
    programs = await db.execute(select(func.count()).select_from(ChronicDiseaseProgram).where(ChronicDiseaseProgram.is_deleted == False))
    alerts = await db.execute(select(func.count()).select_from(PublicHealthAlert).where(PublicHealthAlert.is_active == True, PublicHealthAlert.is_deleted == False))
    return {"total_registries": registries.scalar() or 0, "open_care_gaps": gaps.scalar() or 0,
            "active_programs": programs.scalar() or 0, "active_alerts": alerts.scalar() or 0}
