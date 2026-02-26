#!/usr/bin/env python3
"""
Database Seed Script - Populates the CancerGuard AI database with comprehensive
sample data for development and demonstration purposes.
"""

import asyncio
import hashlib
import json
import os
import random
import sys
import uuid
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ============================================================================
# Configuration
# ============================================================================

SEED_CONFIG = {
    "num_hospitals": 5,
    "num_departments_per_hospital": 8,
    "num_doctors_per_hospital": 20,
    "num_patients": 200,
    "num_appointments_per_patient": 5,
    "num_health_records_per_patient": 10,
    "num_lab_results_per_patient": 8,
    "num_prescriptions_per_patient": 3,
    "num_vital_signs_per_patient": 15,
    "num_cancer_screenings": 150,
    "num_blood_samples": 100,
    "num_wearable_entries": 500,
    "num_billing_records": 300,
    "num_clinical_trials": 20,
    "num_admin_users": 5,
    "num_nurse_users": 30,
}

# ============================================================================
# Data Sources
# ============================================================================

FIRST_NAMES_MALE = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph",
    "Thomas", "Christopher", "Charles", "Daniel", "Matthew", "Anthony", "Mark",
    "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
    "George", "Timothy", "Ronald", "Edward", "Jason", "Jeffrey", "Ryan",
]

FIRST_NAMES_FEMALE = [
    "Mary", "Patricia", "Jennifer", "Linda", "Barbara", "Elizabeth", "Susan",
    "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret", "Sandra",
    "Ashley", "Dorothy", "Kimberly", "Emily", "Donna", "Michelle", "Carol",
    "Amanda", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen",
    "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera",
    "Campbell", "Mitchell", "Carter", "Roberts",
]

HOSPITAL_NAMES = [
    "CancerGuard Medical Center",
    "Memorial Cancer Institute",
    "University Oncology Hospital",
    "Regional Cancer Treatment Center",
    "Advanced Oncology Care Hospital",
]

HOSPITAL_ADDRESSES = [
    {"address": "100 Medical Center Blvd", "city": "Springfield", "state": "IL", "zip": "62701"},
    {"address": "200 Cancer Research Way", "city": "Boston", "state": "MA", "zip": "02115"},
    {"address": "300 Health Sciences Dr", "city": "Houston", "state": "TX", "zip": "77030"},
    {"address": "400 Oncology Ave", "city": "Rochester", "state": "MN", "zip": "55905"},
    {"address": "500 Medical Park Circle", "city": "Cleveland", "state": "OH", "zip": "44195"},
]

DEPARTMENTS = [
    {"name": "Oncology", "code": "ONCO", "description": "Cancer diagnosis, treatment, and research"},
    {"name": "Radiology", "code": "RADI", "description": "Diagnostic imaging and radiation therapy"},
    {"name": "Pathology", "code": "PATH", "description": "Laboratory medicine and tissue analysis"},
    {"name": "Surgery", "code": "SURG", "description": "Surgical oncology and procedures"},
    {"name": "Internal Medicine", "code": "INTM", "description": "General internal medicine"},
    {"name": "Emergency Medicine", "code": "EMER", "description": "Emergency and urgent care"},
    {"name": "Hematology", "code": "HEMA", "description": "Blood disorders and blood cancer"},
    {"name": "Genomics", "code": "GENO", "description": "Genetic testing and genomic medicine"},
    {"name": "Palliative Care", "code": "PALL", "description": "Symptom management and end-of-life care"},
    {"name": "Rehabilitation", "code": "REHA", "description": "Physical and occupational therapy"},
    {"name": "Pharmacy", "code": "PHAR", "description": "Pharmaceutical services"},
    {"name": "Nutrition", "code": "NUTR", "description": "Clinical nutrition and dietary counseling"},
]

SPECIALTIES = [
    "Medical Oncology", "Surgical Oncology", "Radiation Oncology", "Hematology",
    "Dermatology", "Gastroenterology", "Pulmonology", "Urology", "Gynecologic Oncology",
    "Neuro-Oncology", "Pathology", "Radiology", "Nuclear Medicine", "Palliative Medicine",
]

DIAGNOSES = [
    {"icd10": "C50.911", "description": "Malignant neoplasm of unspecified site of right female breast", "cancer_type": "breast"},
    {"icd10": "C50.912", "description": "Malignant neoplasm of unspecified site of left female breast", "cancer_type": "breast"},
    {"icd10": "C34.10", "description": "Malignant neoplasm of upper lobe, unspecified bronchus or lung", "cancer_type": "lung"},
    {"icd10": "C34.90", "description": "Malignant neoplasm of unspecified part of bronchus or lung", "cancer_type": "lung"},
    {"icd10": "C18.9", "description": "Malignant neoplasm of colon, unspecified", "cancer_type": "colon"},
    {"icd10": "C61", "description": "Malignant neoplasm of prostate", "cancer_type": "prostate"},
    {"icd10": "C43.9", "description": "Malignant melanoma of skin, unspecified", "cancer_type": "skin"},
    {"icd10": "C56.9", "description": "Malignant neoplasm of unspecified ovary", "cancer_type": "ovarian"},
    {"icd10": "C25.9", "description": "Malignant neoplasm of pancreas, unspecified", "cancer_type": "pancreatic"},
    {"icd10": "C22.0", "description": "Liver cell carcinoma", "cancer_type": "liver"},
    {"icd10": "C53.9", "description": "Malignant neoplasm of cervix uteri, unspecified", "cancer_type": "cervical"},
    {"icd10": "C73", "description": "Malignant neoplasm of thyroid gland", "cancer_type": "thyroid"},
    {"icd10": "C64.9", "description": "Malignant neoplasm of unspecified kidney", "cancer_type": "kidney"},
    {"icd10": "C67.9", "description": "Malignant neoplasm of bladder, unspecified", "cancer_type": "bladder"},
    {"icd10": "C91.00", "description": "Acute lymphoblastic leukemia not having achieved remission", "cancer_type": "leukemia"},
    {"icd10": "C81.90", "description": "Hodgkin lymphoma, unspecified", "cancer_type": "lymphoma"},
    {"icd10": "I10", "description": "Essential (primary) hypertension", "cancer_type": None},
    {"icd10": "E11.9", "description": "Type 2 diabetes mellitus without complications", "cancer_type": None},
    {"icd10": "J44.1", "description": "Chronic obstructive pulmonary disease with acute exacerbation", "cancer_type": None},
    {"icd10": "N18.3", "description": "Chronic kidney disease, stage 3", "cancer_type": None},
]

MEDICATIONS = [
    {"name": "Tamoxifen", "rxnorm": "10324", "class": "hormonal", "dose": "20mg", "route": "oral"},
    {"name": "Letrozole", "rxnorm": "72965", "class": "hormonal", "dose": "2.5mg", "route": "oral"},
    {"name": "Trastuzumab", "rxnorm": "224905", "class": "targeted", "dose": "6mg/kg", "route": "iv"},
    {"name": "Pembrolizumab", "rxnorm": "1597875", "class": "immunotherapy", "dose": "200mg", "route": "iv"},
    {"name": "Cisplatin", "rxnorm": "2555", "class": "chemotherapy", "dose": "75mg/m2", "route": "iv"},
    {"name": "Carboplatin", "rxnorm": "40048", "class": "chemotherapy", "dose": "AUC 5", "route": "iv"},
    {"name": "Paclitaxel", "rxnorm": "56946", "class": "chemotherapy", "dose": "175mg/m2", "route": "iv"},
    {"name": "Doxorubicin", "rxnorm": "3639", "class": "chemotherapy", "dose": "60mg/m2", "route": "iv"},
    {"name": "Metformin", "rxnorm": "6809", "class": "antidiabetic", "dose": "500mg", "route": "oral"},
    {"name": "Lisinopril", "rxnorm": "29046", "class": "antihypertensive", "dose": "10mg", "route": "oral"},
    {"name": "Ondansetron", "rxnorm": "26225", "class": "antiemetic", "dose": "4mg", "route": "oral"},
    {"name": "Filgrastim", "rxnorm": "68462", "class": "growth_factor", "dose": "5mcg/kg", "route": "sc"},
    {"name": "Morphine", "rxnorm": "7052", "class": "analgesic", "dose": "15mg", "route": "oral"},
    {"name": "Dexamethasone", "rxnorm": "3264", "class": "corticosteroid", "dose": "4mg", "route": "oral"},
    {"name": "Omeprazole", "rxnorm": "7646", "class": "ppi", "dose": "20mg", "route": "oral"},
]

LAB_TESTS = [
    {"name": "Complete Blood Count", "code": "CBC", "loinc": "57021-8", "components": [
        {"name": "WBC", "unit": "K/uL", "range": "4.5-11.0", "normal_low": 4.5, "normal_high": 11.0},
        {"name": "RBC", "unit": "M/uL", "range": "4.5-5.5", "normal_low": 4.5, "normal_high": 5.5},
        {"name": "Hemoglobin", "unit": "g/dL", "range": "13.5-17.5", "normal_low": 13.5, "normal_high": 17.5},
        {"name": "Hematocrit", "unit": "%", "range": "38.8-50.0", "normal_low": 38.8, "normal_high": 50.0},
        {"name": "Platelets", "unit": "K/uL", "range": "150-400", "normal_low": 150, "normal_high": 400},
    ]},
    {"name": "Comprehensive Metabolic Panel", "code": "CMP", "loinc": "24323-8", "components": [
        {"name": "Glucose", "unit": "mg/dL", "range": "70-100", "normal_low": 70, "normal_high": 100},
        {"name": "BUN", "unit": "mg/dL", "range": "7-20", "normal_low": 7, "normal_high": 20},
        {"name": "Creatinine", "unit": "mg/dL", "range": "0.7-1.3", "normal_low": 0.7, "normal_high": 1.3},
        {"name": "Sodium", "unit": "mEq/L", "range": "136-145", "normal_low": 136, "normal_high": 145},
        {"name": "Potassium", "unit": "mEq/L", "range": "3.5-5.0", "normal_low": 3.5, "normal_high": 5.0},
        {"name": "Calcium", "unit": "mg/dL", "range": "8.5-10.5", "normal_low": 8.5, "normal_high": 10.5},
        {"name": "ALT", "unit": "U/L", "range": "7-56", "normal_low": 7, "normal_high": 56},
        {"name": "AST", "unit": "U/L", "range": "10-40", "normal_low": 10, "normal_high": 40},
    ]},
    {"name": "Tumor Markers Panel", "code": "TUMOR", "loinc": "custom-tumor", "components": [
        {"name": "CEA", "unit": "ng/mL", "range": "0-2.5", "normal_low": 0, "normal_high": 2.5},
        {"name": "CA-125", "unit": "U/mL", "range": "0-35", "normal_low": 0, "normal_high": 35},
        {"name": "CA 19-9", "unit": "U/mL", "range": "0-37", "normal_low": 0, "normal_high": 37},
        {"name": "AFP", "unit": "ng/mL", "range": "0-8.5", "normal_low": 0, "normal_high": 8.5},
        {"name": "PSA", "unit": "ng/mL", "range": "0-4.0", "normal_low": 0, "normal_high": 4.0},
    ]},
    {"name": "Thyroid Panel", "code": "THYROID", "loinc": "27801-7", "components": [
        {"name": "TSH", "unit": "mIU/L", "range": "0.4-4.0", "normal_low": 0.4, "normal_high": 4.0},
        {"name": "Free T4", "unit": "ng/dL", "range": "0.8-1.8", "normal_low": 0.8, "normal_high": 1.8},
        {"name": "Free T3", "unit": "pg/mL", "range": "2.3-4.2", "normal_low": 2.3, "normal_high": 4.2},
    ]},
    {"name": "Hemoglobin A1c", "code": "HBA1C", "loinc": "4548-4", "components": [
        {"name": "HbA1c", "unit": "%", "range": "4.0-5.6", "normal_low": 4.0, "normal_high": 5.6},
    ]},
    {"name": "Coagulation Panel", "code": "COAG", "loinc": "custom-coag", "components": [
        {"name": "PT", "unit": "seconds", "range": "11-13.5", "normal_low": 11, "normal_high": 13.5},
        {"name": "INR", "unit": "ratio", "range": "0.8-1.1", "normal_low": 0.8, "normal_high": 1.1},
        {"name": "aPTT", "unit": "seconds", "range": "25-35", "normal_low": 25, "normal_high": 35},
    ]},
]

CLINICAL_TRIALS = [
    {"title": "Phase III Trial of Neoadjuvant Pembrolizumab in Triple-Negative Breast Cancer",
     "phase": "Phase III", "cancer_type": "breast", "status": "recruiting"},
    {"title": "Targeted Therapy Combination for Advanced Non-Small Cell Lung Cancer",
     "phase": "Phase II", "cancer_type": "lung", "status": "recruiting"},
    {"title": "Immunotherapy Maintenance in Metastatic Colorectal Cancer",
     "phase": "Phase III", "cancer_type": "colon", "status": "recruiting"},
    {"title": "CAR-T Cell Therapy for Refractory B-Cell Lymphoma",
     "phase": "Phase II", "cancer_type": "lymphoma", "status": "enrolling"},
    {"title": "Precision Medicine Approach for Pancreatic Adenocarcinoma",
     "phase": "Phase I/II", "cancer_type": "pancreatic", "status": "recruiting"},
    {"title": "mRNA Vaccine for HPV-Positive Cervical Cancer",
     "phase": "Phase I", "cancer_type": "cervical", "status": "enrolling"},
    {"title": "Combination Checkpoint Inhibitor for Advanced Melanoma",
     "phase": "Phase III", "cancer_type": "skin", "status": "active"},
    {"title": "Adjuvant Therapy Optimization for Stage III Colon Cancer",
     "phase": "Phase III", "cancer_type": "colon", "status": "recruiting"},
    {"title": "Liquid Biopsy for Early Detection of Hepatocellular Carcinoma",
     "phase": "Phase II", "cancer_type": "liver", "status": "recruiting"},
    {"title": "Novel Androgen Receptor Inhibitor for Metastatic Prostate Cancer",
     "phase": "Phase III", "cancer_type": "prostate", "status": "active"},
]

INSURANCE_PROVIDERS = [
    {"name": "Blue Cross Blue Shield", "code": "BCBS"},
    {"name": "Aetna", "code": "AETNA"},
    {"name": "Cigna", "code": "CIGNA"},
    {"name": "UnitedHealthcare", "code": "UHC"},
    {"name": "Humana", "code": "HUMANA"},
    {"name": "Kaiser Permanente", "code": "KAISER"},
    {"name": "Anthem", "code": "ANTHEM"},
    {"name": "Medicare", "code": "MEDICARE"},
    {"name": "Medicaid", "code": "MEDICAID"},
    {"name": "Self-Pay", "code": "SELF"},
]

BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
BLOOD_TYPE_WEIGHTS = [0.336, 0.063, 0.083, 0.015, 0.034, 0.006, 0.374, 0.066]

STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
          "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
          "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
          "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
          "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"]


# ============================================================================
# Seed Data Generators
# ============================================================================

def hash_password(password: str) -> str:
    """Simple password hash for seeding."""
    salt = uuid.uuid4().hex[:16]
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}:{hashed.hex()}"


def generate_phone():
    return f"+1-{random.randint(200, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"


def generate_dob(min_age=18, max_age=90):
    days_offset = random.randint(min_age * 365, max_age * 365)
    return (datetime.utcnow() - timedelta(days=days_offset)).strftime("%Y-%m-%d")


def generate_hospitals():
    print("Generating hospitals...")
    hospitals = []
    for i in range(SEED_CONFIG["num_hospitals"]):
        addr = HOSPITAL_ADDRESSES[i]
        hospitals.append({
            "id": i + 1,
            "name": HOSPITAL_NAMES[i],
            "address": addr["address"],
            "city": addr["city"],
            "state": addr["state"],
            "zip_code": addr["zip"],
            "phone": generate_phone(),
            "email": f"admin@{HOSPITAL_NAMES[i].lower().replace(' ', '')}.com",
            "website": f"https://www.{HOSPITAL_NAMES[i].lower().replace(' ', '')}.com",
            "bed_count": random.randint(150, 500),
            "is_active": True,
            "accreditation": "Joint Commission",
            "npi": f"{random.randint(1000000000, 9999999999)}",
            "created_at": (datetime.utcnow() - timedelta(days=random.randint(365, 3650))).isoformat(),
        })
    print(f"  Generated {len(hospitals)} hospitals")
    return hospitals


def generate_departments(hospitals):
    print("Generating departments...")
    departments = []
    dept_id = 1
    for hospital in hospitals:
        num_depts = min(len(DEPARTMENTS), SEED_CONFIG["num_departments_per_hospital"])
        selected = random.sample(DEPARTMENTS, num_depts)
        for dept in selected:
            departments.append({
                "id": dept_id,
                "hospital_id": hospital["id"],
                "name": dept["name"],
                "code": dept["code"],
                "description": dept["description"],
                "head_of_department": f"Dr. {random.choice(LAST_NAMES)}",
                "phone_extension": f"x{random.randint(1000, 9999)}",
                "floor": random.randint(1, 10),
                "is_active": True,
            })
            dept_id += 1
    print(f"  Generated {len(departments)} departments")
    return departments


def generate_users_and_doctors(hospitals):
    print("Generating users and doctors...")
    users = []
    doctors = []
    user_id = 1

    # Admin users
    for i in range(SEED_CONFIG["num_admin_users"]):
        gender = random.choice(["male", "female"])
        first = random.choice(FIRST_NAMES_MALE if gender == "male" else FIRST_NAMES_FEMALE)
        last = random.choice(LAST_NAMES)
        users.append({
            "id": user_id,
            "email": f"admin{i + 1}@cancerguard.ai",
            "username": f"admin{i + 1}",
            "password_hash": hash_password("Admin@123"),
            "full_name": f"{first} {last}",
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "phone": generate_phone(),
            "hospital_id": hospitals[i % len(hospitals)]["id"],
            "created_at": datetime.utcnow().isoformat(),
        })
        user_id += 1

    # Doctors
    for hospital in hospitals:
        for j in range(SEED_CONFIG["num_doctors_per_hospital"]):
            gender = random.choice(["male", "female"])
            first = random.choice(FIRST_NAMES_MALE if gender == "male" else FIRST_NAMES_FEMALE)
            last = random.choice(LAST_NAMES)
            specialty = random.choice(SPECIALTIES)

            users.append({
                "id": user_id,
                "email": f"dr.{first.lower()}.{last.lower()}{user_id}@{hospital['name'].lower().replace(' ', '')}.com",
                "username": f"dr_{first.lower()}_{last.lower()}_{user_id}",
                "password_hash": hash_password("Doctor@123"),
                "full_name": f"Dr. {first} {last}",
                "role": "doctor",
                "is_active": True,
                "is_verified": True,
                "phone": generate_phone(),
                "hospital_id": hospital["id"],
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(30, 1825))).isoformat(),
            })

            doctors.append({
                "id": len(doctors) + 1,
                "user_id": user_id,
                "hospital_id": hospital["id"],
                "first_name": first,
                "last_name": last,
                "specialty": specialty,
                "license_number": f"MD-{random.randint(100000, 999999)}",
                "npi": f"{random.randint(1000000000, 9999999999)}",
                "years_of_experience": random.randint(2, 35),
                "education": f"{random.choice(['Harvard', 'Johns Hopkins', 'Stanford', 'Mayo Clinic', 'Cleveland Clinic'])} Medical School",
                "is_accepting_patients": random.random() > 0.1,
                "consultation_fee": round(random.uniform(100, 500), 2),
                "rating": round(random.uniform(3.5, 5.0), 1),
            })
            user_id += 1

    # Nurses
    for i in range(SEED_CONFIG["num_nurse_users"]):
        gender = random.choice(["male", "female"])
        first = random.choice(FIRST_NAMES_MALE if gender == "male" else FIRST_NAMES_FEMALE)
        last = random.choice(LAST_NAMES)
        users.append({
            "id": user_id,
            "email": f"nurse.{first.lower()}.{last.lower()}{user_id}@cancerguard.ai",
            "username": f"nurse_{first.lower()}_{last.lower()}_{user_id}",
            "password_hash": hash_password("Nurse@123"),
            "full_name": f"{first} {last}, RN",
            "role": "nurse",
            "is_active": True,
            "is_verified": True,
            "phone": generate_phone(),
            "hospital_id": hospitals[i % len(hospitals)]["id"],
            "created_at": (datetime.utcnow() - timedelta(days=random.randint(30, 1095))).isoformat(),
        })
        user_id += 1

    print(f"  Generated {len(users)} users ({SEED_CONFIG['num_admin_users']} admins, "
          f"{len(doctors)} doctors, {SEED_CONFIG['num_nurse_users']} nurses)")
    return users, doctors


def generate_patients(hospitals):
    print("Generating patients...")
    patients = []
    for i in range(SEED_CONFIG["num_patients"]):
        gender = random.choice(["male", "female"])
        first = random.choice(FIRST_NAMES_MALE if gender == "male" else FIRST_NAMES_FEMALE)
        last = random.choice(LAST_NAMES)
        blood_type = random.choices(BLOOD_TYPES, weights=BLOOD_TYPE_WEIGHTS, k=1)[0]
        insurance = random.choice(INSURANCE_PROVIDERS)

        patients.append({
            "id": i + 1,
            "mrn": f"MRN-{i + 1:06d}",
            "first_name": first,
            "last_name": last,
            "date_of_birth": generate_dob(18, 85),
            "gender": gender,
            "blood_type": blood_type,
            "email": f"{first.lower()}.{last.lower()}{i}@email.com",
            "phone": generate_phone(),
            "address": f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Elm', 'Park', 'Cedar', 'Maple'])} {random.choice(['St', 'Ave', 'Blvd', 'Dr', 'Ln'])}",
            "city": random.choice(["Springfield", "Columbus", "Madison", "Portland", "Denver"]),
            "state": random.choice(STATES),
            "zip_code": f"{random.randint(10000, 99999)}",
            "insurance_provider": insurance["name"],
            "insurance_id": f"{insurance['code']}-{uuid.uuid4().hex[:8].upper()}",
            "emergency_contact_name": f"{random.choice(FIRST_NAMES_MALE + FIRST_NAMES_FEMALE)} {last}",
            "emergency_contact_phone": generate_phone(),
            "allergies": random.choice([
                "None known", "Penicillin", "Aspirin", "Sulfa drugs",
                "Latex", "Iodine contrast", "Codeine", "NSAIDs",
                "Penicillin, Latex", "None known",
            ]),
            "hospital_id": hospitals[i % len(hospitals)]["id"],
            "primary_doctor_id": random.randint(1, SEED_CONFIG["num_hospitals"] * SEED_CONFIG["num_doctors_per_hospital"]),
            "is_active": True,
            "risk_level": random.choice(["low", "low", "moderate", "moderate", "high"]),
            "created_at": (datetime.utcnow() - timedelta(days=random.randint(1, 1825))).isoformat(),
        })
    print(f"  Generated {len(patients)} patients")
    return patients


def generate_appointments(patients, doctors):
    print("Generating appointments...")
    appointments = []
    appt_id = 1
    types = ["consultation", "follow_up", "screening", "treatment", "telehealth", "lab_work", "imaging"]
    statuses = ["scheduled", "completed", "cancelled", "no_show", "completed", "completed"]

    for patient in patients:
        num_appts = random.randint(1, SEED_CONFIG["num_appointments_per_patient"])
        for j in range(num_appts):
            doctor = random.choice(doctors)
            appt_type = random.choice(types)
            status = random.choice(statuses)
            days_offset = random.randint(-365, 60)
            start = datetime.utcnow() + timedelta(days=days_offset, hours=random.randint(8, 17))
            duration = random.choice([15, 30, 45, 60])

            appointments.append({
                "id": appt_id,
                "patient_id": patient["id"],
                "doctor_id": doctor["id"],
                "hospital_id": patient["hospital_id"],
                "appointment_type": appt_type,
                "specialty": doctor["specialty"],
                "start_time": start.isoformat(),
                "end_time": (start + timedelta(minutes=duration)).isoformat(),
                "duration_minutes": duration,
                "status": status,
                "reason": f"{appt_type.replace('_', ' ').title()} - {doctor['specialty']}",
                "notes": f"Patient notes for appointment #{appt_id}" if random.random() > 0.5 else "",
                "is_telehealth": appt_type == "telehealth",
                "location": f"Room {random.randint(100, 500)}",
                "created_at": (start - timedelta(days=random.randint(1, 30))).isoformat(),
            })
            appt_id += 1
    print(f"  Generated {len(appointments)} appointments")
    return appointments


def generate_vital_signs(patients):
    print("Generating vital signs...")
    vitals = []
    vital_id = 1
    for patient in patients:
        base_bp_sys = random.randint(105, 150)
        base_bp_dia = random.randint(60, 95)
        base_hr = random.randint(55, 95)
        base_temp = random.uniform(97.0, 99.0)

        num_records = random.randint(3, SEED_CONFIG["num_vital_signs_per_patient"])
        for j in range(num_records):
            recorded_at = datetime.utcnow() - timedelta(days=j * random.randint(5, 30))
            vitals.append({
                "id": vital_id,
                "patient_id": patient["id"],
                "recorded_at": recorded_at.isoformat(),
                "bp_systolic": base_bp_sys + random.randint(-10, 10),
                "bp_diastolic": base_bp_dia + random.randint(-8, 8),
                "heart_rate": base_hr + random.randint(-10, 10),
                "temperature": round(base_temp + random.uniform(-0.5, 1.5), 1),
                "respiratory_rate": random.randint(12, 22),
                "oxygen_saturation": random.randint(94, 100),
                "weight_kg": round(random.uniform(50, 120), 1),
                "height_cm": round(random.uniform(150, 195), 1),
                "pain_level": random.randint(0, 5),
            })
            vital_id += 1
    print(f"  Generated {len(vitals)} vital sign records")
    return vitals


def generate_lab_results(patients):
    print("Generating lab results...")
    results = []
    result_id = 1
    for patient in patients:
        num_labs = random.randint(2, SEED_CONFIG["num_lab_results_per_patient"])
        for j in range(num_labs):
            test = random.choice(LAB_TESTS)
            collection_date = datetime.utcnow() - timedelta(days=j * random.randint(15, 90))

            components = []
            for comp in test["components"]:
                value = round(random.uniform(
                    comp["normal_low"] * 0.7,
                    comp["normal_high"] * 1.3
                ), 2)
                flag = "N"
                if value < comp["normal_low"]:
                    flag = "L"
                elif value > comp["normal_high"]:
                    flag = "H"
                components.append({
                    "name": comp["name"],
                    "value": value,
                    "unit": comp["unit"],
                    "reference_range": comp["range"],
                    "flag": flag,
                })

            results.append({
                "id": result_id,
                "patient_id": patient["id"],
                "order_id": f"ORD-{result_id:06d}",
                "test_name": test["name"],
                "test_code": test["code"],
                "loinc_code": test["loinc"],
                "collection_date": collection_date.isoformat(),
                "result_date": (collection_date + timedelta(hours=random.randint(4, 72))).isoformat(),
                "status": "final",
                "components": components,
                "lab": random.choice(["LabCorp", "Quest Diagnostics", "Hospital Lab"]),
                "ordered_by": random.randint(1, 50),
            })
            result_id += 1
    print(f"  Generated {len(results)} lab results")
    return results


def generate_cancer_screenings(patients):
    print("Generating cancer screenings...")
    screenings = []
    screen_id = 1
    screening_map = {
        "breast": ["mammography", "breast_mri", "ultrasound"],
        "lung": ["low_dose_ct", "chest_xray"],
        "colon": ["colonoscopy", "fit_test", "cologuard"],
        "cervical": ["pap_smear", "hpv_test"],
        "prostate": ["psa_test", "digital_rectal_exam"],
        "skin": ["dermoscopy", "visual_exam"],
        "liver": ["ultrasound", "afp_test"],
    }

    for i in range(SEED_CONFIG["num_cancer_screenings"]):
        patient = random.choice(patients)
        cancer_type = random.choice(list(screening_map.keys()))
        screening_type = random.choice(screening_map[cancer_type])
        risk = round(random.uniform(0.01, 0.40), 3)

        screenings.append({
            "id": screen_id,
            "patient_id": patient["id"],
            "cancer_type": cancer_type,
            "screening_type": screening_type,
            "screening_date": (datetime.utcnow() - timedelta(days=random.randint(1, 730))).isoformat(),
            "result": random.choices(["normal", "abnormal", "indeterminate"], weights=[0.75, 0.15, 0.10])[0],
            "risk_score": risk,
            "risk_level": "low" if risk < 0.1 else "moderate" if risk < 0.25 else "high",
            "bi_rads": random.choice([1, 2, 3, 4, 5]) if cancer_type == "breast" else None,
            "next_screening_date": (datetime.utcnow() + timedelta(days=random.randint(90, 730))).strftime("%Y-%m-%d"),
            "ai_confidence": round(random.uniform(0.80, 0.99), 3),
            "performed_by": random.randint(1, 50),
            "facility_id": patient["hospital_id"],
            "notes": f"Routine {cancer_type} cancer screening",
        })
        screen_id += 1
    print(f"  Generated {len(screenings)} cancer screenings")
    return screenings


def generate_prescriptions(patients):
    print("Generating prescriptions...")
    prescriptions = []
    rx_id = 1
    for patient in patients:
        num_rx = random.randint(0, SEED_CONFIG["num_prescriptions_per_patient"])
        for j in range(num_rx):
            med = random.choice(MEDICATIONS)
            start = datetime.utcnow() - timedelta(days=random.randint(0, 365))
            prescriptions.append({
                "id": rx_id,
                "patient_id": patient["id"],
                "medication_name": med["name"],
                "rxnorm_code": med["rxnorm"],
                "medication_class": med["class"],
                "dosage": med["dose"],
                "route": med["route"],
                "frequency": random.choice(["once daily", "twice daily", "every 8 hours", "weekly", "biweekly"]),
                "start_date": start.isoformat(),
                "end_date": (start + timedelta(days=random.randint(30, 365))).isoformat(),
                "refills_remaining": random.randint(0, 11),
                "prescriber_id": random.randint(1, 50),
                "pharmacy": random.choice(["CVS", "Walgreens", "Rite Aid", "Hospital Pharmacy"]),
                "status": random.choice(["active", "active", "completed", "discontinued"]),
                "notes": f"Prescribed for {med['class']} therapy",
            })
            rx_id += 1
    print(f"  Generated {len(prescriptions)} prescriptions")
    return prescriptions


def generate_clinical_trials():
    print("Generating clinical trials...")
    trials = []
    for i, trial in enumerate(CLINICAL_TRIALS):
        trials.append({
            "id": i + 1,
            "nct_id": f"NCT{random.randint(10000000, 99999999)}",
            "title": trial["title"],
            "phase": trial["phase"],
            "cancer_type": trial["cancer_type"],
            "status": trial["status"],
            "principal_investigator": f"Dr. {random.choice(LAST_NAMES)}",
            "sponsor": random.choice(["NIH", "Pfizer", "Roche", "Merck", "Bristol-Myers Squibb", "AstraZeneca"]),
            "start_date": (datetime.utcnow() - timedelta(days=random.randint(30, 730))).strftime("%Y-%m-%d"),
            "estimated_end_date": (datetime.utcnow() + timedelta(days=random.randint(365, 1825))).strftime("%Y-%m-%d"),
            "target_enrollment": random.randint(50, 500),
            "current_enrollment": random.randint(10, 200),
            "eligibility_criteria": f"Adults 18+ with {trial['cancer_type']} cancer",
            "primary_endpoint": "Overall survival",
            "secondary_endpoints": ["Progression-free survival", "Objective response rate", "Quality of life"],
            "sites": random.randint(5, 50),
            "description": f"A randomized controlled trial investigating {trial['title'].lower()}.",
        })
    print(f"  Generated {len(trials)} clinical trials")
    return trials


# ============================================================================
# Main Seed Function
# ============================================================================

def main():
    """Run the database seeding process."""
    print("=" * 70)
    print("CancerGuard AI - Database Seed Script")
    print("=" * 70)
    print()

    random.seed(42)  # Reproducible data

    # Generate all data
    hospitals = generate_hospitals()
    departments = generate_departments(hospitals)
    users, doctors = generate_users_and_doctors(hospitals)
    patients = generate_patients(hospitals)
    appointments = generate_appointments(patients, doctors)
    vital_signs = generate_vital_signs(patients)
    lab_results = generate_lab_results(patients)
    cancer_screenings = generate_cancer_screenings(patients)
    prescriptions = generate_prescriptions(patients)
    clinical_trials = generate_clinical_trials()

    # Save to JSON files
    output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sample_data")
    os.makedirs(output_dir, exist_ok=True)

    datasets = {
        "hospitals": hospitals,
        "departments": departments,
        "users": users,
        "doctors": doctors,
        "patients": patients,
        "appointments": appointments,
        "vital_signs": vital_signs,
        "lab_results": lab_results,
        "cancer_screenings": cancer_screenings,
        "prescriptions": prescriptions,
        "clinical_trials": clinical_trials,
    }

    total_records = 0
    for name, data in datasets.items():
        filepath = os.path.join(output_dir, f"{name}.json")
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2, default=str)
        total_records += len(data)
        print(f"  Saved {len(data):>6} {name} -> {os.path.basename(filepath)}")

    print()
    print("=" * 70)
    print(f"Seed complete! Generated {total_records:,} total records")
    print(f"Data saved to: {output_dir}")
    print("=" * 70)


if __name__ == "__main__":
    main()
