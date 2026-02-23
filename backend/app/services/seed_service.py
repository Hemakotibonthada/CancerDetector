"""
Seed Service - Database Seeding with Sample Data
=================================================
Provides rich demo data for demo accounts only.
Non-demo users see empty states.
"""
from __future__ import annotations
import logging
import json
import random
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserStatus, UserRole
from app.models.patient import Patient
from app.models.hospital import Hospital, HospitalDepartment, Doctor
from app.models.health_record import HealthRecord
from app.models.blood_sample import BloodSample, BloodBiomarker
from app.models.cancer_screening import CancerScreening, CancerRiskAssessment
from app.models.notification import Notification
from app.models.medication import Medication, Prescription
from app.models.appointment import Appointment
from app.models.vital_signs import VitalSigns
from app.models.smartwatch_data import SmartwatchDevice, SmartwatchData
from app.models.communication import SecureMessage
from app.security import hash_password, generate_health_id, generate_record_number

logger = logging.getLogger(__name__)


class SeedService:
    def __init__(self, session: AsyncSession):
        self.session = session
        # Store references for cross-method use
        self._patient_user = None
        self._patient = None
        self._doctor_user = None
        self._doctor = None
        self._hospital = None
        self._departments = []
        self._medications = []
    
    async def seed_all(self):
        """Seed all data."""
        logger.info("Starting database seed...")
        
        # Check if already seeded
        result = await self.session.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            logger.info("Database already has data, skipping seed")
            return
        
        await self.seed_admin_users()
        await self.seed_hospitals()
        await self.seed_departments()
        await self.seed_doctors()
        await self.seed_sample_patients()
        await self.seed_sample_medications()
        await self.session.flush()
        # Seed demo data for demo accounts
        await self.seed_appointments()
        await self.seed_health_records()
        await self.seed_blood_samples()
        await self.seed_cancer_screenings()
        await self.seed_prescriptions()
        await self.seed_vital_signs()
        await self.seed_smartwatch_data()
        await self.seed_notifications()
        await self.seed_messages()
        await self.session.flush()
        
        logger.info("Database seeding completed!")
    
    async def seed_admin_users(self):
        """Create admin users."""
        admin = User(
            email="admin@cancerguard.ai",
            username="admin",
            hashed_password=hash_password("Admin@123456"),
            first_name="System",
            last_name="Administrator",
            role=UserRole.SUPER_ADMIN.value,
            status=UserStatus.ACTIVE.value,
            health_id=generate_health_id(),
            email_verified=True,
        )
        self.session.add(admin)
        
        # Demo doctor
        doctor_user = User(
            email="doctor@cancerguard.ai",
            username="dr.smith",
            hashed_password=hash_password("Doctor@123456"),
            first_name="Dr. John",
            last_name="Smith",
            role=UserRole.ONCOLOGIST.value,
            status=UserStatus.ACTIVE.value,
            health_id=generate_health_id(),
            email_verified=True,
        )
        self.session.add(doctor_user)
        
        # Demo patient
        patient_user = User(
            email="patient@cancerguard.ai",
            username="patient1",
            hashed_password=hash_password("Patient@123456"),
            first_name="Jane",
            last_name="Doe",
            role=UserRole.PATIENT.value,
            status=UserStatus.ACTIVE.value,
            health_id=generate_health_id(),
            email_verified=True,
            date_of_birth=datetime(1985, 5, 15),
            gender="female",
            phone_number="+1234567890",
            city="New York",
            state="NY",
            country="USA",
        )
        self.session.add(patient_user)
        
        # Hospital admin
        hosp_admin = User(
            email="hospital.admin@cancerguard.ai",
            username="hospadmin",
            hashed_password=hash_password("Hospital@123456"),
            first_name="Hospital",
            last_name="Admin",
            role=UserRole.HOSPITAL_ADMIN.value,
            status=UserStatus.ACTIVE.value,
            health_id=generate_health_id(),
            email_verified=True,
        )
        self.session.add(hosp_admin)
        
        await self.session.flush()
        
        # Create patient profile
        patient = Patient(
            user_id=patient_user.id,
            health_id=patient_user.health_id,
            height_cm=165,
            weight_kg=62,
            bmi=22.8,
            blood_type="A+",
            smoking_status="never",
            alcohol_consumption="occasional",
            physical_activity_level="moderately_active",
            exercise_minutes_per_week=150,
            has_diabetes=False,
            has_hypertension=False,
            data_collection_consent=True,
            ai_analysis_consent=True,
        )
        self.session.add(patient)
        
        # Store refs for later seed methods
        self._patient_user = patient_user
        self._patient = patient
        self._doctor_user = doctor_user
        
        logger.info("Admin users seeded")
    
    async def seed_hospitals(self):
        """Create sample hospitals."""
        hospitals = [
            {
                "name": "CancerGuard Central Hospital",
                "code": "CGCH",
                "hospital_type": "cancer_center",
                "email": "info@cgch.com",
                "phone": "+1-555-0100",
                "city": "New York",
                "state": "NY",
                "country": "USA",
                "total_beds": 500,
                "has_cancer_center": True,
                "has_radiation_therapy": True,
                "has_chemotherapy": True,
                "has_mri": True,
                "has_ct_scan": True,
                "has_pet_scan": True,
                "has_genetic_testing": True,
                "ai_integration_enabled": True,
                "smartwatch_integration_enabled": True,
                "is_24_hours": True,
                "emergency_available": True,
            },
            {
                "name": "Metro General Hospital",
                "code": "MGH",
                "hospital_type": "general",
                "email": "info@mgh.com",
                "phone": "+1-555-0200",
                "city": "Los Angeles",
                "state": "CA",
                "country": "USA",
                "total_beds": 300,
                "has_cancer_center": False,
                "has_mri": True,
                "has_ct_scan": True,
                "ai_integration_enabled": True,
                "is_24_hours": True,
            },
            {
                "name": "University Medical Center",
                "code": "UMC",
                "hospital_type": "teaching",
                "email": "info@umc.edu",
                "phone": "+1-555-0300",
                "city": "Chicago",
                "state": "IL",
                "country": "USA",
                "total_beds": 600,
                "has_cancer_center": True,
                "has_radiation_therapy": True,
                "has_chemotherapy": True,
                "has_mri": True,
                "has_ct_scan": True,
                "has_pet_scan": True,
                "has_genetic_testing": True,
                "ai_integration_enabled": True,
                "is_24_hours": True,
            },
        ]
        
        hospital_objs = []
        for h_data in hospitals:
            hospital = Hospital(**h_data)
            self.session.add(hospital)
            hospital_objs.append(hospital)
        
        await self.session.flush()
        self._hospital = hospital_objs[0]  # CancerGuard Central Hospital
        
        logger.info("Hospitals seeded")
    
    async def seed_sample_patients(self):
        """Create additional sample patients."""
        first_names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Iris", "Jack"]
        last_names = ["Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Anderson"]
        
        for i, (fname, lname) in enumerate(zip(first_names, last_names)):
            user = User(
                email=f"{fname.lower()}.{lname.lower()}@example.com",
                username=f"{fname.lower()}{lname.lower()}{i}",
                hashed_password=hash_password("Test@123456"),
                first_name=fname,
                last_name=lname,
                role=UserRole.PATIENT.value,
                status=UserStatus.ACTIVE.value,
                health_id=generate_health_id(),
                email_verified=True,
                date_of_birth=datetime(1970 + i * 3, (i % 12) + 1, (i % 28) + 1),
                gender=random.choice(["male", "female"]),
            )
            self.session.add(user)
            await self.session.flush()
            
            patient = Patient(
                user_id=user.id,
                health_id=user.health_id,
                height_cm=random.randint(150, 190),
                weight_kg=random.randint(50, 100),
                smoking_status=random.choice(["never", "former", "current_light"]),
                alcohol_consumption=random.choice(["none", "occasional", "moderate"]),
                physical_activity_level=random.choice(["sedentary", "lightly_active", "moderately_active"]),
                has_diabetes=random.random() < 0.15,
                has_hypertension=random.random() < 0.2,
                data_collection_consent=True,
                ai_analysis_consent=True,
            )
            patient.calculate_bmi()
            self.session.add(patient)
        
        logger.info("Sample patients seeded")
    
    async def seed_sample_medications(self):
        """Create sample medications."""
        meds = [
            {"generic_name": "Tamoxifen", "brand_name": "Nolvadex", "drug_class": "SERM", "is_cancer_drug": True, "is_hormone_therapy": True},
            {"generic_name": "Cisplatin", "brand_name": "Platinol", "drug_class": "Platinum compound", "is_cancer_drug": True, "is_chemotherapy": True},
            {"generic_name": "Pembrolizumab", "brand_name": "Keytruda", "drug_class": "PD-1 inhibitor", "is_cancer_drug": True, "is_immunotherapy": True},
            {"generic_name": "Trastuzumab", "brand_name": "Herceptin", "drug_class": "Monoclonal antibody", "is_cancer_drug": True, "is_targeted_therapy": True},
            {"generic_name": "Metformin", "brand_name": "Glucophage", "drug_class": "Biguanide", "is_cancer_drug": False},
            {"generic_name": "Lisinopril", "brand_name": "Prinivil", "drug_class": "ACE inhibitor", "is_cancer_drug": False},
            {"generic_name": "Atorvastatin", "brand_name": "Lipitor", "drug_class": "Statin", "is_cancer_drug": False},
            {"generic_name": "Aspirin", "brand_name": "Bayer", "drug_class": "NSAID", "is_cancer_drug": False},
        ]
        
        med_objs = []
        for med_data in meds:
            med = Medication(**med_data)
            self.session.add(med)
            med_objs.append(med)
        
        await self.session.flush()
        self._medications = med_objs
        logger.info("Sample medications seeded")

    async def seed_departments(self):
        """Create departments for the main hospital."""
        if not self._hospital:
            return
        
        dept_data = [
            {"name": "Oncology", "code": "ONC", "department_type": "oncology", "floor": "3", "is_24_hours": True, "total_beds": 50, "available_beds": 12, "total_staff": 45},
            {"name": "Radiology", "code": "RAD", "department_type": "radiology", "floor": "2", "is_24_hours": True, "total_beds": 10, "available_beds": 4, "total_staff": 20},
            {"name": "Pathology", "code": "PATH", "department_type": "pathology", "floor": "1", "total_staff": 15},
            {"name": "Surgery", "code": "SURG", "department_type": "surgery", "floor": "4", "is_24_hours": True, "total_beds": 30, "available_beds": 8, "total_staff": 35},
            {"name": "Emergency", "code": "ER", "department_type": "emergency", "floor": "1", "is_24_hours": True, "total_beds": 20, "available_beds": 5, "total_staff": 30},
        ]
        
        for d in dept_data:
            dept = HospitalDepartment(hospital_id=self._hospital.id, **d)
            self.session.add(dept)
            self._departments.append(dept)
        
        await self.session.flush()
        logger.info("Hospital departments seeded")

    async def seed_doctors(self):
        """Create doctor profiles and additional doctor users."""
        if not self._doctor_user or not self._hospital:
            return
        
        onc_dept = self._departments[0] if self._departments else None
        
        # Create doctor profile for demo doctor (dr.smith)
        doctor = Doctor(
            user_id=self._doctor_user.id,
            hospital_id=self._hospital.id,
            department_id=onc_dept.id if onc_dept else None,
            medical_license_number="ML-2024-001",
            license_state="NY",
            specialization="medical_oncology",
            sub_specialization="Breast Cancer",
            degree="MD, PhD",
            university="Johns Hopkins University",
            graduation_year=2008,
            years_of_experience=15,
            total_patients_treated=2500,
            consultation_fee=200.0,
            follow_up_fee=100.0,
            telemedicine_available=True,
            average_consultation_time=30,
            available_days='["Monday","Tuesday","Wednesday","Thursday","Friday"]',
            morning_start="09:00",
            morning_end="12:00",
            evening_start="14:00",
            evening_end="17:00",
            max_patients_per_day=20,
            average_rating=4.9,
            total_reviews=156,
            bio="Board-certified medical oncologist with 15 years of experience specializing in breast cancer treatment and immunotherapy.",
            languages_spoken="English, Spanish",
            cancer_types_treated=json.dumps(["breast", "lung", "colorectal"]),
            cancer_treatment_methods=json.dumps(["chemotherapy", "immunotherapy", "targeted_therapy"]),
        )
        self.session.add(doctor)
        
        # Create additional doctors
        extra_doctors = [
            {
                "email": "dr.emily.chen@cancerguard.ai", "username": "dr.chen",
                "first_name": "Emily", "last_name": "Chen",
                "spec": "radiation_oncology", "sub": "Lung Cancer",
                "license": "ML-2024-002", "degree": "MD",
                "uni": "Harvard Medical School", "year": 2012,
                "exp": 11, "fee": 180.0, "rating": 4.8, "reviews": 98
            },
            {
                "email": "dr.michael.patel@cancerguard.ai", "username": "dr.patel",
                "first_name": "Michael", "last_name": "Patel",
                "spec": "surgical_oncology", "sub": "Gastrointestinal Cancer",
                "license": "ML-2024-003", "degree": "MD, FACS",
                "uni": "Stanford University", "year": 2010,
                "exp": 13, "fee": 250.0, "rating": 4.7, "reviews": 134
            },
        ]
        
        rad_dept = self._departments[1] if len(self._departments) > 1 else None
        surg_dept = self._departments[3] if len(self._departments) > 3 else None
        dept_map = [rad_dept, surg_dept]
        
        for i, dd in enumerate(extra_doctors):
            user = User(
                email=dd["email"], username=dd["username"],
                hashed_password=hash_password("Doctor@123456"),
                first_name=dd["first_name"], last_name=dd["last_name"],
                role=UserRole.ONCOLOGIST.value, status=UserStatus.ACTIVE.value,
                health_id=generate_health_id(), email_verified=True,
            )
            self.session.add(user)
            await self.session.flush()
            
            doc = Doctor(
                user_id=user.id,
                hospital_id=self._hospital.id,
                department_id=dept_map[i].id if dept_map[i] else None,
                medical_license_number=dd["license"],
                license_state="NY",
                specialization=dd["spec"],
                sub_specialization=dd["sub"],
                degree=dd["degree"],
                university=dd["uni"],
                graduation_year=dd["year"],
                years_of_experience=dd["exp"],
                consultation_fee=dd["fee"],
                follow_up_fee=dd["fee"] * 0.5,
                telemedicine_available=True,
                average_consultation_time=30,
                average_rating=dd["rating"],
                total_reviews=dd["reviews"],
                available_days='["Monday","Tuesday","Wednesday","Thursday","Friday"]',
                morning_start="09:00", morning_end="12:00",
                evening_start="14:00", evening_end="17:00",
                max_patients_per_day=15,
                languages_spoken="English",
            )
            self.session.add(doc)
        
        await self.session.flush()
        self._doctor = doctor
        logger.info("Doctors seeded")

    async def seed_appointments(self):
        """Create appointments for demo patient."""
        if not self._patient or not self._doctor or not self._hospital:
            return
        
        now = datetime.now(timezone.utc)
        patient_id = self._patient.id
        health_id = self._patient.health_id
        doctor_id = self._doctor.id
        hospital_id = self._hospital.id
        dept_id = self._departments[0].id if self._departments else None
        
        appointments_data = [
            # Upcoming appointments
            {
                "appointment_type": "follow_up",
                "status": "confirmed",
                "scheduled_date": now + timedelta(days=5),
                "duration_minutes": 30,
                "reason": "Cancer risk assessment follow-up",
                "priority": "normal",
            },
            {
                "appointment_type": "screening",
                "status": "scheduled",
                "scheduled_date": now + timedelta(days=14),
                "duration_minutes": 60,
                "reason": "Annual breast cancer screening - mammogram",
                "priority": "normal",
            },
            {
                "appointment_type": "lab_test",
                "status": "scheduled",
                "scheduled_date": now + timedelta(days=21),
                "duration_minutes": 15,
                "reason": "Routine blood work - CBC and tumor markers",
                "priority": "normal",
            },
            {
                "appointment_type": "telemedicine",
                "status": "confirmed",
                "scheduled_date": now + timedelta(days=3),
                "duration_minutes": 20,
                "reason": "Discuss latest blood test results",
                "priority": "normal",
                "is_telemedicine": True,
                "telemedicine_link": "https://meet.cancerguard.ai/room/demo-123",
            },
            # Past appointments
            {
                "appointment_type": "consultation",
                "status": "completed",
                "scheduled_date": now - timedelta(days=15),
                "duration_minutes": 45,
                "reason": "Initial cancer risk evaluation",
                "notes": "Patient presents with family history of breast cancer. Recommended comprehensive screening panel.",
                "patient_rating": 5,
                "patient_feedback": "Dr. Smith was very thorough and explained everything clearly.",
            },
            {
                "appointment_type": "screening",
                "status": "completed",
                "scheduled_date": now - timedelta(days=30),
                "duration_minutes": 60,
                "reason": "Breast cancer screening",
                "notes": "All clear. No suspicious findings. Follow up in 6 months.",
                "patient_rating": 5,
            },
            {
                "appointment_type": "checkup",
                "status": "completed",
                "scheduled_date": now - timedelta(days=60),
                "duration_minutes": 30,
                "reason": "Quarterly health checkup",
                "notes": "Vitals normal. BMI within healthy range. Continue current lifestyle.",
            },
            {
                "appointment_type": "follow_up",
                "status": "cancelled",
                "scheduled_date": now - timedelta(days=10),
                "duration_minutes": 30,
                "reason": "Follow-up consultation",
                "cancellation_reason": "Patient requested reschedule due to scheduling conflict",
                "cancelled_at": now - timedelta(days=12),
            },
        ]
        
        for ad in appointments_data:
            appt = Appointment(
                patient_id=patient_id,
                health_id=health_id,
                doctor_id=doctor_id,
                hospital_id=hospital_id,
                department_id=dept_id,
                appointment_number=generate_record_number("APT"),
                **ad,
            )
            self.session.add(appt)
        
        await self.session.flush()
        logger.info("Appointments seeded")

    async def seed_health_records(self):
        """Create health records for demo patient."""
        if not self._patient or not self._doctor:
            return
        
        now = datetime.now(timezone.utc)
        patient_id = self._patient.id
        health_id = self._patient.health_id
        doctor_id = self._doctor.id
        hospital_id = self._hospital.id if self._hospital else None
        dept_id = self._departments[0].id if self._departments else None
        
        records = [
            {
                "record_type": "consultation",
                "category": "outpatient",
                "status": "completed",
                "encounter_date": now - timedelta(days=15),
                "duration_minutes": 45,
                "chief_complaint": "Family history of breast cancer, requesting risk evaluation",
                "primary_diagnosis": "Screening for malignant neoplasms",
                "primary_diagnosis_code": "Z12.31",
                "physical_examination": "General appearance: well-nourished, no acute distress. Breast exam: no palpable masses.",
                "blood_pressure_systolic": 120,
                "blood_pressure_diastolic": 78,
                "heart_rate": 72,
                "respiratory_rate": 16,
                "temperature_celsius": 36.6,
                "oxygen_saturation": 98.5,
                "weight_kg": 62,
                "height_cm": 165,
                "bmi": 22.8,
                "treatment_plan": "Order comprehensive blood panel including tumor markers. Schedule mammogram. Genetic counseling referral.",
                "treatment_status": "in_progress",
                "follow_up_required": True,
                "follow_up_date": now + timedelta(days=5),
                "follow_up_instructions": "Return for blood test results review and screening discussion.",
                "clinical_notes": "Patient concerned about cancer risk given mother's breast cancer diagnosis at age 48. Recommended comprehensive screening approach.",
                "doctor_notes": "Low immediate risk based on clinical exam. Genetic testing recommended given family history.",
                "ai_analysis_requested": True,
                "ai_analysis_completed": True,
                "ai_risk_score": 0.23,
                "ai_risk_level": "low",
                "ai_recommendations": json.dumps(["Annual mammogram", "Genetic counseling for BRCA testing", "Regular self-examination"]),
                "ai_analysis_date": now - timedelta(days=14),
            },
            {
                "record_type": "screening",
                "category": "preventive",
                "status": "completed",
                "encounter_date": now - timedelta(days=30),
                "duration_minutes": 60,
                "chief_complaint": "Scheduled breast cancer screening",
                "primary_diagnosis": "Screening examination - no abnormality detected",
                "primary_diagnosis_code": "Z12.31",
                "physical_examination": "Mammogram performed. No suspicious calcifications or masses.",
                "blood_pressure_systolic": 118,
                "blood_pressure_diastolic": 75,
                "heart_rate": 68,
                "weight_kg": 62,
                "clinical_notes": "Bilateral diagnostic mammogram performed. BI-RADS 1 - Negative. No evidence of malignancy.",
                "has_imaging_results": True,
                "is_cancer_related": True,
            },
            {
                "record_type": "lab_test",
                "category": "diagnostic",
                "status": "completed",
                "encounter_date": now - timedelta(days=20),
                "duration_minutes": 15,
                "chief_complaint": "Routine blood work",
                "primary_diagnosis": "Blood test - results within normal limits",
                "has_lab_results": True,
                "clinical_notes": "CBC, CMP, and tumor markers all within normal range. CEA: 1.8 ng/mL (normal <3.0). CA 15-3: 12 U/mL (normal <30).",
            },
            {
                "record_type": "consultation",
                "category": "outpatient",
                "status": "completed",
                "encounter_date": now - timedelta(days=90),
                "duration_minutes": 30,
                "chief_complaint": "Annual physical examination",
                "primary_diagnosis": "Annual wellness visit - no acute issues",
                "primary_diagnosis_code": "Z00.00",
                "blood_pressure_systolic": 122,
                "blood_pressure_diastolic": 80,
                "heart_rate": 74,
                "respiratory_rate": 16,
                "temperature_celsius": 36.7,
                "oxygen_saturation": 99.0,
                "weight_kg": 63,
                "height_cm": 165,
                "bmi": 23.1,
                "treatment_plan": "Continue current health maintenance. Increase physical activity.",
                "follow_up_required": True,
                "follow_up_date": now - timedelta(days=15),
            },
            {
                "record_type": "treatment",
                "category": "preventive",
                "status": "completed",
                "encounter_date": now - timedelta(days=120),
                "duration_minutes": 20,
                "chief_complaint": "Flu vaccination",
                "primary_diagnosis": "Immunization encounter",
                "primary_diagnosis_code": "Z23",
                "clinical_notes": "Influenza vaccine administered. No adverse reactions observed.",
            },
        ]
        
        for rec_data in records:
            record = HealthRecord(
                patient_id=patient_id,
                health_id=health_id,
                record_number=generate_record_number("REC"),
                doctor_id=doctor_id,
                hospital_id=hospital_id,
                department_id=dept_id,
                **rec_data,
            )
            self.session.add(record)
        
        await self.session.flush()
        logger.info("Health records seeded")

    async def seed_blood_samples(self):
        """Create blood samples with biomarkers for demo patient."""
        if not self._patient or not self._doctor:
            return
        
        now = datetime.now(timezone.utc)
        patient_id = self._patient.id
        health_id = self._patient.health_id
        hospital_id = self._hospital.id if self._hospital else None
        doctor_id = self._doctor.id
        
        samples = [
            {
                "test_type": "complete_blood_count",
                "sample_status": "completed",
                "collection_date": now - timedelta(days=20),
                "fasting": False,
                "volume_ml": 5.0,
                "tube_type": "EDTA (Purple)",
                "collection_method": "venipuncture",
                "collection_site": "Left antecubital fossa",
                "total_tests": 15,
                "normal_results": 13,
                "abnormal_results": 2,
                "critical_results": 0,
                "ai_analyzed": True,
                "ai_cancer_risk_score": 0.12,
                "ai_risk_level": "low",
                "ai_recommendations": json.dumps(["Monitor slightly elevated WBC at next visit", "Recheck in 3 months"]),
                "ai_analysis_date": now - timedelta(days=19),
                "clinical_indication": "Routine screening panel",
                "biomarkers": [
                    {"biomarker_name": "WBC Count", "biomarker_code": "WBC", "category": "hematology", "value": 7.2, "unit": "K/uL", "result_flag": "normal", "reference_low": 4.0, "reference_high": 11.0},
                    {"biomarker_name": "RBC Count", "biomarker_code": "RBC", "category": "hematology", "value": 4.5, "unit": "M/uL", "result_flag": "normal", "reference_low": 3.8, "reference_high": 5.1},
                    {"biomarker_name": "Hemoglobin", "biomarker_code": "HGB", "category": "hematology", "value": 13.5, "unit": "g/dL", "result_flag": "normal", "reference_low": 11.5, "reference_high": 15.5},
                    {"biomarker_name": "Hematocrit", "biomarker_code": "HCT", "category": "hematology", "value": 39.8, "unit": "%", "result_flag": "normal", "reference_low": 35.0, "reference_high": 45.0},
                    {"biomarker_name": "Platelet Count", "biomarker_code": "PLT", "category": "hematology", "value": 245, "unit": "K/uL", "result_flag": "normal", "reference_low": 150, "reference_high": 400},
                    {"biomarker_name": "MCV", "biomarker_code": "MCV", "category": "hematology", "value": 88.4, "unit": "fL", "result_flag": "normal", "reference_low": 80.0, "reference_high": 100.0},
                    {"biomarker_name": "MCH", "biomarker_code": "MCH", "category": "hematology", "value": 30.0, "unit": "pg", "result_flag": "normal", "reference_low": 27.0, "reference_high": 33.0},
                    {"biomarker_name": "MCHC", "biomarker_code": "MCHC", "category": "hematology", "value": 33.9, "unit": "g/dL", "result_flag": "normal", "reference_low": 32.0, "reference_high": 36.0},
                    {"biomarker_name": "Neutrophils", "biomarker_code": "NEUT", "category": "hematology", "value": 62.0, "unit": "%", "result_flag": "normal", "reference_low": 40.0, "reference_high": 70.0},
                    {"biomarker_name": "Lymphocytes", "biomarker_code": "LYMPH", "category": "hematology", "value": 30.0, "unit": "%", "result_flag": "normal", "reference_low": 20.0, "reference_high": 40.0},
                    {"biomarker_name": "Monocytes", "biomarker_code": "MONO", "category": "hematology", "value": 5.5, "unit": "%", "result_flag": "normal", "reference_low": 2.0, "reference_high": 8.0},
                    {"biomarker_name": "Eosinophils", "biomarker_code": "EOS", "category": "hematology", "value": 2.0, "unit": "%", "result_flag": "normal", "reference_low": 1.0, "reference_high": 4.0},
                    {"biomarker_name": "Basophils", "biomarker_code": "BASO", "category": "hematology", "value": 0.5, "unit": "%", "result_flag": "normal", "reference_low": 0.0, "reference_high": 1.0},
                    {"biomarker_name": "ESR", "biomarker_code": "ESR", "category": "inflammatory", "value": 18.0, "unit": "mm/hr", "result_flag": "high", "reference_low": 0.0, "reference_high": 15.0, "is_trending_abnormal": True},
                    {"biomarker_name": "CRP", "biomarker_code": "CRP", "category": "inflammatory", "value": 4.5, "unit": "mg/L", "result_flag": "borderline", "reference_low": 0.0, "reference_high": 3.0},
                ],
            },
            {
                "test_type": "tumor_markers",
                "sample_status": "completed",
                "collection_date": now - timedelta(days=20),
                "fasting": True,
                "fasting_hours": 12,
                "volume_ml": 5.0,
                "tube_type": "SST (Gold)",
                "collection_method": "venipuncture",
                "total_tests": 5,
                "normal_results": 5,
                "abnormal_results": 0,
                "ai_analyzed": True,
                "ai_cancer_risk_score": 0.08,
                "ai_risk_level": "low",
                "clinical_indication": "Cancer marker screening",
                "biomarkers": [
                    {"biomarker_name": "CEA", "biomarker_code": "CEA", "category": "tumor_marker", "value": 1.8, "unit": "ng/mL", "result_flag": "normal", "reference_low": 0.0, "reference_high": 3.0, "is_cancer_marker": True, "cancer_type_relevance": json.dumps(["colorectal", "lung", "breast"])},
                    {"biomarker_name": "CA 15-3", "biomarker_code": "CA153", "category": "tumor_marker", "value": 12.0, "unit": "U/mL", "result_flag": "normal", "reference_low": 0.0, "reference_high": 30.0, "is_cancer_marker": True, "cancer_type_relevance": json.dumps(["breast"])},
                    {"biomarker_name": "CA 125", "biomarker_code": "CA125", "category": "tumor_marker", "value": 18.0, "unit": "U/mL", "result_flag": "normal", "reference_low": 0.0, "reference_high": 35.0, "is_cancer_marker": True, "cancer_type_relevance": json.dumps(["ovarian"])},
                    {"biomarker_name": "AFP", "biomarker_code": "AFP", "category": "tumor_marker", "value": 3.5, "unit": "ng/mL", "result_flag": "normal", "reference_low": 0.0, "reference_high": 10.0, "is_cancer_marker": True, "cancer_type_relevance": json.dumps(["liver"])},
                    {"biomarker_name": "PSA", "biomarker_code": "PSA", "category": "tumor_marker", "value": 0.5, "unit": "ng/mL", "result_flag": "normal", "reference_low": 0.0, "reference_high": 4.0, "is_cancer_marker": True, "cancer_type_relevance": json.dumps(["prostate"])},
                ],
            },
            {
                "test_type": "comprehensive_metabolic_panel",
                "sample_status": "completed",
                "collection_date": now - timedelta(days=60),
                "fasting": True,
                "fasting_hours": 10,
                "volume_ml": 5.0,
                "tube_type": "SST (Gold)",
                "total_tests": 14,
                "normal_results": 14,
                "abnormal_results": 0,
                "clinical_indication": "Annual metabolic panel",
                "biomarkers": [
                    {"biomarker_name": "Glucose", "biomarker_code": "GLU", "category": "metabolic", "value": 92.0, "unit": "mg/dL", "result_flag": "normal", "reference_low": 70.0, "reference_high": 100.0},
                    {"biomarker_name": "BUN", "biomarker_code": "BUN", "category": "renal", "value": 14.0, "unit": "mg/dL", "result_flag": "normal", "reference_low": 7.0, "reference_high": 20.0},
                    {"biomarker_name": "Creatinine", "biomarker_code": "CREAT", "category": "renal", "value": 0.9, "unit": "mg/dL", "result_flag": "normal", "reference_low": 0.6, "reference_high": 1.2},
                    {"biomarker_name": "Sodium", "biomarker_code": "NA", "category": "metabolic", "value": 140.0, "unit": "mEq/L", "result_flag": "normal", "reference_low": 136.0, "reference_high": 145.0},
                    {"biomarker_name": "Potassium", "biomarker_code": "K", "category": "metabolic", "value": 4.2, "unit": "mEq/L", "result_flag": "normal", "reference_low": 3.5, "reference_high": 5.0},
                    {"biomarker_name": "Chloride", "biomarker_code": "CL", "category": "metabolic", "value": 101.0, "unit": "mEq/L", "result_flag": "normal", "reference_low": 98.0, "reference_high": 106.0},
                    {"biomarker_name": "CO2", "biomarker_code": "CO2", "category": "metabolic", "value": 24.0, "unit": "mEq/L", "result_flag": "normal", "reference_low": 23.0, "reference_high": 29.0},
                    {"biomarker_name": "ALT", "biomarker_code": "ALT", "category": "liver", "value": 22.0, "unit": "U/L", "result_flag": "normal", "reference_low": 7.0, "reference_high": 56.0},
                    {"biomarker_name": "AST", "biomarker_code": "AST", "category": "liver", "value": 25.0, "unit": "U/L", "result_flag": "normal", "reference_low": 10.0, "reference_high": 40.0},
                    {"biomarker_name": "Total Protein", "biomarker_code": "TP", "category": "metabolic", "value": 7.1, "unit": "g/dL", "result_flag": "normal", "reference_low": 6.0, "reference_high": 8.3},
                    {"biomarker_name": "Albumin", "biomarker_code": "ALB", "category": "metabolic", "value": 4.2, "unit": "g/dL", "result_flag": "normal", "reference_low": 3.5, "reference_high": 5.5},
                    {"biomarker_name": "Total Bilirubin", "biomarker_code": "TBIL", "category": "liver", "value": 0.8, "unit": "mg/dL", "result_flag": "normal", "reference_low": 0.1, "reference_high": 1.2},
                    {"biomarker_name": "Calcium", "biomarker_code": "CA", "category": "metabolic", "value": 9.5, "unit": "mg/dL", "result_flag": "normal", "reference_low": 8.5, "reference_high": 10.5},
                    {"biomarker_name": "eGFR", "biomarker_code": "EGFR", "category": "renal", "value": 95.0, "unit": "mL/min", "result_flag": "normal", "reference_low": 60.0, "reference_high": 120.0},
                ],
            },
        ]
        
        for s_data in samples:
            biomarkers = s_data.pop("biomarkers", [])
            sample = BloodSample(
                patient_id=patient_id,
                health_id=health_id,
                sample_number=generate_record_number("BS"),
                hospital_id=hospital_id,
                ordering_doctor_id=doctor_id,
                **s_data,
            )
            self.session.add(sample)
            await self.session.flush()
            
            for bm_data in biomarkers:
                biomarker = BloodBiomarker(
                    blood_sample_id=sample.id,
                    **bm_data,
                )
                self.session.add(biomarker)
        
        await self.session.flush()
        logger.info("Blood samples and biomarkers seeded")

    async def seed_cancer_screenings(self):
        """Create cancer screenings and risk assessments for demo patient."""
        if not self._patient or not self._doctor:
            return
        
        now = datetime.now(timezone.utc)
        patient_id = self._patient.id
        health_id = self._patient.health_id
        doctor_id = self._doctor.id
        hospital_id = self._hospital.id if self._hospital else None
        
        # Cancer screenings
        screenings = [
            {
                "screening_date": now - timedelta(days=30),
                "cancer_type_screened": "breast",
                "screening_method": "mammography",
                "result": "negative",
                "result_details": "BI-RADS 1 - Negative. No suspicious findings.",
                "findings": "No masses, calcifications, or architectural distortion identified.",
                "abnormalities_found": False,
                "cancer_detected": False,
                "follow_up_required": True,
                "follow_up_date": now + timedelta(days=180),
                "recommendations": "Continue annual mammographic screening. Perform monthly self-examinations.",
                "ai_analyzed": True,
                "ai_risk_score": 0.08,
                "ai_risk_category": "low",
                "ai_confidence": 0.95,
            },
            {
                "screening_date": now - timedelta(days=90),
                "cancer_type_screened": "cervical",
                "screening_method": "pap_smear",
                "result": "negative",
                "result_details": "Normal cytology. No intraepithelial lesion or malignancy.",
                "abnormalities_found": False,
                "cancer_detected": False,
                "follow_up_required": True,
                "follow_up_date": now + timedelta(days=1000),
                "recommendations": "Next Pap smear in 3 years per guidelines. HPV co-testing negative.",
                "ai_analyzed": True,
                "ai_risk_score": 0.03,
                "ai_risk_category": "very_low",
                "ai_confidence": 0.98,
            },
        ]
        
        for scr in screenings:
            screening = CancerScreening(
                patient_id=patient_id,
                health_id=health_id,
                screening_number=generate_record_number("SCR"),
                doctor_id=doctor_id,
                hospital_id=hospital_id,
                **scr,
            )
            self.session.add(screening)
        
        # Risk assessment
        assessment = CancerRiskAssessment(
            patient_id=patient_id,
            health_id=health_id,
            assessment_number=generate_record_number("CRA"),
            assessment_date=now - timedelta(days=14),
            assessment_type="comprehensive",
            overall_risk_score=0.18,
            overall_risk_category="low",
            overall_risk_percentile=22.0,
            breast_cancer_risk=0.25,
            lung_cancer_risk=0.05,
            colorectal_cancer_risk=0.08,
            skin_cancer_risk=0.12,
            ovarian_cancer_risk=0.10,
            cervical_cancer_risk=0.03,
            genetic_risk_score=0.30,
            lifestyle_risk_score=0.10,
            environmental_risk_score=0.15,
            biomarker_risk_score=0.08,
            family_history_risk_score=0.35,
            age_risk_score=0.12,
            blood_data_used=True,
            clinical_data_used=True,
            family_history_used=True,
            lifestyle_data_used=True,
            top_risk_factors=json.dumps([
                "Family history of breast cancer (mother)",
                "Age over 35",
                "Moderate alcohol consumption",
            ]),
            protective_factors=json.dumps([
                "Non-smoker",
                "Regular physical activity",
                "Healthy BMI",
                "No hormone replacement therapy",
            ]),
            modifiable_risk_factors=json.dumps([
                "Reduce alcohol consumption",
                "Increase antioxidant-rich foods",
                "Consider genetic counseling for BRCA testing",
            ]),
            ai_model_name="CancerGuard Risk Engine",
            ai_model_version="2.1.0",
            ai_confidence=0.89,
            prediction_explanation="Risk assessment based on comprehensive analysis of clinical data, family history, and lifestyle factors. Primary risk driver is family history of breast cancer.",
            screening_recommendations=json.dumps([
                {"type": "mammogram", "frequency": "annual", "next_due": (now + timedelta(days=180)).isoformat()},
                {"type": "clinical_breast_exam", "frequency": "every_6_months", "next_due": (now + timedelta(days=90)).isoformat()},
                {"type": "genetic_counseling", "frequency": "once", "urgency": "recommended"},
            ]),
            lifestyle_recommendations=json.dumps([
                "Maintain current exercise routine",
                "Reduce alcohol to less than 3 drinks per week",
                "Increase cruciferous vegetable intake",
                "Continue vitamin D supplementation",
            ]),
            reviewed_by_doctor=True,
            reviewing_doctor_id=self._doctor.id if self._doctor else None,
            doctor_agreement=True,
            doctor_notes="Agree with AI assessment. Family history is the primary risk factor. Genetic testing recommended.",
        )
        self.session.add(assessment)
        
        await self.session.flush()
        logger.info("Cancer screenings and risk assessments seeded")

    async def seed_prescriptions(self):
        """Create prescriptions for demo patient."""
        if not self._patient or not self._doctor or not self._medications:
            return
        
        now = datetime.now(timezone.utc)
        patient_id = self._patient.id
        health_id = self._patient.health_id
        doctor_id = self._doctor.id
        hospital_id = self._hospital.id if self._hospital else None
        
        # Find medications by name
        med_map = {m.generic_name: m for m in self._medications}
        
        prescriptions = [
            {
                "medication_id": med_map.get("Metformin", self._medications[4]).id if "Metformin" in med_map else None,
                "medication_name": "Metformin",
                "dosage": "500mg",
                "dosage_unit": "mg",
                "frequency": "twice_daily",
                "route": "oral",
                "start_date": now - timedelta(days=180),
                "duration_days": 365,
                "quantity_prescribed": 60,
                "refills_authorized": 6,
                "refills_remaining": 3,
                "instructions": "Take with food. One tablet in the morning and one in the evening.",
                "take_with_food": True,
                "diagnosis": "Type 2 Diabetes prevention",
                "icd10_code": "R73.03",
                "status": "active",
                "cost": 15.00,
                "insurance_covered": 12.00,
                "copay": 3.00,
                "pharmacy_name": "CVS Pharmacy #1234",
            },
            {
                "medication_id": med_map.get("Lisinopril", self._medications[5]).id if "Lisinopril" in med_map else None,
                "medication_name": "Lisinopril",
                "dosage": "10mg",
                "dosage_unit": "mg",
                "frequency": "once_daily",
                "route": "oral",
                "start_date": now - timedelta(days=90),
                "duration_days": 365,
                "quantity_prescribed": 30,
                "refills_authorized": 12,
                "refills_remaining": 9,
                "instructions": "Take once daily in the morning. Monitor blood pressure regularly.",
                "diagnosis": "Hypertension management",
                "icd10_code": "I10",
                "status": "active",
                "cost": 10.00,
                "insurance_covered": 8.00,
                "copay": 2.00,
                "pharmacy_name": "Walgreens #5678",
            },
            {
                "medication_id": med_map.get("Atorvastatin", self._medications[6]).id if "Atorvastatin" in med_map else None,
                "medication_name": "Atorvastatin",
                "dosage": "20mg",
                "dosage_unit": "mg",
                "frequency": "once_daily",
                "route": "oral",
                "start_date": now - timedelta(days=60),
                "duration_days": 365,
                "quantity_prescribed": 30,
                "refills_authorized": 12,
                "refills_remaining": 10,
                "instructions": "Take once daily at bedtime. Avoid grapefruit.",
                "diagnosis": "Hyperlipidemia",
                "icd10_code": "E78.5",
                "status": "active",
                "cost": 12.00,
                "insurance_covered": 10.00,
                "copay": 2.00,
            },
            {
                "medication_id": med_map.get("Aspirin", self._medications[7]).id if "Aspirin" in med_map else None,
                "medication_name": "Aspirin (Low Dose)",
                "dosage": "81mg",
                "dosage_unit": "mg",
                "frequency": "once_daily",
                "route": "oral",
                "start_date": now - timedelta(days=365),
                "quantity_prescribed": 90,
                "refills_authorized": 4,
                "refills_remaining": 2,
                "instructions": "Take once daily with food. Do not crush or chew.",
                "take_with_food": True,
                "diagnosis": "Cardiovascular disease prevention",
                "status": "active",
                "cost": 5.00,
            },
        ]
        
        for rx_data in prescriptions:
            rx = Prescription(
                patient_id=patient_id,
                health_id=health_id,
                doctor_id=doctor_id,
                hospital_id=hospital_id,
                prescription_number=generate_record_number("RX"),
                **rx_data,
            )
            self.session.add(rx)
        
        await self.session.flush()
        logger.info("Prescriptions seeded")

    async def seed_vital_signs(self):
        """Create vital sign history for demo patient."""
        if not self._patient:
            return
        
        now = datetime.now(timezone.utc)
        patient_id = self._patient.id
        
        # Create 30 days of vital signs (one reading per day)
        for day_offset in range(30):
            recorded_at = now - timedelta(days=day_offset, hours=random.randint(7, 10))
            vs = VitalSigns(
                patient_id=patient_id,
                recorded_at=recorded_at,
                source="manual" if day_offset % 3 == 0 else "smartwatch",
                heart_rate=random.randint(62, 82),
                bp_systolic=random.randint(115, 128),
                bp_diastolic=random.randint(70, 82),
                temperature_celsius=round(36.3 + random.random() * 0.8, 1),
                respiratory_rate=random.randint(14, 18),
                oxygen_saturation=round(96.5 + random.random() * 3.0, 1),
                weight_kg=round(61.5 + random.random() * 1.5, 1),
                height_cm=165.0,
                bmi=round(22.5 + random.random() * 0.8, 1),
                pain_score=0 if random.random() > 0.1 else random.randint(1, 3),
                blood_glucose=round(85 + random.random() * 20, 1) if day_offset % 3 == 0 else None,
            )
            self.session.add(vs)
        
        await self.session.flush()
        logger.info("Vital signs seeded")

    async def seed_smartwatch_data(self):
        """Create smartwatch device and data for demo patient."""
        if not self._patient:
            return
        
        now = datetime.now(timezone.utc)
        patient_id = self._patient.id
        device_id = f"AW-{uuid4().hex[:12].upper()}"
        
        # Register device
        device = SmartwatchDevice(
            patient_id=patient_id,
            device_id=device_id,
            device_name="Apple Watch Series 9",
            device_brand="apple_watch",
            device_model="A2857",
            serial_number=f"FHKLM{uuid4().hex[:6].upper()}",
            firmware_version="10.3.1",
            has_heart_rate=True,
            has_spo2=True,
            has_ecg=True,
            has_blood_pressure=False,
            has_temperature=True,
            has_sleep_tracking=True,
            has_activity_tracking=True,
            has_stress_tracking=True,
            has_fall_detection=True,
            has_afib_detection=True,
            is_paired=True,
            paired_at=now - timedelta(days=90),
            last_synced=now - timedelta(minutes=5),
            sync_frequency_minutes=15,
            battery_level=78.0,
            continuous_monitoring=True,
            data_collection_consent=True,
            real_time_alerts_enabled=True,
        )
        self.session.add(device)
        
        # Create 7 days of daily summary data
        for day_offset in range(7):
            day_start = (now - timedelta(days=day_offset)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(hours=23, minutes=59, seconds=59)
            
            steps = random.randint(5000, 13000)
            active_mins = random.randint(20, 60)
            
            sw_data = SmartwatchData(
                patient_id=patient_id,
                device_id=device_id,
                timestamp=day_end,
                period_start=day_start,
                period_end=day_end,
                period_type="day",
                heart_rate_avg=round(68 + random.random() * 10, 1),
                heart_rate_min=random.randint(52, 60),
                heart_rate_max=random.randint(110, 140),
                heart_rate_resting=random.randint(55, 65),
                heart_rate_variability=round(35 + random.random() * 25, 1),
                spo2_avg=round(96.5 + random.random() * 2.5, 1),
                spo2_min=round(94.0 + random.random() * 2.0, 1),
                spo2_max=round(98.0 + random.random() * 1.5, 1),
                skin_temperature=round(36.2 + random.random() * 0.6, 1),
                steps=steps,
                distance_meters=round(steps * 0.75, 0),
                calories_burned=round(1800 + steps * 0.04 + active_mins * 5, 0),
                active_minutes=active_mins,
                sedentary_minutes=random.randint(400, 600),
                floors_climbed=random.randint(3, 15),
                sleep_duration_minutes=random.randint(360, 480),
                sleep_quality_score=round(70 + random.random() * 25, 1),
                deep_sleep_minutes=random.randint(60, 120),
                light_sleep_minutes=random.randint(120, 200),
                rem_sleep_minutes=random.randint(60, 100),
                awake_minutes=random.randint(10, 40),
                sleep_efficiency=round(80 + random.random() * 15, 1),
                stress_level=round(20 + random.random() * 40, 1),
                stress_score=random.randint(20, 60),
                relaxation_score=random.randint(50, 80),
                respiratory_rate=round(14 + random.random() * 4, 1),
                data_quality="good",
                data_completeness=round(0.9 + random.random() * 0.1, 2),
                ai_analyzed=True,
                ai_anomaly_detected=False,
                ai_health_score=round(75 + random.random() * 20, 1),
            )
            self.session.add(sw_data)
        
        await self.session.flush()
        logger.info("Smartwatch data seeded")

    async def seed_notifications(self):
        """Create notifications for demo patient."""
        if not self._patient_user:
            return
        
        now = datetime.now(timezone.utc)
        user_id = self._patient_user.id
        
        notifications = [
            {
                "notification_type": "appointment_reminder",
                "priority": "high",
                "title": "Upcoming Appointment",
                "message": "You have a follow-up appointment with Dr. John Smith tomorrow at 10:00 AM at CancerGuard Central Hospital.",
                "short_message": "Appointment with Dr. Smith tomorrow",
                "action_url": "/patient/appointments",
                "action_label": "View Appointment",
                "is_read": False,
            },
            {
                "notification_type": "lab_result",
                "priority": "medium",
                "title": "Lab Results Available",
                "message": "Your Complete Blood Count results from February 20 are now available. All results are within normal range.",
                "short_message": "CBC results ready",
                "action_url": "/patient/blood-tests",
                "action_label": "View Results",
                "is_read": False,
            },
            {
                "notification_type": "cancer_risk_alert",
                "priority": "medium",
                "title": "Cancer Risk Assessment Updated",
                "message": "Your comprehensive cancer risk assessment has been updated. Overall risk: Low (18%). Dr. Smith has reviewed the results.",
                "short_message": "Risk assessment updated",
                "action_url": "/patient/cancer-risk",
                "action_label": "View Assessment",
                "is_read": False,
            },
            {
                "notification_type": "medication_reminder",
                "priority": "medium",
                "title": "Medication Reminder",
                "message": "Time to take your evening dose of Metformin 500mg. Remember to take it with food.",
                "short_message": "Take Metformin 500mg",
                "action_url": "/patient/medications",
                "action_label": "Mark as Taken",
                "is_read": False,
            },
            {
                "notification_type": "health_tip",
                "priority": "low",
                "title": "Weekly Health Tip",
                "message": "Studies show that 30 minutes of moderate exercise 5 days a week can reduce cancer risk by up to 20%. Keep up your great activity levels!",
                "short_message": "Exercise reduces cancer risk",
                "is_read": True,
                "read_at": now - timedelta(hours=5),
            },
            {
                "notification_type": "screening_due",
                "priority": "medium",
                "title": "Screening Reminder",
                "message": "Your annual mammogram is due in 2 weeks. We've scheduled it for March 5, 2026. Please confirm or reschedule.",
                "short_message": "Mammogram due in 2 weeks",
                "action_url": "/patient/screening-schedule",
                "action_label": "Confirm Screening",
                "is_read": False,
            },
            {
                "notification_type": "smartwatch_alert",
                "priority": "low",
                "title": "Smartwatch Weekly Summary",
                "message": "Your weekly health summary: Average heart rate 72 bpm, 8,432 daily steps, sleep quality 85/100. All metrics are within healthy ranges.",
                "short_message": "Weekly health summary ready",
                "action_url": "/patient/smartwatch",
                "action_label": "View Summary",
                "is_read": True,
                "read_at": now - timedelta(days=1),
            },
            {
                "notification_type": "system",
                "priority": "low",
                "title": "Profile Update Required",
                "message": "Please update your emergency contact information to ensure we can reach your emergency contacts when needed.",
                "short_message": "Update emergency contacts",
                "action_url": "/patient/profile",
                "action_label": "Update Profile",
                "is_read": True,
                "read_at": now - timedelta(days=3),
            },
            {
                "notification_type": "prescription_refill",
                "priority": "medium",
                "title": "Prescription Refill Available",
                "message": "Your Metformin prescription has 3 refills remaining. Your next refill is available starting March 1, 2026.",
                "short_message": "Metformin refill available",
                "action_url": "/patient/medications",
                "action_label": "Request Refill",
                "is_read": False,
            },
            {
                "notification_type": "appointment_confirmation",
                "priority": "medium",
                "title": "Appointment Confirmed",
                "message": "Your telemedicine appointment with Dr. John Smith on March 3, 2026 at 2:00 PM has been confirmed. A video link will be sent 15 minutes before.",
                "short_message": "Telemedicine appointment confirmed",
                "action_url": "/patient/appointments",
                "action_label": "View Details",
                "is_read": True,
                "read_at": now - timedelta(hours=12),
            },
        ]
        
        for i, notif_data in enumerate(notifications):
            notif = Notification(
                user_id=user_id,
                created_at=now - timedelta(hours=i * 3 + random.randint(0, 5)),
                **notif_data,
            )
            self.session.add(notif)
        
        await self.session.flush()
        logger.info("Notifications seeded")

    async def seed_messages(self):
        """Create secure messages for demo patient."""
        if not self._patient_user or not self._doctor_user:
            return
        
        now = datetime.now(timezone.utc)
        patient_id = self._patient_user.id
        doctor_id = self._doctor_user.id
        
        messages = [
            {
                "sender_id": doctor_id,
                "recipient_id": patient_id,
                "subject": "Your Recent Lab Results",
                "body": "Hi Jane,\n\nI've reviewed your recent blood work results. Everything looks good overall. Your CBC is within normal limits, and all tumor markers are negative.\n\nThere's a slightly elevated ESR (18 mm/hr, normal <15), which is a minor inflammation marker. This is nothing to worry about and can be caused by many benign factors. We'll recheck it at your next visit.\n\nPlease don't hesitate to reach out if you have any questions.\n\nBest regards,\nDr. John Smith",
                "priority": "normal",
                "is_read": True,
                "read_at": now - timedelta(days=1),
                "created_at": now - timedelta(days=2),
            },
            {
                "sender_id": patient_id,
                "recipient_id": doctor_id,
                "subject": "Re: Your Recent Lab Results",
                "body": "Thank you, Dr. Smith! That's reassuring to hear. I'll make sure to keep my follow-up appointment next week. Should I continue fasting before my next blood draw?\n\nBest,\nJane",
                "priority": "normal",
                "is_read": True,
                "read_at": now - timedelta(hours=18),
                "created_at": now - timedelta(days=1),
            },
            {
                "sender_id": doctor_id,
                "recipient_id": patient_id,
                "subject": "Re: Your Recent Lab Results",
                "body": "Yes, please fast for 10-12 hours before your next blood draw. Water is fine. We'll do a comprehensive panel this time.\n\nSee you next week!\n\nDr. Smith",
                "priority": "normal",
                "is_read": False,
                "created_at": now - timedelta(hours=12),
            },
            {
                "sender_id": doctor_id,
                "recipient_id": patient_id,
                "subject": "Cancer Risk Assessment Results",
                "body": "Dear Jane,\n\nYour comprehensive cancer risk assessment has been completed. I'm pleased to report that your overall risk is categorized as LOW (18th percentile).\n\nKey findings:\n- Breast cancer risk is slightly elevated due to family history, but still within manageable range\n- All other cancer type risks are very low\n- Your lifestyle choices (non-smoking, regular exercise, healthy BMI) are significant protective factors\n\nI recommend:\n1. Continue annual mammograms\n2. Consider genetic counseling for BRCA testing\n3. Maintain your current healthy lifestyle\n\nWe can discuss this in detail at your next appointment.\n\nDr. Smith",
                "priority": "high",
                "is_read": True,
                "read_at": now - timedelta(days=10),
                "created_at": now - timedelta(days=12),
            },
            {
                "sender_id": patient_id,
                "recipient_id": doctor_id,
                "subject": "Appointment Reschedule Request",
                "body": "Hi Dr. Smith,\n\nI need to reschedule my appointment that was on February 18th. Would it be possible to move it to next week? Any day after Tuesday works for me.\n\nThank you,\nJane",
                "priority": "normal",
                "is_read": True,
                "read_at": now - timedelta(days=13),
                "created_at": now - timedelta(days=14),
            },
        ]
        
        for msg_data in messages:
            msg = SecureMessage(**msg_data)
            self.session.add(msg)
        
        await self.session.flush()
        logger.info("Messages seeded")