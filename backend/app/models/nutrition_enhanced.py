"""
Enhanced Nutrition & Wellness Models
======================================
Nutrition assessments, meal plans, dietary restrictions,
supplements, hydration, and weight management.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class DietType(str, enum.Enum):
    REGULAR = "regular"
    CARDIAC = "cardiac"
    DIABETIC = "diabetic"
    RENAL = "renal"
    LOW_SODIUM = "low_sodium"
    GLUTEN_FREE = "gluten_free"
    KETOGENIC = "ketogenic"
    ANTI_INFLAMMATORY = "anti_inflammatory"
    NEUTROPENIC = "neutropenic"
    CLEAR_LIQUID = "clear_liquid"


class NutritionAssessment(Base):
    """Comprehensive nutrition assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    dietitian_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bmi: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ideal_body_weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    waist_circumference_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    body_fat_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    muscle_mass_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    nutritional_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    malnutrition_risk: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    screening_tool: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    screening_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    caloric_needs: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    protein_needs_g: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fluid_needs_ml: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dietary_history: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    food_allergies: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    food_intolerances: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    swallowing_difficulty: Mapped[bool] = mapped_column(Boolean, default=False)
    appetite_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    gi_symptoms: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    lab_markers: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    follow_up_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class MealPlan(Base):
    """Personalized meal plan."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    dietitian_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    plan_name: Mapped[str] = mapped_column(String(200), nullable=False)
    diet_type: Mapped[str] = mapped_column(String(30), default=DietType.REGULAR.value)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    daily_calories: Mapped[int] = mapped_column(Integer, default=2000)
    protein_g: Mapped[float] = mapped_column(Float, default=50.0)
    carbs_g: Mapped[float] = mapped_column(Float, default=250.0)
    fat_g: Mapped[float] = mapped_column(Float, default=65.0)
    fiber_g: Mapped[float] = mapped_column(Float, default=25.0)
    sodium_mg: Mapped[float] = mapped_column(Float, default=2300.0)
    meals_per_day: Mapped[int] = mapped_column(Integer, default=3)
    snacks_per_day: Mapped[int] = mapped_column(Integer, default=2)
    meal_schedule: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    recipes: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    shopping_list: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    restrictions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    preferences: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    special_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    adherence_rate: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="active")


class FoodLog(Base):
    """Daily food intake log."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    meal_plan_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("meal_plan.id"), nullable=True)
    log_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    food_items: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    total_calories: Mapped[float] = mapped_column(Float, default=0.0)
    protein_g: Mapped[float] = mapped_column(Float, default=0.0)
    carbs_g: Mapped[float] = mapped_column(Float, default=0.0)
    fat_g: Mapped[float] = mapped_column(Float, default=0.0)
    fiber_g: Mapped[float] = mapped_column(Float, default=0.0)
    sodium_mg: Mapped[float] = mapped_column(Float, default=0.0)
    sugar_g: Mapped[float] = mapped_column(Float, default=0.0)
    water_ml: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ai_analysis: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class DietaryRestriction(Base):
    """Patient dietary restrictions and allergies."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    restriction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    allergen: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="moderate")
    reaction_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    diagnosed_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    diagnosed_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    alternatives: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class NutritionalSupplement(Base):
    """Nutritional supplement tracking."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    prescriber_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    supplement_name: Mapped[str] = mapped_column(String(200), nullable=False)
    supplement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    frequency: Mapped[str] = mapped_column(String(50), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    interactions_checked: Mapped[bool] = mapped_column(Boolean, default=False)
    side_effects: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")


class HydrationLog(Base):
    """Daily hydration tracking."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    log_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_intake_ml: Mapped[float] = mapped_column(Float, default=0.0)
    goal_ml: Mapped[float] = mapped_column(Float, default=2500.0)
    entries: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    beverage_types: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    dehydration_symptoms: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    urine_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class WeightManagementProgram(Base):
    """Weight management program enrollment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    program_type: Mapped[str] = mapped_column(String(50), nullable=False)
    start_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    current_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    target_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    target_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    weekly_target_loss_kg: Mapped[float] = mapped_column(Float, default=0.5)
    total_lost_kg: Mapped[float] = mapped_column(Float, default=0.0)
    strategy: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    exercise_plan: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    behavioral_goals: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    medications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    surgery_considered: Mapped[bool] = mapped_column(Boolean, default=False)
    weight_history: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    check_in_frequency: Mapped[str] = mapped_column(String(20), default="weekly")
    last_check_in: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class EnteralNutrition(Base):
    """Enteral (tube feeding) nutrition management."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    prescriber_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    formula_name: Mapped[str] = mapped_column(String(200), nullable=False)
    formula_type: Mapped[str] = mapped_column(String(50), nullable=False)
    access_type: Mapped[str] = mapped_column(String(30), nullable=False)
    rate_ml_per_hour: Mapped[float] = mapped_column(Float, nullable=False)
    total_volume_ml: Mapped[float] = mapped_column(Float, nullable=False)
    calories_per_ml: Mapped[float] = mapped_column(Float, default=1.0)
    protein_per_ml: Mapped[float] = mapped_column(Float, default=0.04)
    delivery_method: Mapped[str] = mapped_column(String(30), default="continuous")
    water_flushes_ml: Mapped[float] = mapped_column(Float, default=0.0)
    flush_frequency: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    residual_check: Mapped[bool] = mapped_column(Boolean, default=True)
    head_of_bed_elevation: Mapped[int] = mapped_column(Integer, default=30)
    complications: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
