"""
Patient lifestyle, genetics, screening, family, and treatment routes.

These endpoints persist what the user records. They do not invent scores,
meal plans, gene results, or treatment-response percentages.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models.cancer_screening import CancerScreening, ScreeningRecommendation
from app.models.clinical_trials_v2 import TrialProtocol
from app.models.genomics import GeneticVariant, GenomicSequence, PharmacogenomicProfile
from app.models.health_record import HealthRecord
from app.models.mental_health_enhanced import BehavioralGoal, MentalHealthScreening
from app.models.nutrition_enhanced import FoodLog, HydrationLog, MealPlan
from app.models.operations import ExerciseSession, SecondOpinionRequest
from app.models.patient import Patient, PatientFamilyHistory
from app.security import generate_record_number, get_current_user_id

router = APIRouter(tags=["Patient Records"])

NOT_AVAILABLE = {
    "available": False,
    "status": "not_available",
    "message": "This result is not available. Nothing is estimated when no record exists.",
}


async def current_patient(user_id: str, db: AsyncSession) -> Patient:
    patient = (await db.execute(select(Patient).where(Patient.user_id == user_id))).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient


def _iso(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


# ---------------------------------------------------------------------------
# Genetics — stored sequences, variants, and pharmacogenomic rows only
# ---------------------------------------------------------------------------

@router.get("/genetics/profile")
async def genetics_profile(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    sequences = (await db.execute(
        select(GenomicSequence).where(GenomicSequence.patient_id == patient.id, GenomicSequence.is_deleted == False)
    )).scalars().all()
    variants = (await db.execute(
        select(GeneticVariant).where(GeneticVariant.patient_id == patient.id, GeneticVariant.is_deleted == False)
    )).scalars().all()
    genes = {v.gene for v in variants}
    high = [v for v in variants if v.classification in ("pathogenic", "likely_pathogenic")]
    return {
        "genes_analyzed": len(genes),
        "sequences": len(sequences),
        "risk_variants": len(high),
        "genetic_risk_score": None,
        "genetic_risk_status": "not_available",
        "ancestry": [],
        "cancer_risk_radar": [],
        "note": "Gene counts come from recorded variants. A numeric genetic risk score is not calculated.",
    }


@router.get("/genetics/markers")
async def genetics_markers(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    variants = (await db.execute(
        select(GeneticVariant).where(GeneticVariant.patient_id == patient.id, GeneticVariant.is_deleted == False)
    )).scalars().all()
    return [{
        "id": v.id,
        "gene": v.gene,
        "variant": v.dbsnp_id or v.variant_type or v.classification,
        "risk_level": "high" if v.classification in ("pathogenic", "likely_pathogenic") else "low",
        "cancer_type": "",
        "description": v.clinical_significance or "",
        "prevalence": v.allele_frequency,
    } for v in variants]


@router.get("/genetics/pharmacogenomics")
async def genetics_pharma(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(PharmacogenomicProfile).where(PharmacogenomicProfile.patient_id == patient.id, PharmacogenomicProfile.is_deleted == False)
    )).scalars().all()
    items = []
    for row in rows:
        drugs = row.affected_drugs if isinstance(row.affected_drugs, list) else []
        drug_name = ", ".join(str(d) for d in drugs) if drugs else ""
        items.append({
            "drug": drug_name,
            "gene": row.gene,
            "metabolism": row.metabolizer_status or row.phenotype or "",
            "recommendation": row.cpic_guideline or "",
        })
    return items


@router.post("/genetics/test-request", status_code=201)
async def request_genetic_test(
    panel_name: str = Body("Hereditary cancer panel"),
    notes: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    sequence = GenomicSequence(
        patient_id=patient.id,
        sequencing_method="targeted_panel",
        lab_name=panel_name,
        status="requested",
        ordered_by=user_id,
    )
    db.add(sequence)
    await db.flush()
    return {"id": sequence.id, "status": "requested", "panel": panel_name, "notes": notes}


# ---------------------------------------------------------------------------
# Diet — logged meals and stored meal plans only
# ---------------------------------------------------------------------------

@router.get("/diet/plan")
async def diet_plan(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    plan = (await db.execute(
        select(MealPlan).where(MealPlan.patient_id == patient.id, MealPlan.is_deleted == False).order_by(MealPlan.created_at.desc())
    )).scalars().first()
    if not plan:
        return {"meals": [], "macro_breakdown": [], "status": "not_available", "message": "No meal plan has been saved."}
    schedule = plan.meal_schedule if isinstance(plan.meal_schedule, list) else []
    return {
        "id": plan.id,
        "plan_name": plan.plan_name,
        "daily_calories": plan.daily_calories,
        "meals": schedule,
        "macro_breakdown": [
            {"name": "Protein", "value": plan.protein_g, "target": plan.protein_g},
            {"name": "Carbs", "value": plan.carbs_g, "target": plan.carbs_g},
            {"name": "Fat", "value": plan.fat_g, "target": plan.fat_g},
        ],
    }


@router.post("/diet/plan", status_code=201)
async def save_diet_plan(
    plan_name: str = Body(...),
    daily_calories: int = Body(2000),
    meals: list = Body(default=[]),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    plan = MealPlan(patient_id=patient.id, plan_name=plan_name, daily_calories=daily_calories, meal_schedule=meals)
    db.add(plan)
    await db.flush()
    return {"id": plan.id, "plan_name": plan.plan_name}


@router.get("/diet/log")
async def diet_log(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    logs = (await db.execute(
        select(FoodLog).where(FoodLog.patient_id == patient.id, FoodLog.is_deleted == False).order_by(FoodLog.log_date.desc())
    )).scalars().all()
    hydration = (await db.execute(
        select(HydrationLog).where(HydrationLog.patient_id == patient.id, HydrationLog.is_deleted == False).order_by(HydrationLog.log_date.desc())
    )).scalars().all()
    today = datetime.now(timezone.utc).date()
    today_calories = sum(row.total_calories or 0 for row in logs if row.log_date and row.log_date.date() == today)
    today_water = sum(row.total_intake_ml or 0 for row in hydration if row.log_date and row.log_date.date() == today)
    return {
        "logs": [{
            "id": row.id,
            "day": _iso(row.log_date),
            "date": _iso(row.log_date),
            "meal": row.meal_type,
            "calories": row.total_calories,
            "protein": row.protein_g,
            "carbs": row.carbs_g,
            "fat": row.fat_g,
        } for row in logs],
        "hydration": [{"id": row.id, "date": _iso(row.log_date), "ml": row.total_intake_ml, "goal_ml": row.goal_ml} for row in hydration],
        "today_calories": today_calories,
        "today_water_ml": today_water,
        "anti_cancer_score": None,
        "compliance": None,
    }


@router.post("/diet/log", status_code=201)
async def log_meal(
    meal_type: str = Body(...),
    calories: float = Body(0),
    protein: float = Body(0),
    carbs: float = Body(0),
    fat: float = Body(0),
    notes: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = FoodLog(
        patient_id=patient.id,
        log_date=datetime.now(timezone.utc),
        meal_type=meal_type,
        total_calories=calories,
        protein_g=protein,
        carbs_g=carbs,
        fat_g=fat,
        notes=notes,
    )
    db.add(row)
    await db.flush()
    return {"id": row.id}


@router.get("/diet/recommendations")
async def diet_recommendations():
    return {**NOT_AVAILABLE, "recommendations": []}


@router.get("/diet/anti-cancer-foods")
async def anti_cancer_foods():
    return {**NOT_AVAILABLE, "foods": []}


# ---------------------------------------------------------------------------
# Exercise
# ---------------------------------------------------------------------------

@router.get("/exercise/sessions")
async def exercise_sessions(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(ExerciseSession).where(ExerciseSession.patient_id == patient.id, ExerciseSession.is_deleted == False)
        .order_by(ExerciseSession.session_date.desc())
    )).scalars().all()
    today = datetime.now(timezone.utc).date()
    sessions = [{
        "id": row.id,
        "day": _iso(row.session_date),
        "date": _iso(row.session_date),
        "duration": row.duration_minutes,
        "minutes": row.duration_minutes,
        "calories": row.calories_burned or 0,
        "type": row.exercise_type,
        "heartRate": row.avg_heart_rate,
        "steps": row.steps,
    } for row in rows]
    return {
        "sessions": sessions,
        "steps_today": sum(row.steps or 0 for row in rows if row.session_date and row.session_date.date() == today),
        "active_minutes": sum(row.duration_minutes or 0 for row in rows),
        "calories_burned": sum(row.calories_burned or 0 for row in rows),
        "avg_heart_rate": (
            round(sum(row.avg_heart_rate for row in rows if row.avg_heart_rate) / len([row for row in rows if row.avg_heart_rate]))
            if any(row.avg_heart_rate for row in rows) else None
        ),
    }


@router.post("/exercise/sessions", status_code=201)
async def log_exercise(
    exercise_type: str = Body(...),
    duration_minutes: int = Body(0),
    calories_burned: float = Body(None),
    avg_heart_rate: int = Body(None),
    steps: int = Body(None),
    notes: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = ExerciseSession(
        patient_id=patient.id,
        session_date=datetime.now(timezone.utc),
        exercise_type=exercise_type,
        duration_minutes=duration_minutes,
        calories_burned=calories_burned,
        avg_heart_rate=avg_heart_rate,
        steps=steps,
        notes=notes,
    )
    db.add(row)
    await db.flush()
    return {"id": row.id}


@router.get("/exercise/goals")
async def exercise_goals(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(BehavioralGoal).where(
            BehavioralGoal.patient_id == patient.id,
            BehavioralGoal.goal_category == "exercise",
            BehavioralGoal.is_deleted == False,
        )
    )).scalars().all()
    return [{
        "id": row.id,
        "type": row.goal_description,
        "goal_type": row.goal_description,
        "target": row.target_frequency,
        "current": row.progress,
        "unit": row.measurement_method or "",
        "status": row.status,
    } for row in rows]


@router.get("/exercise/recommendations")
async def exercise_recommendations():
    return {**NOT_AVAILABLE, "recommendations": []}


# ---------------------------------------------------------------------------
# Health goals
# ---------------------------------------------------------------------------

@router.get("/goals")
async def list_goals(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(BehavioralGoal).where(BehavioralGoal.patient_id == patient.id, BehavioralGoal.is_deleted == False)
        .order_by(BehavioralGoal.created_at.desc())
    )).scalars().all()
    return [row.to_dict() for row in rows]


@router.post("/goals", status_code=201)
async def create_goal(
    title: str = Body(...),
    category: str = Body("general"),
    target: str = Body(None),
    unit: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = BehavioralGoal(
        patient_id=patient.id,
        goal_category=category,
        goal_description=title,
        target_frequency=target,
        measurement_method=unit,
        start_date=datetime.now(timezone.utc),
        status="active",
        progress=0,
    )
    db.add(row)
    await db.flush()
    return row.to_dict()


@router.put("/goals/{goal_id}")
async def update_goal(
    goal_id: str,
    progress: float = Body(None),
    status: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = (await db.execute(
        select(BehavioralGoal).where(BehavioralGoal.id == goal_id, BehavioralGoal.patient_id == patient.id)
    )).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Goal not found")
    if progress is not None:
        row.progress = progress
    if status:
        row.status = status
    row.last_updated = datetime.now(timezone.utc)
    return row.to_dict()


# ---------------------------------------------------------------------------
# Screening schedule
# ---------------------------------------------------------------------------

@router.get("/screening/schedule")
async def screening_schedule(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(ScreeningRecommendation).where(ScreeningRecommendation.patient_id == patient.id)
        .order_by(ScreeningRecommendation.created_at.desc())
    )).scalars().all()
    return [{
        "id": row.id,
        "cancer_type": row.cancer_type,
        "test": row.screening_method,
        "recommended_date": _iso(row.recommended_date),
        "frequency": row.frequency,
        "status": "completed" if row.completed else ("scheduled" if row.scheduled else "upcoming"),
        "last_done": _iso(row.completed_date),
        "risk": row.urgency,
        "provider": "",
    } for row in rows]


@router.post("/screening/schedule", status_code=201)
async def add_screening(
    cancer_type: str = Body(...),
    screening_method: str = Body(...),
    urgency: str = Body("routine"),
    frequency: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = ScreeningRecommendation(
        patient_id=patient.id,
        cancer_type=cancer_type,
        screening_method=screening_method,
        urgency=urgency,
        frequency=frequency,
        scheduled=True,
    )
    db.add(row)
    await db.flush()
    return {"id": row.id}


@router.put("/screening/schedule/{item_id}")
async def update_screening(
    item_id: str,
    completed: bool = Body(None),
    scheduled: bool = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = (await db.execute(
        select(ScreeningRecommendation).where(ScreeningRecommendation.id == item_id, ScreeningRecommendation.patient_id == patient.id)
    )).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Screening item not found")
    if completed is not None:
        row.completed = completed
        if completed:
            row.completed_date = datetime.utcnow()
    if scheduled is not None:
        row.scheduled = scheduled
    return {"id": row.id, "completed": row.completed, "scheduled": row.scheduled}


@router.get("/screening/guidelines")
async def screening_guidelines():
    return {**NOT_AVAILABLE, "guidelines": []}


@router.get("/screening/history")
async def screening_history(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(CancerScreening).where(CancerScreening.patient_id == patient.id).order_by(CancerScreening.screening_date.desc())
    )).scalars().all()
    return [row.to_dict() for row in rows]


# ---------------------------------------------------------------------------
# Family health
# ---------------------------------------------------------------------------

@router.get("/family-health/tree")
async def family_tree(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(PatientFamilyHistory).where(PatientFamilyHistory.patient_id == patient.id)
    )).scalars().all()
    return [{
        "id": row.id,
        "name": row.relative_name or row.relationship_type,
        "relationship": row.relationship_type,
        "age": row.age_at_diagnosis,
        "alive": row.relative_living,
        "conditions": [row.condition_name] if row.condition_name else [],
        "cancer_history": [row.cancer_type] if row.is_cancer and row.cancer_type else ([] if not row.is_cancer else [row.condition_name]),
        "genetic_tested": False,
    } for row in rows]


@router.post("/family-health/members", status_code=201)
async def add_family_member(
    relationship_type: str = Body(...),
    relative_name: str = Body(None),
    condition_name: str = Body("Not specified"),
    is_cancer: bool = Body(False),
    cancer_type: str = Body(None),
    relative_living: bool = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = PatientFamilyHistory(
        patient_id=patient.id,
        relationship_type=relationship_type,
        relative_name=relative_name,
        condition_name=condition_name,
        is_cancer=is_cancer,
        cancer_type=cancer_type,
        relative_living=relative_living,
    )
    db.add(row)
    await db.flush()
    return {"id": row.id}


@router.get("/family-health/risk-analysis")
async def family_risk_analysis(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(PatientFamilyHistory).where(PatientFamilyHistory.patient_id == patient.id, PatientFamilyHistory.is_cancer == True)
    )).scalars().all()
    counts: dict[str, int] = {}
    for row in rows:
        key = row.cancer_type or row.condition_name
        counts[key] = counts.get(key, 0) + 1
    return {
        "hereditary_risks": [],
        "cancer_patterns": [{"name": name, "count": count, "value": count} for name, count in counts.items()],
        "risk_status": "not_available",
        "message": "Relative cancer counts are shown. A hereditary risk percentage is not calculated.",
    }


# ---------------------------------------------------------------------------
# Treatment plans are health records. Response percentages are not fabricated.
# ---------------------------------------------------------------------------

@router.get("/treatment/plans")
async def treatment_plans(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(HealthRecord).where(
            HealthRecord.patient_id == patient.id,
            HealthRecord.record_type == "treatment",
            HealthRecord.is_deleted == False,
        ).order_by(HealthRecord.encounter_date.desc())
    )).scalars().all()
    return [{
        "id": row.id,
        "cancer_type": row.primary_diagnosis or "",
        "stage": row.diagnosis_severity or "",
        "plan_type": row.category,
        "doctor": "",
        "hospital": "",
        "success_rate": None,
        "start_date": _iso(row.encounter_date),
        "end_date": _iso(row.encounter_end_date),
        "phases": [],
        "side_effects": [],
        "response_tracking": [],
        "notes": row.chief_complaint,
    } for row in rows]


@router.post("/treatment/plans", status_code=201)
async def create_treatment_plan(
    diagnosis: str = Body(...),
    notes: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = HealthRecord(
        patient_id=patient.id,
        health_id=patient.health_id,
        record_type="treatment",
        record_number=generate_record_number("TR"),
        encounter_date=datetime.now(timezone.utc),
        primary_diagnosis=diagnosis,
        chief_complaint=notes,
    )
    db.add(row)
    await db.flush()
    return {"id": row.id}


@router.get("/treatment/plans/{plan_id}")
async def treatment_plan(plan_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    row = (await db.execute(
        select(HealthRecord).where(HealthRecord.id == plan_id, HealthRecord.patient_id == patient.id)
    )).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    return row.to_dict()


@router.get("/treatment/clinical-trials/{cancer_type}")
async def matching_trials(cancer_type: str, db: AsyncSession = Depends(get_db_session)):
    query = select(TrialProtocol).where(TrialProtocol.is_deleted == False)
    if cancer_type and cancer_type != "all":
        query = query.where(TrialProtocol.cancer_type == cancer_type)
    rows = (await db.execute(query.limit(50))).scalars().all()
    return [{
        "id": row.id,
        "title": row.title,
        "phase": row.phase,
        "status": row.status,
        "match_score": None,
        "sponsor": row.sponsor,
    } for row in rows]


@router.get("/treatment/second-opinion")
async def list_second_opinions(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(SecondOpinionRequest).where(SecondOpinionRequest.patient_id == patient.id).order_by(SecondOpinionRequest.created_at.desc())
    )).scalars().all()
    return [row.to_dict() for row in rows]


@router.post("/treatment/second-opinion", status_code=201)
async def request_second_opinion(
    original_diagnosis: str = Body(...),
    notes: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = SecondOpinionRequest(patient_id=patient.id, original_diagnosis=original_diagnosis, notes=notes, status="requested")
    db.add(row)
    await db.flush()
    return row.to_dict()


# ---------------------------------------------------------------------------
# Symptoms recorded as health records
# ---------------------------------------------------------------------------

@router.post("/symptoms", status_code=201)
async def log_symptom(
    name: str = Body(...),
    severity: int = Body(1),
    body_part: str = Body("General"),
    notes: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = HealthRecord(
        patient_id=patient.id,
        health_id=patient.health_id,
        record_type="symptom",
        record_number=generate_record_number("SYM"),
        encounter_date=datetime.now(timezone.utc),
        chief_complaint=name,
        present_illness_history=notes,
        diagnosis_severity=str(severity),
        primary_diagnosis=body_part,
    )
    db.add(row)
    await db.flush()
    return {"id": row.id}


# ---------------------------------------------------------------------------
# Mental health aliases expected by the patient wellness page
# ---------------------------------------------------------------------------

@router.get("/mental-health/assessments")
async def mood_assessments(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    patient = await current_patient(user_id, db)
    rows = (await db.execute(
        select(MentalHealthScreening).where(MentalHealthScreening.patient_id == patient.id).order_by(MentalHealthScreening.created_at.desc())
    )).scalars().all()
    return [row.to_dict() for row in rows]


@router.post("/mental-health/assessments", status_code=201)
async def submit_mood(
    tool_name: str = Body("mood"),
    total_score: int = Body(...),
    notes: str = Body(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session),
):
    patient = await current_patient(user_id, db)
    row = MentalHealthScreening(
        patient_id=patient.id,
        screening_date=datetime.now(timezone.utc),
        tool_name=tool_name,
        total_score=total_score,
        interpretation=notes,
    )
    db.add(row)
    await db.flush()
    return row.to_dict()


@router.get("/mental-health/mood-history")
async def mood_history(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    return await mood_assessments(user_id, db)


@router.get("/mental-health/sessions")
async def mental_sessions_alias(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    from app.models.mental_health_enhanced import CBTSession
    patient = await current_patient(user_id, db)
    rows = (await db.execute(select(CBTSession).where(CBTSession.patient_id == patient.id))).scalars().all()
    return [row.to_dict() for row in rows]


@router.get("/mental-health/resources")
async def mental_resources(db: AsyncSession = Depends(get_db_session)):
    from app.models.mental_health_enhanced import MindfulnessExercise
    rows = (await db.execute(select(MindfulnessExercise).where(MindfulnessExercise.is_deleted == False))).scalars().all()
    return [row.to_dict() for row in rows]
