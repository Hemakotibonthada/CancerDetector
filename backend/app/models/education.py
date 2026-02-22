"""
Education & Training Models
==============================
Patient education resources, quizzes, health literacy,
provider training modules, certifications, and learning paths.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ContentType(str, enum.Enum):
    ARTICLE = "article"
    VIDEO = "video"
    INFOGRAPHIC = "infographic"
    INTERACTIVE = "interactive"
    PDF = "pdf"
    AUDIO = "audio"
    QUIZ = "quiz"


class EducationResource(Base):
    """Patient education resource."""
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_type: Mapped[str] = mapped_column(String(20), default=ContentType.ARTICLE.value)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    subcategory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    reading_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en")
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    author: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    review_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    average_rating: Mapped[float] = mapped_column(Float, default=0.0)
    tags: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    keywords: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    related_resources: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    accessibility_features: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    published: Mapped[bool] = mapped_column(Boolean, default=False)


class PatientEducationAssignment(Base):
    """Education resource assigned to patient."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(36), ForeignKey("education_resource.id"), nullable=False)
    assigned_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    assigned_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    viewed: Mapped[bool] = mapped_column(Boolean, default=False)
    viewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    time_spent_minutes: Mapped[int] = mapped_column(Integer, default=0)
    comprehension_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class PatientQuiz(Base):
    """Health knowledge quiz."""
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("education_resource.id"), nullable=True)
    questions: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    question_count: Mapped[int] = mapped_column(Integer, default=0)
    passing_score: Mapped[float] = mapped_column(Float, default=70.0)
    time_limit_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    randomize_questions: Mapped[bool] = mapped_column(Boolean, default=False)
    show_answers: Mapped[bool] = mapped_column(Boolean, default=True)
    max_attempts: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(20), default="intermediate")
    language: Mapped[str] = mapped_column(String(10), default="en")


class QuizAttempt(Base):
    """Patient quiz attempt record."""
    quiz_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient_quiz.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    answers: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    time_spent_minutes: Mapped[int] = mapped_column(Integer, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    incorrect_count: Mapped[int] = mapped_column(Integer, default=0)


class HealthLiteracyScore(Base):
    """Patient health literacy assessment."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    assessment_tool: Mapped[str] = mapped_column(String(50), nullable=False)
    assessment_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_score: Mapped[float] = mapped_column(Float, default=0.0)
    literacy_level: Mapped[str] = mapped_column(String(20), default="adequate")
    numeracy_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    reading_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    preferred_format: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    language_preference: Mapped[str] = mapped_column(String(10), default="en")
    interpretation_needed: Mapped[bool] = mapped_column(Boolean, default=False)
    accommodation_needs: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class TrainingModule(Base):
    """Provider/staff training module."""
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    content_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    mandatory: Mapped[bool] = mapped_column(Boolean, default=False)
    recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_months: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    passing_score: Mapped[float] = mapped_column(Float, default=80.0)
    cme_credits: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    accreditation_body: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    objectives: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    prerequisites: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    assessment: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class TrainingCompletion(Base):
    """Staff training completion record."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    module_id: Mapped[str] = mapped_column(String(36), ForeignKey("training_module.id"), nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    attempts: Mapped[int] = mapped_column(Integer, default=1)
    certificate_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    renewal_reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)


class CertificationRecord(Base):
    """Professional certification tracking."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    certification_name: Mapped[str] = mapped_column(String(300), nullable=False)
    issuing_body: Mapped[str] = mapped_column(String(200), nullable=False)
    certification_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    specialty: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    issue_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    cme_required: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cme_completed: Mapped[float] = mapped_column(Float, default=0.0)
    document_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    verification_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    renewal_reminder_days: Mapped[int] = mapped_column(Integer, default=90)


class LearningPath(Base):
    """Curated learning path for patients or staff."""
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_audience: Mapped[str] = mapped_column(String(30), default="patient")
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    modules: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    estimated_hours: Mapped[float] = mapped_column(Float, default=0.0)
    difficulty: Mapped[str] = mapped_column(String(20), default="beginner")
    enrollment_count: Mapped[int] = mapped_column(Integer, default=0)
    completion_count: Mapped[int] = mapped_column(Integer, default=0)
    average_rating: Mapped[float] = mapped_column(Float, default=0.0)
    certificate_offered: Mapped[bool] = mapped_column(Boolean, default=False)
    badge_reward_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
