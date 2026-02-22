"""
Seed Service - Database Seeding with Sample Data
=================================================
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
from app.security import hash_password, generate_health_id, generate_record_number

logger = logging.getLogger(__name__)


class SeedService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
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
        await self.seed_sample_patients()
        await self.seed_sample_medications()
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
        
        for h_data in hospitals:
            hospital = Hospital(**h_data)
            self.session.add(hospital)
        
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
        
        for med_data in meds:
            med = Medication(**med_data)
            self.session.add(med)
        
        logger.info("Sample medications seeded")
