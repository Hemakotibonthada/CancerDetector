"""
Nutrition & Dietary Management API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.nutrition_enhanced import (
    NutritionAssessment, MealPlan, FoodLog, DietaryRestriction,
    NutritionalSupplement, HydrationLog, WeightManagementProgram, EnteralNutrition,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])

@router.get("/assessments")
async def list_assessments(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(NutritionAssessment).where(NutritionAssessment.is_deleted == False)
    if patient_id:
        q = q.where(NutritionAssessment.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/assessments")
async def create_assessment(patient_id: str = Body(...), bmi: float = Body(None), caloric_needs: int = Body(None),
                             protein_needs: float = Body(None), nutritional_status: str = Body(None),
                             recommendations: str = Body(None), user_id: str = Depends(get_current_user_id),
                             db: AsyncSession = Depends(get_db_session)):
    assessment = NutritionAssessment(patient_id=patient_id, bmi=bmi, caloric_needs=caloric_needs,
                                      protein_needs=protein_needs, nutritional_status=nutritional_status,
                                      recommendations=recommendations, assessed_by=user_id)
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    return assessment.to_dict()

@router.get("/meal-plans")
async def list_meal_plans(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(MealPlan).where(MealPlan.is_deleted == False)
    if patient_id:
        q = q.where(MealPlan.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/meal-plans")
async def create_meal_plan(patient_id: str = Body(...), plan_name: str = Body(...), daily_calories: int = Body(None),
                            meals: str = Body(None), special_instructions: str = Body(None),
                            user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    plan = MealPlan(patient_id=patient_id, plan_name=plan_name, daily_calories=daily_calories, meals=meals,
                     special_instructions=special_instructions, created_by=user_id)
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan.to_dict()

@router.get("/food-logs")
async def list_food_logs(patient_id: Optional[str] = None, skip: int = 0, limit: int = 50,
                          user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    q = select(FoodLog).where(FoodLog.is_deleted == False, FoodLog.patient_id == (patient_id or user_id))
    result = await db.execute(q.order_by(desc(FoodLog.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/food-logs")
async def log_food(food_name: str = Body(...), meal_type: str = Body("snack"), calories: int = Body(None),
                    protein_g: float = Body(None), carbs_g: float = Body(None), fat_g: float = Body(None),
                    serving_size: str = Body(None), user_id: str = Depends(get_current_user_id),
                    db: AsyncSession = Depends(get_db_session)):
    log = FoodLog(patient_id=user_id, food_name=food_name, meal_type=meal_type, calories=calories,
                  protein_g=protein_g, carbs_g=carbs_g, fat_g=fat_g, serving_size=serving_size,
                  logged_at=datetime.now(timezone.utc))
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log.to_dict()

@router.get("/dietary-restrictions")
async def list_dietary_restrictions(patient_id: Optional[str] = None, user_id: str = Depends(get_current_user_id),
                                     db: AsyncSession = Depends(get_db_session)):
    q = select(DietaryRestriction).where(DietaryRestriction.is_deleted == False, DietaryRestriction.patient_id == (patient_id or user_id))
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/dietary-restrictions")
async def add_dietary_restriction(restriction_type: str = Body(...), description: str = Body(None),
                                    severity: str = Body("moderate"), patient_id: str = Body(None),
                                    user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    restriction = DietaryRestriction(patient_id=patient_id or user_id, restriction_type=restriction_type,
                                      description=description, severity=severity)
    db.add(restriction)
    await db.commit()
    await db.refresh(restriction)
    return restriction.to_dict()

@router.get("/supplements")
async def list_supplements(patient_id: Optional[str] = None, user_id: str = Depends(get_current_user_id),
                            db: AsyncSession = Depends(get_db_session)):
    q = select(NutritionalSupplement).where(NutritionalSupplement.is_deleted == False, NutritionalSupplement.patient_id == (patient_id or user_id))
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/supplements")
async def add_supplement(name: str = Body(...), dosage: str = Body(None), frequency: str = Body(None),
                          reason: str = Body(None), patient_id: str = Body(None),
                          user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    supp = NutritionalSupplement(patient_id=patient_id or user_id, name=name, dosage=dosage,
                                  frequency=frequency, reason=reason)
    db.add(supp)
    await db.commit()
    await db.refresh(supp)
    return supp.to_dict()

@router.get("/hydration-logs")
async def list_hydration_logs(skip: int = 0, limit: int = 50, user_id: str = Depends(get_current_user_id),
                               db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(HydrationLog).where(HydrationLog.patient_id == user_id, HydrationLog.is_deleted == False)
                               .order_by(desc(HydrationLog.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/hydration-logs")
async def log_hydration(amount_ml: int = Body(...), beverage_type: str = Body("water"),
                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    log = HydrationLog(patient_id=user_id, amount_ml=amount_ml, beverage_type=beverage_type,
                        logged_at=datetime.now(timezone.utc))
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log.to_dict()

@router.get("/weight-programs")
async def list_weight_programs(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(WeightManagementProgram).where(WeightManagementProgram.is_deleted == False)
    if patient_id:
        q = q.where(WeightManagementProgram.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/weight-programs")
async def create_weight_program(patient_id: str = Body(...), target_weight: float = Body(None),
                                  current_weight: float = Body(None), program_type: str = Body(None),
                                  user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    program = WeightManagementProgram(patient_id=patient_id, target_weight=target_weight, current_weight=current_weight,
                                       program_type=program_type, created_by=user_id)
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return program.to_dict()

@router.get("/enteral-nutrition")
async def list_enteral_nutrition(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(EnteralNutrition).where(EnteralNutrition.is_deleted == False)
    if patient_id:
        q = q.where(EnteralNutrition.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/dashboard/stats")
async def nutrition_stats(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    meal_plans = await db.execute(select(func.count()).select_from(MealPlan).where(MealPlan.is_deleted == False))
    food_logs = await db.execute(select(func.count()).select_from(FoodLog).where(FoodLog.patient_id == user_id))
    today_calories = await db.execute(select(func.sum(FoodLog.calories)).where(FoodLog.patient_id == user_id))
    hydration = await db.execute(select(func.sum(HydrationLog.amount_ml)).where(HydrationLog.patient_id == user_id))
    return {"total_meal_plans": meal_plans.scalar() or 0, "total_food_logs": food_logs.scalar() or 0,
            "today_calories": today_calories.scalar() or 0, "total_hydration_ml": hydration.scalar() or 0}
