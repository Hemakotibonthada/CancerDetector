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

__all__ = [
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
]
