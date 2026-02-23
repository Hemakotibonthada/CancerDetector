"""
Database Models Package
=======================

Exports all database models for the CancerGuard AI platform.
"""

from app.models.user import User, UserRole, UserStatus, UserSession, UserPreference
from app.models.patient import Patient, PatientDemographics, PatientAllergy, PatientFamilyHistory
from app.models.hospital import Hospital, HospitalDepartment, HospitalStaff, Doctor
from app.models.health_record import HealthRecord, HealthRecordType, HealthRecordCategory
from app.models.blood_sample import BloodSample, BloodBiomarker, BloodTestType, BloodTestResult
from app.models.smartwatch_data import (
    SmartwatchData, SmartwatchDevice, HeartRateData, 
    SpO2Data, SleepData, ActivityData, ECGData, StressData,
    TemperatureData, BloodPressureEstimate
)
from app.models.medication import Medication, Prescription, MedicationSchedule, MedicationAdherence
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.cancer_screening import (
    CancerScreening, CancerType, CancerRiskAssessment, 
    CancerPrediction, ScreeningRecommendation, TumorMarker
)
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.models.audit_log import AuditLog, AuditAction
from app.models.vital_signs import VitalSigns, VitalSignType, VitalSignAlert
from app.models.lab_result import LabResult, LabTest, LabTestCategory, LabOrder
from app.models.medical_image import MedicalImage, ImageType, ImageAnalysisResult
from app.models.insurance import Insurance, InsuranceClaim, InsuranceProvider
from app.models.report import (
    EmergencyContact, Device, DeviceType, DeviceStatus,
    Report, ReportType, ReportTemplate,
    Feedback, FeedbackType, FeedbackStatus,
    SystemConfig, FeatureFlag, MaintenanceWindow,
)
from app.models.blood_donor import (
    BloodDonor, BloodRequest, BloodDonorMatch, DonationRecord,
    BloodGroup, DonorStatus, RequestUrgency, RequestStatus,
    MatchStatus, DonationStatus,
)

from app.models.document import Document, InsurancePolicy, UserInsuranceClaim

# New model imports
from app.models.clinical_decision import (
    ClinicalPathway, PatientPathwayEnrollment, DrugInteraction,
    ClinicalGuideline, ClinicalCalculator, ClinicalCalculatorResult,
    ClinicalAlert, OrderSet, BestPracticeAdvisory,
)
from app.models.genomics import (
    GenomicSequence, GeneticVariant, GenePanel, GenomicReport,
    LiquidBiopsy, GeneExpression, PharmacogenomicProfile, HereditaryCancerPanel,
)
from app.models.research import (
    ResearchStudy, ResearchCohort, CohortPatient, ResearchPublication,
    ResearchDataset, IRBSubmission, BiostatisticsAnalysis,
)
from app.models.population_health import (
    DiseaseRegistry, RegistryEntry, ChronicDiseaseProgram, ProgramEnrollment,
    CareGap, HealthEquityMetric, CommunityResource, PublicHealthAlert, HealthScreeningCampaign,
)
from app.models.patient_engagement import (
    GamificationProfile, Badge, UserBadge, HealthChallenge, ChallengeParticipation,
    HealthStreak, PeerSupportGroup, GroupMembership, GroupPost,
    PatientSatisfactionSurvey, PointTransaction, Reward, RewardRedemption,
)
from app.models.communication import (
    SecureMessage, CareTeam, CareTeamMember, Referral,
    ClinicalHandoff, ConsentForm, CareCoordinationTask, CommunicationPreference,
)
from app.models.billing_enhanced import (
    Invoice, PaymentTransaction, InsurancePlan, InsuranceVerification,
    PriorAuthorization, CostEstimate, ChargeCapture, ClaimSubmission,
    DenialManagement, FinancialCounseling,
)
from app.models.quality_safety import (
    AdverseEvent, IncidentReport, QualityMeasure, InfectionControlRecord,
    SafetyChecklist, ChecklistCompletion, RootCauseAnalysis,
    FallRiskAssessment, PressureInjuryAssessment,
)
from app.models.supply_chain import (
    InventoryItem, Vendor, PurchaseOrder, Equipment, MaintenanceRequest, AssetTracking, WasteManagement,
)
from app.models.telehealth import (
    VideoSession, VirtualWaitingRoom, RemoteMonitoringPlan, RemoteMonitoringData,
    EPrescription, TelehealthChat, TelehealthConsent,
)
from app.models.pathology import (
    Specimen, PathologyBlock, PathologySlide, StainingProtocol,
    PathologyReport, TumorBoard, CytologyResult,
)
from app.models.rehabilitation import (
    RehabPlan, TherapySession, FunctionalAssessment, ExercisePrescription,
    ProgressMilestone, DisabilityScore, PainManagementPlan,
)
from app.models.nutrition_enhanced import (
    NutritionAssessment, MealPlan, FoodLog, DietaryRestriction,
    NutritionalSupplement, HydrationLog, WeightManagementProgram, EnteralNutrition,
)
from app.models.mental_health_enhanced import (
    CBTSession, MindfulnessExercise, MindfulnessSession, CrisisIntervention,
    SafetyPlan, SubstanceUseLog, BehavioralGoal, MentalHealthScreening, GroupTherapySession,
)
from app.models.clinical_trials_v2 import (
    TrialProtocol, TrialSite, TrialParticipant, TrialVisit,
    TrialAdverseEvent, ConcomitantMedication, DataCollectionForm, ProtocolDeviation,
)
from app.models.radiology_enhanced import (
    AIReadingResult, TumorMeasurement, RadiationDoseRecord,
    StructuredRadiologyReport, ImagingProtocol, ContrastReaction, ImagingOrderTracking,
)
from app.models.pharmacy_enhanced import (
    FormularyItem, DrugUtilizationReview, MedicationReconciliation,
    CompoundedMedication, ControlledSubstanceLog, ClinicalPharmacyIntervention,
    AntibioticStewardship, AdverseReactionHistory,
)
from app.models.education import (
    EducationResource, PatientEducationAssignment, PatientQuiz, QuizAttempt,
    HealthLiteracyScore, TrainingModule, TrainingCompletion, CertificationRecord, LearningPath,
)
from app.models.social_determinants import (
    SDOHAssessment, SocialRisk, CommunityProgram, ProgramReferral,
    TransportationNeed, FoodInsecurityRecord, HousingAssessment,
)
from app.models.wearable_enhanced import (
    WearableDevice, ContinuousGlucoseReading, GlucoseSummary,
    FallDetectionEvent, MedicationReminder, MedicationDoseLog,
    GaitAnalysis, RespiratoryMonitoring, PainTrackingEntry, SleepAnalysis, VitalSignsStream,
)
from app.models.emergency import (
    TriageAssessment, SepsisScreening, StrokeAssessment,
    CodeEvent, TraumaAssessment, RapidResponseTeam,
)
from app.models.workforce import (
    StaffProfile, ShiftSchedule, LeaveRequest, CredentialingRecord, PerformanceReview, StaffingMetrics,
)

__all__ = [
    # Original models
    "User", "UserRole", "UserStatus", "UserSession", "UserPreference",
    "Patient", "PatientDemographics", "PatientAllergy", "PatientFamilyHistory",
    "Hospital", "HospitalDepartment", "HospitalStaff", "Doctor",
    "HealthRecord", "HealthRecordType", "HealthRecordCategory",
    "BloodSample", "BloodBiomarker", "BloodTestType", "BloodTestResult",
    "SmartwatchData", "SmartwatchDevice", "HeartRateData", "SpO2Data",
    "SleepData", "ActivityData", "ECGData", "StressData",
    "TemperatureData", "BloodPressureEstimate",
    "Medication", "Prescription", "MedicationSchedule", "MedicationAdherence",
    "Appointment", "AppointmentStatus", "AppointmentType",
    "CancerScreening", "CancerType", "CancerRiskAssessment",
    "CancerPrediction", "ScreeningRecommendation", "TumorMarker",
    "Notification", "NotificationType", "NotificationPriority",
    "AuditLog", "AuditAction",
    "VitalSigns", "VitalSignType", "VitalSignAlert",
    "LabResult", "LabTest", "LabTestCategory", "LabOrder",
    "MedicalImage", "ImageType", "ImageAnalysisResult",
    "Insurance", "InsuranceClaim", "InsuranceProvider",
    "EmergencyContact",
    "Device", "DeviceType", "DeviceStatus",
    "Report", "ReportType", "ReportTemplate",
    "Feedback", "FeedbackType", "FeedbackStatus",
    "SystemConfig", "FeatureFlag", "MaintenanceWindow",
    "BloodDonor", "BloodRequest", "BloodDonorMatch", "DonationRecord",
    "BloodGroup", "DonorStatus", "RequestUrgency", "RequestStatus",
    "MatchStatus", "DonationStatus",
    # Clinical Decision Support
    "ClinicalPathway", "PatientPathwayEnrollment", "DrugInteraction",
    "ClinicalGuideline", "ClinicalCalculator", "ClinicalCalculatorResult",
    "ClinicalAlert", "OrderSet", "BestPracticeAdvisory",
    # Genomics
    "GenomicSequence", "GeneticVariant", "GenePanel", "GenomicReport",
    "LiquidBiopsy", "GeneExpression", "PharmacogenomicProfile", "HereditaryCancerPanel",
    # Research
    "ResearchStudy", "ResearchCohort", "CohortPatient", "ResearchPublication",
    "ResearchDataset", "IRBSubmission", "BiostatisticsAnalysis",
    # Population Health
    "DiseaseRegistry", "RegistryEntry", "ChronicDiseaseProgram", "ProgramEnrollment",
    "CareGap", "HealthEquityMetric", "CommunityResource", "PublicHealthAlert", "HealthScreeningCampaign",
    # Patient Engagement
    "GamificationProfile", "Badge", "UserBadge", "HealthChallenge", "ChallengeParticipation",
    "HealthStreak", "PeerSupportGroup", "GroupMembership", "GroupPost",
    "PatientSatisfactionSurvey", "PointTransaction", "Reward", "RewardRedemption",
    # Communication
    "SecureMessage", "CareTeam", "CareTeamMember", "Referral",
    "ClinicalHandoff", "ConsentForm", "CareCoordinationTask", "CommunicationPreference",
    # Billing Enhanced
    "Invoice", "PaymentTransaction", "InsurancePlan", "InsuranceVerification",
    "PriorAuthorization", "CostEstimate", "ChargeCapture", "ClaimSubmission",
    "DenialManagement", "FinancialCounseling",
    # Quality & Safety
    "AdverseEvent", "IncidentReport", "QualityMeasure", "InfectionControlRecord",
    "SafetyChecklist", "ChecklistCompletion", "RootCauseAnalysis",
    "FallRiskAssessment", "PressureInjuryAssessment",
    # Supply Chain
    "InventoryItem", "Vendor", "PurchaseOrder", "Equipment", "MaintenanceRequest", "AssetTracking", "WasteManagement",
    # Telehealth
    "VideoSession", "VirtualWaitingRoom", "RemoteMonitoringPlan", "RemoteMonitoringData",
    "EPrescription", "TelehealthChat", "TelehealthConsent",
    # Pathology
    "Specimen", "PathologyBlock", "PathologySlide", "StainingProtocol",
    "PathologyReport", "TumorBoard", "CytologyResult",
    # Rehabilitation
    "RehabPlan", "TherapySession", "FunctionalAssessment", "ExercisePrescription",
    "ProgressMilestone", "DisabilityScore", "PainManagementPlan",
    # Nutrition Enhanced
    "NutritionAssessment", "MealPlan", "FoodLog", "DietaryRestriction",
    "NutritionalSupplement", "HydrationLog", "WeightManagementProgram", "EnteralNutrition",
    # Mental Health Enhanced
    "CBTSession", "MindfulnessExercise", "MindfulnessSession", "CrisisIntervention",
    "SafetyPlan", "SubstanceUseLog", "BehavioralGoal", "MentalHealthScreening", "GroupTherapySession",
    # Clinical Trials v2
    "TrialProtocol", "TrialSite", "TrialParticipant", "TrialVisit",
    "TrialAdverseEvent", "ConcomitantMedication", "DataCollectionForm", "ProtocolDeviation",
    # Radiology Enhanced
    "AIReadingResult", "TumorMeasurement", "RadiationDoseRecord",
    "StructuredRadiologyReport", "ImagingProtocol", "ContrastReaction", "ImagingOrderTracking",
    # Pharmacy Enhanced
    "FormularyItem", "DrugUtilizationReview", "MedicationReconciliation",
    "CompoundedMedication", "ControlledSubstanceLog", "ClinicalPharmacyIntervention",
    "AntibioticStewardship", "AdverseReactionHistory",
    # Education
    "EducationResource", "PatientEducationAssignment", "PatientQuiz", "QuizAttempt",
    "HealthLiteracyScore", "TrainingModule", "TrainingCompletion", "CertificationRecord", "LearningPath",
    # Social Determinants
    "SDOHAssessment", "SocialRisk", "CommunityProgram", "ProgramReferral",
    "TransportationNeed", "FoodInsecurityRecord", "HousingAssessment",
    # Wearable Enhanced
    "WearableDevice", "ContinuousGlucoseReading", "GlucoseSummary",
    "FallDetectionEvent", "MedicationReminder", "MedicationDoseLog",
    "GaitAnalysis", "RespiratoryMonitoring", "PainTrackingEntry", "SleepAnalysis", "VitalSignsStream",
    # Emergency
    "TriageAssessment", "SepsisScreening", "StrokeAssessment",
    "CodeEvent", "TraumaAssessment", "RapidResponseTeam",
    # Workforce
    "StaffProfile", "ShiftSchedule", "LeaveRequest", "CredentialingRecord", "PerformanceReview", "StaffingMetrics",
]
