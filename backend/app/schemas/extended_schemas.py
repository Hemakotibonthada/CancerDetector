"""
Extended Backend Schemas - CancerGuard AI
Pydantic v2 schemas for all medical entities.
"""

from datetime import datetime, date, time as time_type
from typing import Any, Dict, List, Optional, Union
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, validator, ConfigDict


# ============================================================================
# COMMON ENUMS
# ============================================================================
class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class StatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"


class SeverityEnum(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


class BloodTypeEnum(str, Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"


# ============================================================================
# APPOINTMENT SCHEMAS
# ============================================================================
class AppointmentType(str, Enum):
    IN_PERSON = "in_person"
    VIDEO = "video"
    PHONE = "phone"
    FOLLOW_UP = "follow_up"
    EMERGENCY = "emergency"
    SCREENING = "screening"
    CONSULTATION = "consultation"
    LAB_WORK = "lab_work"


class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    hospital_id: Optional[int] = None
    appointment_type: AppointmentType = AppointmentType.IN_PERSON
    scheduled_date: datetime
    duration_minutes: int = Field(default=30, ge=10, le=240)
    reason: Optional[str] = None
    notes: Optional[str] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    appointment_type: Optional[AppointmentType] = None
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(default=None, ge=10, le=240)
    status: Optional[AppointmentStatus] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: AppointmentStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None


# ============================================================================
# MEDICATION SCHEMAS
# ============================================================================
class MedicationFrequency(str, Enum):
    ONCE_DAILY = "once_daily"
    TWICE_DAILY = "twice_daily"
    THREE_TIMES_DAILY = "three_times_daily"
    FOUR_TIMES_DAILY = "four_times_daily"
    EVERY_4_HOURS = "every_4_hours"
    EVERY_6_HOURS = "every_6_hours"
    EVERY_8_HOURS = "every_8_hours"
    EVERY_12_HOURS = "every_12_hours"
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    MONTHLY = "monthly"
    AS_NEEDED = "as_needed"


class MedicationBase(BaseModel):
    patient_id: int
    name: str = Field(..., min_length=1, max_length=200)
    generic_name: Optional[str] = None
    dosage: str = Field(..., min_length=1, max_length=100)
    dosage_unit: str = Field(default="mg", max_length=20)
    frequency: MedicationFrequency = MedicationFrequency.ONCE_DAILY
    route: str = Field(default="oral", max_length=50)
    start_date: date
    end_date: Optional[date] = None
    prescribed_by: Optional[int] = None
    reason: Optional[str] = None
    instructions: Optional[str] = None
    side_effects: Optional[List[str]] = None
    is_active: bool = True
    refills_remaining: int = Field(default=0, ge=0)


class MedicationCreate(MedicationBase):
    pass


class MedicationUpdate(BaseModel):
    dosage: Optional[str] = None
    frequency: Optional[MedicationFrequency] = None
    end_date: Optional[date] = None
    instructions: Optional[str] = None
    is_active: Optional[bool] = None
    refills_remaining: Optional[int] = Field(default=None, ge=0)


class MedicationResponse(MedicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    prescribed_by_name: Optional[str] = None


# ============================================================================
# VITAL SIGNS SCHEMAS
# ============================================================================
class VitalSignsBase(BaseModel):
    patient_id: int
    heart_rate: Optional[float] = Field(default=None, ge=20, le=300)
    systolic_bp: Optional[float] = Field(default=None, ge=40, le=300)
    diastolic_bp: Optional[float] = Field(default=None, ge=20, le=200)
    temperature: Optional[float] = Field(default=None, ge=85, le=115)
    temperature_unit: str = Field(default="F", pattern="^[FC]$")
    spo2: Optional[float] = Field(default=None, ge=50, le=100)
    respiratory_rate: Optional[float] = Field(default=None, ge=4, le=60)
    blood_glucose: Optional[float] = Field(default=None, ge=10, le=700)
    weight: Optional[float] = Field(default=None, ge=0.5, le=700)
    weight_unit: str = Field(default="kg", pattern="^(kg|lbs)$")
    height: Optional[float] = Field(default=None, ge=20, le=300)
    height_unit: str = Field(default="cm", pattern="^(cm|in)$")
    bmi: Optional[float] = Field(default=None, ge=5, le=100)
    pain_level: Optional[int] = Field(default=None, ge=0, le=10)
    notes: Optional[str] = None
    measured_at: Optional[datetime] = None
    measured_by: Optional[int] = None
    device_id: Optional[str] = None
    source: str = Field(default="manual", pattern="^(manual|device|wearable|smartwatch)$")


class VitalSignsCreate(VitalSignsBase):
    pass


class VitalSignsBatchCreate(BaseModel):
    vitals: List[VitalSignsCreate]


class VitalSignsResponse(VitalSignsBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    is_abnormal: Optional[bool] = None
    alerts: Optional[List[Dict[str, Any]]] = None


class VitalSignsTrend(BaseModel):
    vital_type: str
    values: List[float]
    timestamps: List[datetime]
    average: float
    min_value: float
    max_value: float
    trend_direction: str  # "increasing", "decreasing", "stable"


# ============================================================================
# NOTIFICATION SCHEMAS
# ============================================================================
class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    ALERT = "alert"
    REMINDER = "reminder"
    MESSAGE = "message"
    SYSTEM = "system"


class NotificationBase(BaseModel):
    user_id: int
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)
    notification_type: NotificationType = NotificationType.INFO
    priority: PriorityEnum = PriorityEnum.MEDIUM
    action_url: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime


class NotificationPreferences(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    push_enabled: bool = True
    in_app_enabled: bool = True
    quiet_hours_start: Optional[time_type] = None
    quiet_hours_end: Optional[time_type] = None
    categories: Optional[Dict[str, bool]] = None


# ============================================================================
# LAB RESULT SCHEMAS
# ============================================================================
class LabResultStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    ABNORMAL = "abnormal"


class LabResultBase(BaseModel):
    patient_id: int
    test_name: str = Field(..., min_length=1, max_length=200)
    test_code: Optional[str] = None
    category: Optional[str] = None
    value: Optional[str] = None
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    reference_min: Optional[float] = None
    reference_max: Optional[float] = None
    reference_range: Optional[str] = None
    is_abnormal: bool = False
    notes: Optional[str] = None
    ordered_by: Optional[int] = None
    performed_at: Optional[datetime] = None
    lab_name: Optional[str] = None
    specimen_type: Optional[str] = None


class LabResultCreate(LabResultBase):
    pass


class LabResultResponse(LabResultBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: LabResultStatus = LabResultStatus.PENDING
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None


class LabResultPanel(BaseModel):
    panel_name: str
    results: List[LabResultResponse]
    overall_status: str
    notes: Optional[str] = None


# ============================================================================
# MEDICAL IMAGE SCHEMAS
# ============================================================================
class ImageType(str, Enum):
    XRAY = "xray"
    CT_SCAN = "ct_scan"
    MRI = "mri"
    ULTRASOUND = "ultrasound"
    MAMMOGRAM = "mammogram"
    PET_SCAN = "pet_scan"
    ENDOSCOPY = "endoscopy"
    PATHOLOGY = "pathology"
    DERMATOLOGY = "dermatology"
    OTHER = "other"


class MedicalImageBase(BaseModel):
    patient_id: int
    image_type: ImageType
    body_part: Optional[str] = None
    description: Optional[str] = None
    file_path: str
    file_size: Optional[int] = None
    modality: Optional[str] = None
    acquisition_date: Optional[datetime] = None
    clinical_indication: Optional[str] = None
    ordered_by: Optional[int] = None
    hospital_id: Optional[int] = None


class MedicalImageCreate(MedicalImageBase):
    pass


class MedicalImageResponse(MedicalImageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    analysis_status: Optional[str] = None
    ai_findings: Optional[Dict[str, Any]] = None
    radiologist_report: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None


class ImageAnalysisResult(BaseModel):
    image_id: int
    model_name: str
    model_version: str
    predictions: List[Dict[str, Any]]
    confidence: float
    processing_time_ms: float
    annotations: Optional[List[Dict[str, Any]]] = None
    heatmap_path: Optional[str] = None
    report: Optional[str] = None


# ============================================================================
# GENOMICS SCHEMAS
# ============================================================================
class GenomicTestType(str, Enum):
    WHOLE_GENOME = "whole_genome"
    WHOLE_EXOME = "whole_exome"
    TARGETED_PANEL = "targeted_panel"
    PHARMACOGENOMICS = "pharmacogenomics"
    HEREDITARY_CANCER = "hereditary_cancer"
    TUMOR_PROFILING = "tumor_profiling"
    CARRIER_SCREENING = "carrier_screening"


class GenomicDataBase(BaseModel):
    patient_id: int
    test_type: GenomicTestType
    lab_name: Optional[str] = None
    panel_name: Optional[str] = None
    ordered_by: Optional[int] = None
    sample_type: Optional[str] = None
    sample_date: Optional[datetime] = None


class GenomicDataCreate(GenomicDataBase):
    pass


class GenomicVariant(BaseModel):
    gene: str
    variant: str
    classification: str  # pathogenic, likely_pathogenic, vus, likely_benign, benign
    zygosity: Optional[str] = None  # heterozygous, homozygous
    allele_frequency: Optional[float] = None
    clinical_significance: Optional[str] = None
    associated_conditions: Optional[List[str]] = None
    drug_interactions: Optional[List[str]] = None


class GenomicDataResponse(GenomicDataBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str = "pending"
    variants: Optional[List[GenomicVariant]] = None
    risk_score: Optional[float] = None
    report_path: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


# ============================================================================
# BILLING SCHEMAS
# ============================================================================
class BillingStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    DENIED = "denied"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentMethod(str, Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    INSURANCE = "insurance"
    BANK_TRANSFER = "bank_transfer"
    UPI = "upi"
    CHECK = "check"


class BillingItemBase(BaseModel):
    description: str
    code: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(..., ge=0)
    discount: float = Field(default=0, ge=0, le=100)
    tax_rate: float = Field(default=0, ge=0, le=100)


class BillingBase(BaseModel):
    patient_id: int
    hospital_id: Optional[int] = None
    appointment_id: Optional[int] = None
    items: List[BillingItemBase]
    notes: Optional[str] = None
    due_date: Optional[date] = None
    insurance_claim_id: Optional[str] = None
    insurance_coverage: float = Field(default=0, ge=0, le=100)


class BillingCreate(BillingBase):
    pass


class BillingResponse(BillingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    status: BillingStatus = BillingStatus.PENDING
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    paid_amount: float = 0
    balance_due: float
    created_at: datetime
    paid_at: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None


class PaymentCreate(BaseModel):
    billing_id: int
    amount: float = Field(..., gt=0)
    payment_method: PaymentMethod
    transaction_id: Optional[str] = None
    notes: Optional[str] = None


# ============================================================================
# TELEHEALTH SCHEMAS
# ============================================================================
class TelehealthSessionType(str, Enum):
    VIDEO_CALL = "video_call"
    AUDIO_CALL = "audio_call"
    CHAT = "chat"
    SCREEN_SHARE = "screen_share"


class TelehealthBase(BaseModel):
    appointment_id: int
    patient_id: int
    doctor_id: int
    session_type: TelehealthSessionType = TelehealthSessionType.VIDEO_CALL
    platform: str = Field(default="internal", max_length=50)
    scheduled_duration: int = Field(default=30, ge=5, le=120)
    notes: Optional[str] = None


class TelehealthCreate(TelehealthBase):
    pass


class TelehealthResponse(TelehealthBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: str
    join_url: Optional[str] = None
    status: str = "scheduled"
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    actual_duration: Optional[int] = None
    recording_url: Optional[str] = None
    prescription_generated: bool = False
    follow_up_needed: bool = False
    created_at: datetime


# ============================================================================
# EMERGENCY SCHEMAS
# ============================================================================
class EmergencyTriageLevel(str, Enum):
    RESUSCITATION = "resuscitation"
    EMERGENT = "emergent"
    URGENT = "urgent"
    LESS_URGENT = "less_urgent"
    NON_URGENT = "non_urgent"


class EmergencyBase(BaseModel):
    patient_id: Optional[int] = None
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    triage_level: EmergencyTriageLevel
    chief_complaint: str = Field(..., min_length=1, max_length=500)
    symptoms: Optional[List[str]] = None
    vital_signs: Optional[Dict[str, Any]] = None
    arrival_mode: str = Field(default="walk_in", max_length=50)
    hospital_id: Optional[int] = None
    assigned_doctor: Optional[int] = None
    notes: Optional[str] = None


class EmergencyCreate(EmergencyBase):
    pass


class EmergencyResponse(EmergencyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_number: str
    status: str = "active"
    bed_number: Optional[str] = None
    admitted_at: datetime
    discharged_at: Optional[datetime] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    total_cost: Optional[float] = None


# ============================================================================
# CLINICAL DECISION SCHEMAS
# ============================================================================
class ClinicalDecisionBase(BaseModel):
    patient_id: int
    doctor_id: int
    decision_type: str  # diagnosis, treatment, referral, screening
    symptoms: Optional[List[str]] = None
    lab_results: Optional[List[Dict[str, Any]]] = None
    imaging_results: Optional[List[Dict[str, Any]]] = None
    patient_history: Optional[Dict[str, Any]] = None
    clinical_notes: Optional[str] = None


class ClinicalDecisionCreate(ClinicalDecisionBase):
    pass


class ClinicalDecisionResponse(ClinicalDecisionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ai_recommendations: Optional[List[Dict[str, Any]]] = None
    differential_diagnoses: Optional[List[Dict[str, Any]]] = None
    treatment_options: Optional[List[Dict[str, Any]]] = None
    risk_factors: Optional[List[str]] = None
    evidence_references: Optional[List[str]] = None
    confidence_score: Optional[float] = None
    doctor_decision: Optional[str] = None
    doctor_notes: Optional[str] = None
    created_at: datetime
    decided_at: Optional[datetime] = None


# ============================================================================
# REHABILITATION SCHEMAS
# ============================================================================
class RehabilitationBase(BaseModel):
    patient_id: int
    program_type: str  # physical, occupational, speech, cardiac, pulmonary
    condition: str
    goals: Optional[List[str]] = None
    prescribed_by: Optional[int] = None
    therapist_id: Optional[int] = None
    start_date: date
    estimated_end_date: Optional[date] = None
    sessions_per_week: int = Field(default=3, ge=1, le=7)
    session_duration: int = Field(default=60, ge=15, le=120)
    notes: Optional[str] = None


class RehabilitationCreate(RehabilitationBase):
    pass


class RehabilitationSession(BaseModel):
    program_id: int
    session_number: int
    session_date: datetime
    exercises: List[Dict[str, Any]]
    pain_level: Optional[int] = Field(default=None, ge=0, le=10)
    mobility_score: Optional[float] = Field(default=None, ge=0, le=100)
    progress_notes: Optional[str] = None
    therapist_notes: Optional[str] = None


class RehabilitationResponse(RehabilitationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str = "active"
    progress_percentage: float = 0
    total_sessions: int = 0
    completed_sessions: int = 0
    latest_assessment: Optional[Dict[str, Any]] = None
    created_at: datetime


# ============================================================================
# NUTRITION SCHEMAS
# ============================================================================
class NutritionPlanBase(BaseModel):
    patient_id: int
    plan_type: str  # weight_loss, muscle_gain, diabetic, cardiac, oncology
    daily_calories: int = Field(default=2000, ge=800, le=5000)
    macros: Optional[Dict[str, float]] = None  # protein, carbs, fat
    restrictions: Optional[List[str]] = None  # vegetarian, vegan, gluten-free, etc.
    allergies: Optional[List[str]] = None
    notes: Optional[str] = None
    created_by: Optional[int] = None
    start_date: date
    end_date: Optional[date] = None


class NutritionPlanCreate(NutritionPlanBase):
    pass


class MealEntry(BaseModel):
    plan_id: int
    meal_type: str  # breakfast, lunch, dinner, snack
    foods: List[Dict[str, Any]]
    total_calories: Optional[float] = None
    total_protein: Optional[float] = None
    total_carbs: Optional[float] = None
    total_fat: Optional[float] = None
    meal_time: Optional[datetime] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


class NutritionPlanResponse(NutritionPlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str = "active"
    adherence_score: float = 0
    meals_logged: int = 0
    created_at: datetime


# ============================================================================
# MENTAL HEALTH SCHEMAS
# ============================================================================
class MentalHealthAssessmentType(str, Enum):
    PHQ9 = "phq9"
    GAD7 = "gad7"
    PSS = "pss"
    BECK_DEPRESSION = "beck_depression"
    PTSD_CHECKLIST = "ptsd_checklist"
    MOOD_TRACKING = "mood_tracking"
    GENERAL = "general"


class MentalHealthBase(BaseModel):
    patient_id: int
    assessment_type: MentalHealthAssessmentType
    therapist_id: Optional[int] = None
    responses: Optional[Dict[str, Any]] = None
    total_score: Optional[float] = None
    severity_level: Optional[str] = None
    mood: Optional[str] = None  # happy, sad, anxious, neutral, angry, etc.
    sleep_quality: Optional[int] = Field(default=None, ge=1, le=10)
    stress_level: Optional[int] = Field(default=None, ge=1, le=10)
    notes: Optional[str] = None


class MentalHealthCreate(MentalHealthBase):
    pass


class MentalHealthResponse(MentalHealthBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    interpretation: Optional[str] = None
    recommendations: Optional[List[str]] = None
    follow_up_date: Optional[date] = None
    created_at: datetime


class TherapySession(BaseModel):
    patient_id: int
    therapist_id: int
    session_type: str  # cbt, dbt, psychodynamic, group, family
    session_date: datetime
    duration_minutes: int = Field(default=50, ge=15, le=120)
    mood_before: Optional[int] = Field(default=None, ge=1, le=10)
    mood_after: Optional[int] = Field(default=None, ge=1, le=10)
    topics_discussed: Optional[List[str]] = None
    homework: Optional[str] = None
    progress_notes: Optional[str] = None


# ============================================================================
# PATHOLOGY SCHEMAS
# ============================================================================
class PathologySpecimenType(str, Enum):
    BIOPSY = "biopsy"
    SURGICAL = "surgical"
    CYTOLOGY = "cytology"
    BONE_MARROW = "bone_marrow"
    AUTOPSY = "autopsy"
    FROZEN_SECTION = "frozen_section"


class PathologyBase(BaseModel):
    patient_id: int
    specimen_type: PathologySpecimenType
    body_site: str
    clinical_history: Optional[str] = None
    clinical_diagnosis: Optional[str] = None
    gross_description: Optional[str] = None
    microscopic_description: Optional[str] = None
    ordered_by: Optional[int] = None
    pathologist_id: Optional[int] = None
    specimen_date: Optional[datetime] = None


class PathologyCreate(PathologyBase):
    pass


class PathologyResponse(PathologyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    accession_number: str
    status: str = "pending"
    diagnosis: Optional[str] = None
    histological_type: Optional[str] = None
    grade: Optional[str] = None
    stage: Optional[str] = None
    margins: Optional[str] = None
    immunohistochemistry: Optional[Dict[str, Any]] = None
    molecular_results: Optional[Dict[str, Any]] = None
    synoptic_report: Optional[Dict[str, Any]] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime
    reported_at: Optional[datetime] = None


# ============================================================================
# CLINICAL TRIALS SCHEMAS
# ============================================================================
class TrialPhase(str, Enum):
    PHASE_1 = "phase_1"
    PHASE_2 = "phase_2"
    PHASE_3 = "phase_3"
    PHASE_4 = "phase_4"
    OBSERVATIONAL = "observational"


class ClinicalTrialBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    protocol_number: Optional[str] = None
    phase: TrialPhase
    disease_area: str
    description: Optional[str] = None
    principal_investigator: Optional[str] = None
    sponsor: Optional[str] = None
    start_date: Optional[date] = None
    estimated_end_date: Optional[date] = None
    target_enrollment: int = Field(default=100, ge=1)
    eligibility_criteria: Optional[Dict[str, Any]] = None
    endpoints: Optional[Dict[str, Any]] = None
    hospital_ids: Optional[List[int]] = None


class ClinicalTrialCreate(ClinicalTrialBase):
    pass


class ClinicalTrialResponse(ClinicalTrialBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trial_id: str
    status: str = "recruiting"
    current_enrollment: int = 0
    sites: Optional[List[Dict[str, Any]]] = None
    results_summary: Optional[Dict[str, Any]] = None
    created_at: datetime


class TrialEnrollment(BaseModel):
    trial_id: int
    patient_id: int
    consent_date: date
    arm: Optional[str] = None
    notes: Optional[str] = None


# ============================================================================
# SUPPLY CHAIN SCHEMAS
# ============================================================================
class SupplyCategory(str, Enum):
    MEDICATION = "medication"
    MEDICAL_DEVICE = "medical_device"
    SURGICAL_SUPPLY = "surgical_supply"
    LAB_SUPPLY = "lab_supply"
    PPE = "ppe"
    OFFICE_SUPPLY = "office_supply"
    BLOOD_PRODUCT = "blood_product"


class SupplyItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    sku: Optional[str] = None
    category: SupplyCategory
    description: Optional[str] = None
    unit: str = Field(default="each", max_length=20)
    unit_cost: float = Field(..., ge=0)
    current_stock: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=10, ge=0)
    maximum_stock: int = Field(default=1000, ge=0)
    reorder_point: int = Field(default=20, ge=0)
    supplier: Optional[str] = None
    hospital_id: Optional[int] = None
    expiry_date: Optional[date] = None
    storage_location: Optional[str] = None
    is_critical: bool = False


class SupplyItemCreate(SupplyItemBase):
    pass


class SupplyItemResponse(SupplyItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str  # in_stock, low_stock, out_of_stock, expired
    last_restocked: Optional[datetime] = None
    created_at: datetime


class SupplyOrderCreate(BaseModel):
    items: List[Dict[str, Any]]  # [{item_id, quantity}]
    supplier: str
    expected_delivery: Optional[date] = None
    priority: PriorityEnum = PriorityEnum.MEDIUM
    notes: Optional[str] = None


# ============================================================================
# QUALITY & SAFETY SCHEMAS
# ============================================================================
class IncidentType(str, Enum):
    MEDICATION_ERROR = "medication_error"
    FALL = "fall"
    SURGICAL_COMPLICATION = "surgical_complication"
    DIAGNOSTIC_ERROR = "diagnostic_error"
    INFECTION = "infection"
    EQUIPMENT_FAILURE = "equipment_failure"
    NEAR_MISS = "near_miss"
    ADVERSE_REACTION = "adverse_reaction"
    OTHER = "other"


class QualityIncidentBase(BaseModel):
    incident_type: IncidentType
    severity: SeverityEnum
    description: str = Field(..., min_length=10, max_length=5000)
    patient_id: Optional[int] = None
    reported_by: int
    department: Optional[str] = None
    hospital_id: Optional[int] = None
    occurred_at: datetime
    location: Optional[str] = None
    witnesses: Optional[List[str]] = None
    immediate_actions: Optional[str] = None


class QualityIncidentCreate(QualityIncidentBase):
    pass


class QualityIncidentResponse(QualityIncidentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_number: str
    status: str = "reported"
    root_cause: Optional[str] = None
    corrective_actions: Optional[List[str]] = None
    preventive_actions: Optional[List[str]] = None
    investigation_findings: Optional[str] = None
    follow_up_date: Optional[date] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime


class QualityMetric(BaseModel):
    metric_name: str
    value: float
    target: float
    unit: Optional[str] = None
    period: str  # daily, weekly, monthly, quarterly
    department: Optional[str] = None
    trend: Optional[str] = None  # up, down, stable


# ============================================================================
# WEARABLE DEVICE SCHEMAS
# ============================================================================
class WearableDeviceType(str, Enum):
    SMARTWATCH = "smartwatch"
    FITNESS_TRACKER = "fitness_tracker"
    CONTINUOUS_GLUCOSE = "continuous_glucose"
    BLOOD_PRESSURE = "blood_pressure"
    PULSE_OXIMETER = "pulse_oximeter"
    ECG_MONITOR = "ecg_monitor"
    SLEEP_TRACKER = "sleep_tracker"
    SMART_SCALE = "smart_scale"


class WearableDeviceBase(BaseModel):
    patient_id: int
    device_type: WearableDeviceType
    device_name: str = Field(..., max_length=100)
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    firmware_version: Optional[str] = None
    sync_frequency: int = Field(default=60, ge=1)  # seconds


class WearableDeviceCreate(WearableDeviceBase):
    pass


class WearableDeviceResponse(WearableDeviceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str = "active"
    last_synced: Optional[datetime] = None
    battery_level: Optional[int] = None
    data_points_collected: int = 0
    created_at: datetime


class WearableDataPoint(BaseModel):
    device_id: int
    metric_type: str  # heart_rate, steps, sleep, calories, etc.
    value: float
    unit: Optional[str] = None
    measured_at: datetime
    metadata: Optional[Dict[str, Any]] = None


class WearableDailySummary(BaseModel):
    device_id: int
    date: date
    steps: Optional[int] = None
    calories_burned: Optional[float] = None
    active_minutes: Optional[int] = None
    distance: Optional[float] = None
    sleep_duration: Optional[float] = None
    sleep_quality: Optional[float] = None
    avg_heart_rate: Optional[float] = None
    resting_heart_rate: Optional[float] = None
    max_heart_rate: Optional[float] = None
    hrv: Optional[float] = None
    stress_level: Optional[float] = None
    blood_oxygen: Optional[float] = None


# ============================================================================
# EDUCATION SCHEMAS
# ============================================================================
class EducationContentType(str, Enum):
    ARTICLE = "article"
    VIDEO = "video"
    INFOGRAPHIC = "infographic"
    QUIZ = "quiz"
    COURSE = "course"
    FAQ = "faq"
    GUIDE = "guide"
    WEBINAR = "webinar"


class EducationContentBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=300)
    content_type: EducationContentType
    category: str
    description: Optional[str] = None
    content: str
    author: Optional[str] = None
    tags: Optional[List[str]] = None
    target_audience: Optional[List[str]] = None
    reading_time_minutes: Optional[int] = None
    difficulty_level: Optional[str] = None  # beginner, intermediate, advanced
    language: str = "en"
    is_published: bool = False


class EducationContentCreate(EducationContentBase):
    pass


class EducationContentResponse(EducationContentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    views: int = 0
    likes: int = 0
    rating: Optional[float] = None
    created_at: datetime
    published_at: Optional[datetime] = None


# ============================================================================
# SOCIAL DETERMINANTS SCHEMAS
# ============================================================================
class SocialDeterminantsBase(BaseModel):
    patient_id: int
    housing_status: Optional[str] = None  # owned, rented, homeless, shelter, etc.
    housing_quality: Optional[str] = None
    employment_status: Optional[str] = None  # employed, unemployed, retired, student, disabled
    annual_income: Optional[float] = None
    insurance_status: Optional[str] = None
    education_level: Optional[str] = None
    food_security: Optional[str] = None  # secure, low, very_low
    transportation_access: Optional[bool] = None
    social_support: Optional[str] = None  # strong, moderate, limited, none
    language_barriers: Optional[bool] = None
    primary_language: Optional[str] = None
    digital_literacy: Optional[str] = None
    environmental_exposures: Optional[List[str]] = None
    community_resources: Optional[List[str]] = None
    notes: Optional[str] = None
    assessed_at: Optional[datetime] = None


class SocialDeterminantsCreate(SocialDeterminantsBase):
    pass


class SocialDeterminantsResponse(SocialDeterminantsBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    risk_score: Optional[float] = None
    interventions: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# ============================================================================
# WORKFORCE SCHEMAS
# ============================================================================
class StaffRole(str, Enum):
    DOCTOR = "doctor"
    NURSE = "nurse"
    SURGEON = "surgeon"
    PHARMACIST = "pharmacist"
    TECHNICIAN = "technician"
    THERAPIST = "therapist"
    ADMINISTRATOR = "administrator"
    RECEPTIONIST = "receptionist"
    LAB_TECHNICIAN = "lab_technician"
    RADIOLOGIST = "radiologist"


class StaffShift(str, Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    NIGHT = "night"
    ON_CALL = "on_call"
    OFF = "off"


class StaffScheduleBase(BaseModel):
    staff_id: int
    hospital_id: int
    department: Optional[str] = None
    shift: StaffShift
    date: date
    start_time: time_type
    end_time: time_type
    notes: Optional[str] = None
    is_overtime: bool = False


class StaffScheduleCreate(StaffScheduleBase):
    pass


class StaffScheduleResponse(StaffScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    staff_name: Optional[str] = None
    status: str = "scheduled"
    actual_start: Optional[time_type] = None
    actual_end: Optional[time_type] = None
    created_at: datetime


class WorkforceMetrics(BaseModel):
    total_staff: int
    active_staff: int
    on_duty: int
    on_leave: int
    overtime_hours: float
    vacancy_rate: float
    turnover_rate: float
    satisfaction_score: Optional[float] = None
    department_breakdown: Dict[str, int]


# ============================================================================
# COMMUNICATION SCHEMAS
# ============================================================================
class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    VOICE = "voice"
    VIDEO = "video"
    SYSTEM = "system"


class ConversationBase(BaseModel):
    participants: List[int]
    subject: Optional[str] = None
    is_group: bool = False
    metadata: Optional[Dict[str, Any]] = None


class ConversationCreate(ConversationBase):
    pass


class ConversationResponse(ConversationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    last_message_at: Optional[datetime] = None
    unread_count: Optional[int] = None


class MessageBase(BaseModel):
    conversation_id: int
    sender_id: int
    message_type: MessageType = MessageType.TEXT
    content: str
    attachments: Optional[List[Dict[str, Any]]] = None


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    read_by: Optional[List[int]] = None
    created_at: datetime
    edited_at: Optional[datetime] = None
    sender_name: Optional[str] = None


# ============================================================================
# RESEARCH SCHEMAS
# ============================================================================
class ResearchStudyBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    abstract: Optional[str] = None
    study_type: str  # retrospective, prospective, cohort, case_control, cross_sectional
    disease_area: str
    principal_investigator_id: Optional[int] = None
    co_investigators: Optional[List[int]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    population_size: Optional[int] = None
    methodology: Optional[str] = None
    data_sources: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    hospital_ids: Optional[List[int]] = None
    ethics_approval: Optional[str] = None


class ResearchStudyCreate(ResearchStudyBase):
    pass


class ResearchStudyResponse(ResearchStudyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str = "draft"
    publications: Optional[List[Dict[str, Any]]] = None
    findings: Optional[Dict[str, Any]] = None
    created_at: datetime


# ============================================================================
# BLOOD DONOR SCHEMAS
# ============================================================================
class BloodDonorBase(BaseModel):
    user_id: Optional[int] = None
    name: str = Field(..., min_length=2, max_length=100)
    blood_type: BloodTypeEnum
    date_of_birth: date
    gender: GenderEnum
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    weight: Optional[float] = Field(default=None, ge=45)
    is_eligible: bool = True
    last_donation_date: Optional[date] = None
    total_donations: int = Field(default=0, ge=0)
    medical_conditions: Optional[List[str]] = None
    preferred_donation_center: Optional[str] = None


class BloodDonorCreate(BloodDonorBase):
    pass


class BloodDonorResponse(BloodDonorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    donor_id: str
    next_eligible_date: Optional[date] = None
    badges: Optional[List[str]] = None
    created_at: datetime


class DonationRecord(BaseModel):
    donor_id: int
    donation_type: str  # whole_blood, platelets, plasma, red_cells
    volume_ml: int = Field(default=450, ge=100, le=1000)
    donation_center: Optional[str] = None
    donation_date: datetime
    hemoglobin_level: Optional[float] = None
    blood_pressure: Optional[str] = None
    screening_results: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


# ============================================================================
# DOCUMENT SCHEMAS
# ============================================================================
class DocumentType(str, Enum):
    MEDICAL_REPORT = "medical_report"
    LAB_REPORT = "lab_report"
    PRESCRIPTION = "prescription"
    IMAGING_REPORT = "imaging_report"
    DISCHARGE_SUMMARY = "discharge_summary"
    CONSENT_FORM = "consent_form"
    INSURANCE_FORM = "insurance_form"
    REFERRAL_LETTER = "referral_letter"
    VACCINATION_RECORD = "vaccination_record"
    OTHER = "other"


class DocumentBase(BaseModel):
    patient_id: int
    document_type: DocumentType
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by: Optional[int] = None
    tags: Optional[List[str]] = None
    is_confidential: bool = False


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str = "uploaded"
    ocr_text: Optional[str] = None
    ai_summary: Optional[str] = None
    download_count: int = 0
    created_at: datetime


# ============================================================================
# INSURANCE SCHEMAS
# ============================================================================
class InsuranceBase(BaseModel):
    patient_id: int
    provider: str = Field(..., min_length=1, max_length=200)
    policy_number: str = Field(..., min_length=1, max_length=100)
    group_number: Optional[str] = None
    plan_type: Optional[str] = None  # hmo, ppo, epo, pos, hdhp
    coverage_start: date
    coverage_end: Optional[date] = None
    subscriber_name: Optional[str] = None
    subscriber_relationship: Optional[str] = None
    copay: Optional[float] = None
    deductible: Optional[float] = None
    out_of_pocket_max: Optional[float] = None
    is_primary: bool = True


class InsuranceCreate(InsuranceBase):
    pass


class InsuranceResponse(InsuranceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str = "active"
    verified: bool = False
    verification_date: Optional[datetime] = None
    claims_submitted: int = 0
    total_paid: float = 0
    created_at: datetime


# ============================================================================
# POPULATION HEALTH SCHEMAS
# ============================================================================
class PopulationHealthMetric(BaseModel):
    metric_name: str
    value: float
    population_size: int
    region: Optional[str] = None
    age_group: Optional[str] = None
    gender: Optional[str] = None
    period: str
    comparison_value: Optional[float] = None
    trend: Optional[str] = None


class DiseasePrevalence(BaseModel):
    disease: str
    prevalence_rate: float
    incidence_rate: Optional[float] = None
    mortality_rate: Optional[float] = None
    region: Optional[str] = None
    age_group: Optional[str] = None
    period: str
    data_source: Optional[str] = None


class PublicHealthAlert(BaseModel):
    title: str
    description: str
    alert_type: str  # outbreak, advisory, warning, emergency
    severity: SeverityEnum
    disease: Optional[str] = None
    affected_regions: Optional[List[str]] = None
    recommended_actions: Optional[List[str]] = None
    issued_at: datetime
    expires_at: Optional[datetime] = None


# ============================================================================
# RADIOLOGY SCHEMAS
# ============================================================================
class RadiologyStudyType(str, Enum):
    XRAY = "xray"
    CT = "ct"
    MRI = "mri"
    ULTRASOUND = "ultrasound"
    MAMMOGRAPHY = "mammography"
    PET_CT = "pet_ct"
    FLUOROSCOPY = "fluoroscopy"
    NUCLEAR_MEDICINE = "nuclear_medicine"
    INTERVENTIONAL = "interventional"


class RadiologyOrderBase(BaseModel):
    patient_id: int
    study_type: RadiologyStudyType
    body_part: str
    clinical_indication: str
    priority: PriorityEnum = PriorityEnum.MEDIUM
    ordered_by: int
    hospital_id: Optional[int] = None
    notes: Optional[str] = None
    contrast_required: bool = False
    sedation_required: bool = False


class RadiologyOrderCreate(RadiologyOrderBase):
    pass


class RadiologyOrderResponse(RadiologyOrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    accession_number: str
    status: str = "ordered"
    scheduled_at: Optional[datetime] = None
    performed_at: Optional[datetime] = None
    radiologist_id: Optional[int] = None
    report: Optional[str] = None
    findings: Optional[List[Dict[str, Any]]] = None
    impression: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    images: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    reported_at: Optional[datetime] = None


# ============================================================================
# PHARMACY SCHEMAS
# ============================================================================
class PrescriptionStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    DISPENSED = "dispensed"
    PARTIALLY_DISPENSED = "partially_dispensed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PrescriptionBase(BaseModel):
    patient_id: int
    prescribed_by: int
    medications: List[Dict[str, Any]]
    diagnosis: Optional[str] = None
    pharmacy_id: Optional[int] = None
    notes: Optional[str] = None
    is_controlled: bool = False
    valid_until: Optional[date] = None


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionResponse(PrescriptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prescription_number: str
    status: PrescriptionStatus = PrescriptionStatus.PENDING
    drug_interactions: Optional[List[Dict[str, Any]]] = None
    dispensed_by: Optional[int] = None
    dispensed_at: Optional[datetime] = None
    created_at: datetime


class DrugInteractionCheck(BaseModel):
    medication_ids: List[int]
    patient_id: Optional[int] = None
    include_allergies: bool = True


class DrugInteractionResult(BaseModel):
    interactions: List[Dict[str, Any]]
    severity_summary: Dict[str, int]
    recommendations: List[str]
    safe_alternatives: Optional[List[Dict[str, Any]]] = None


# ============================================================================
# REPORT SCHEMAS
# ============================================================================
class ReportType(str, Enum):
    PATIENT_SUMMARY = "patient_summary"
    DEPARTMENT_ANALYTICS = "department_analytics"
    FINANCIAL = "financial"
    QUALITY = "quality"
    COMPLIANCE = "compliance"
    RESEARCH = "research"
    OPERATIONAL = "operational"
    CUSTOM = "custom"


class ReportBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    report_type: ReportType
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    date_range_start: Optional[date] = None
    date_range_end: Optional[date] = None
    format: str = Field(default="pdf", pattern="^(pdf|csv|xlsx|html|json)$")
    requested_by: int
    hospital_id: Optional[int] = None
    department: Optional[str] = None


class ReportCreate(ReportBase):
    pass


class ReportResponse(ReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str = "pending"
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    generated_at: Optional[datetime] = None
    download_count: int = 0
    created_at: datetime


# ============================================================================
# AUDIT LOG SCHEMAS
# ============================================================================
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool = True
    severity: str = "info"
    timestamp: datetime


class AuditLogQuery(BaseModel):
    user_id: Optional[int] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    severity: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)
