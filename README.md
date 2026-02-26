# CancerGuard AI — Healthcare Intelligence Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MUI-5.15-007FFF?logo=mui" alt="Material UI" />
  <img src="https://img.shields.io/badge/SQLAlchemy-2.x-D71F00?logo=sqlalchemy" alt="SQLAlchemy" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Backend Documentation](#backend-documentation)
  - [Configuration](#configuration)
  - [Database Models](#database-models)
  - [API Endpoints](#api-endpoints)
  - [Authentication & Security](#authentication--security)
- [Frontend Documentation](#frontend-documentation)
  - [Portal System](#portal-system)
  - [Patient Portal](#patient-portal)
  - [Hospital Portal](#hospital-portal)
  - [Admin Portal](#admin-portal)
  - [Shared Components](#shared-components)
  - [API Service Layer](#api-service-layer)
  - [Type System](#type-system)
- [Feature Catalog](#feature-catalog)
- [Blood Donor System](#blood-donor-system)
- [AI & Machine Learning](#ai--machine-learning)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

**CancerGuard AI** is a full-stack healthcare intelligence platform designed for early cancer detection, patient health management, hospital operations, and blood donation coordination. The platform leverages AI/ML ensemble models to predict cancer risk from blood biomarkers, integrates smartwatch vitals, and provides comprehensive clinical tools across three portals.

### Key Highlights

- **457 REST API endpoints** across 38 modules
- **239 database tables** across 41 model files with full audit trailing
- **101 frontend pages** across 3 portals (Patient, Hospital, Admin)
- **31 mobile screens** across 4 portals (Patient, Hospital, Admin, Auth)
- **10 AI/ML models** with full training, inference, and explainability pipeline
- **AI cancer prediction** using XGBoost, LightGBM, Random Forest, Neural Network ensemble
- **Real-time smartwatch integration** (heart rate, SpO2, ECG, sleep, activity)
- **Blood donor matching** with Haversine geolocation and blood group compatibility
- **HIPAA-compliant** audit logging, encryption, and access control
- **6 React contexts**, **4 service modules**, **15 reusable components**, and **6 utility libraries**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 18)                      │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐        │
│  │ Patient   │  │  Hospital    │  │  Admin          │        │
│  │ Portal    │  │  Portal      │  │  Portal         │        │
│  │ (39 pages)│  │  (31 pages)  │  │  (22 pages)     │        │
│  └─────┬─────┘  └──────┬───────┘  └────────┬────────┘        │
│        │               │                   │                 │
│        └───────────────┼───────────────────┘                 │
│                        │                                     │
│              ┌─────────▼─────────┐                           │
│              │  API Service Layer│ (4 service files, Axios)  │
│              └─────────┬─────────┘                           │
└────────────────────────┼─────────────────────────────────────┘
                         │ HTTP/REST (proxy :3000 → :8000)
┌────────────────────────┼─────────────────────────────────────┐
│                   BACKEND (FastAPI)                           │
│              ┌─────────▼─────────┐                           │
│              │  38 API Routers   │ /api/v1/*                 │
│              └─────────┬─────────┘                           │
│        ┌───────────────┼───────────────────┐                 │
│  ┌─────▼─────┐  ┌──────▼──────┐  ┌────────▼────────┐       │
│  │ Auth/JWT  │  │ AI/ML Engine│  │  Business Logic  │       │
│  │ RBAC      │  │ Ensemble    │  │  CRUD, Matching  │       │
│  └───────────┘  └─────────────┘  └─────────────────┘       │
│              ┌─────────▼─────────┐                           │
│              │  SQLAlchemy ORM   │ (239 tables, async)       │
│              └─────────┬─────────┘                           │
│              ┌─────────▼─────────┐                           │
│              │   SQLite / Postgres│                           │
│              └───────────────────┘                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI (async, Python 3.13) |
| ORM | SQLAlchemy 2.x with `DeclarativeBase`, async session |
| Database | SQLite (dev) / PostgreSQL (prod) via `aiosqlite` / `asyncpg` |
| Authentication | JWT (HS256) — access tokens (15min) + refresh tokens (7 days) |
| Password Hashing | bcrypt via passlib |
| Configuration | Pydantic Settings with `.env` support |
| Middleware | CORS, request timing (`X-Process-Time`), rate limiting |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18.2 + TypeScript 4.9 |
| UI Library | Material UI 5.15 (MUI) + MUI X (DataGrid, Charts) |
| Charts | Recharts 2.10, Chart.js 4.4 + react-chartjs-2 |
| Routing | React Router DOM 6.21 |
| HTTP Client | Axios 1.6 with interceptors |
| Build Tool | Create React App (react-scripts 5.0.1) |

### Dependencies

**Frontend (package.json):**
```
@emotion/react, @emotion/styled, @mui/icons-material, @mui/material,
@mui/x-charts, @mui/x-data-grid, axios, chart.js, framer-motion, react,
react-chartjs-2, react-dom, react-router-dom, react-scripts, recharts,
typescript, web-vitals
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file (optional — defaults work)
cp .env.example .env

# Run the server
uvicorn app.main:app --reload --port 8001
```

The backend starts at `http://localhost:8001` with:
- **API docs (Swagger):** `http://localhost:8001/docs`
- **ReDoc:** `http://localhost:8001/redoc`
- **Health check:** `http://localhost:8001/health`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend starts at `http://localhost:3000` (or `http://localhost:3002` if port 3000 is in use) with proxy to the backend.

### First Run

1. Navigate to `http://localhost:3000/register`
2. Create an account (default role: `patient`)
3. Login to access the Patient Portal
4. Admin/hospital users require role assignment via API or database

---

## Project Structure

```
Cancer detection/
├── backend/
│   └── app/
│       ├── main.py                    # FastAPI app, lifespan, middleware, routers
│       ├── core/
│       │   ├── config.py              # 9 settings classes (DB, auth, AI, email, etc.)
│       │   ├── database.py            # SQLAlchemy async engine, Base, mixins
│       │   └── security.py            # JWT creation/validation, password hashing
│       ├── models/                    # 41 model files (239 tables)
│       │   ├── __init__.py            # Exports all 71 symbols (models + enums)
│       │   ├── user.py                # User, UserSession, UserPreference
│       │   ├── patient.py             # Patient, Demographics, Allergy, FamilyHistory
│       │   ├── hospital.py            # Hospital, Department, Staff, Doctor
│       │   ├── health_record.py       # HealthRecord
│       │   ├── blood_sample.py        # BloodSample, Biomarker, TestResult
│       │   ├── smartwatch_data.py     # 10 smartwatch models (Device, HR, SpO2, etc.)
│       │   ├── medication.py          # Medication, Prescription, Schedule, Adherence
│       │   ├── appointment.py         # Appointment
│       │   ├── cancer_screening.py    # Screening, RiskAssessment, Prediction, Markers
│       │   ├── notification.py        # Notification
│       │   ├── audit_log.py           # AuditLog
│       │   ├── vital_signs.py         # VitalSigns, VitalSignAlert
│       │   ├── lab_result.py          # LabTest, LabOrder, LabResult
│       │   ├── medical_image.py       # MedicalImage, ImageAnalysisResult
│       │   ├── insurance.py           # Insurance, InsuranceClaim, Provider
│       │   ├── report.py              # Report, Feedback, SystemConfig, FeatureFlag, etc.
│       │   └── blood_donor.py         # BloodDonor, BloodRequest, Match, DonationRecord
│       └── api/                       # 38 route files (457 endpoints)
│           ├── __init__.py            # Exports all routers
│           ├── auth.py                # Authentication (register, login, JWT)
│           ├── users.py               # User CRUD
│           ├── patients.py            # Patient profiles, health summary
│           ├── hospitals.py           # Hospital management
│           ├── health_records.py      # Medical records
│           ├── blood_samples.py       # Blood test management
│           ├── smartwatch.py          # Wearable device data
│           ├── cancer_detection.py    # AI risk prediction
│           ├── appointments.py        # Appointment scheduling
│           ├── notifications.py       # Notification management
│           ├── admin.py               # Admin dashboard, system health
│           ├── reports.py             # Patient reports
│           ├── analytics.py           # Platform analytics
│           └── blood_donor.py         # Blood donation (15 endpoints)
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx                    # 63 routes, lazy loading, ProtectedRoute
│       ├── index.tsx                  # React entry point
│       ├── context/
│       │   └── AuthContext.tsx         # Auth state, JWT management
│       ├── services/
│       │   └── api.ts                 # 29+ API modules, Axios interceptors
│       ├── types/
│       │   └── index.ts              # 60+ TypeScript interfaces
│       ├── components/
│       │   └── common/
│       │       ├── AppLayout.tsx       # Shared sidebar layout (3 portal themes)
│       │       └── SharedComponents.tsx# StatCard, GlassCard, MetricGauge, etc.
│       └── pages/
│           ├── LandingPage.tsx         # Public landing
│           ├── LoginPage.tsx           # Authentication
│           ├── RegisterPage.tsx        # Registration
│           ├── patient/               # 39 patient pages
│           ├── hospital/              # 31 hospital pages
│           └── admin/                 # 22 admin pages
│
└── README.md
```

---

## Backend Documentation

### Configuration

The backend uses **Pydantic Settings** with 9 sub-configuration classes. All settings can be overridden via environment variables.

| Config Class | Env Prefix | Key Settings |
|-------------|------------|-------------|
| `DatabaseSettings` | `DB_` | `url` (SQLite default), `echo`, pool size/overflow |
| `RedisSettings` | `REDIS_` | Host, port, db number (disabled by default) |
| `AuthSettings` | `AUTH_` | JWT secret, token expiry (60min/30day), password rules, Health ID format (`HID-XXXXXXXXXX`), OAuth2 (Google) |
| `AIModelSettings` | `AI_` | Ensemble models config, 46 blood biomarker features, SHAP importance, cancer risk thresholds (>0.7=high, >0.3=moderate), min accuracy 0.85 |
| `EmailSettings` | `EMAIL_` | SMTP host/port/credentials (disabled by default) |
| `UploadSettings` | `UPLOAD_` | Max 50MB, PDF/JPG/PNG/CSV/XLSX/DICOM |
| `NotificationSettings` | `NOTIFICATION_` | WebSocket, push, SMS, email toggles |
| `MonitoringSettings` | `MONITORING_` | Prometheus, Sentry DSN |
| `RateLimitSettings` | `RATELIMIT_` | Per-endpoint rate limits |

**Application Defaults:**
- Port: `8001` (development)
- CORS Origins: `localhost:3000`, `localhost:3002`, `localhost:8000`, `localhost:8001`
- Debug: `true` (dev mode)
- API Prefix: `/api/v1`

### Database Models

The database layer uses SQLAlchemy 2.x with async sessions. All models inherit from a `Base` class that provides:

- **Auto-generated UUID primary key** (`String(36)`)
- **Timestamps:** `created_at`, `updated_at` (auto-updated)
- **Soft delete:** `is_active`, `is_deleted` flags
- **Auto table naming** from class name (CamelCase → snake_case)
- **`to_dict()`** serialization helper
- **`soft_delete()`** method

**Available Mixins:**
- `TimestampMixin` — created/updated/deleted by user tracking
- `AuditMixin` — version counter, change_reason, IP address, user_agent
- `SoftDeleteMixin` — soft delete with timestamp and deleting user

#### Complete Model Reference (55 ORM Classes)

##### User & Authentication (3 models)

| Model | Table | Key Fields | Mixin |
|-------|-------|-----------|-------|
| `User` | `users` | email, password_hash, role (`UserRole` enum), status, health_id, first/last name, phone, address, 2FA settings | AuditMixin |
| `UserSession` | `user_sessions` | user_id, token, device_info, ip_address, expires_at | — |
| `UserPreference` | `user_preferences` | user_id, theme, language, notification_prefs (JSON) | — |

**`UserRole` enum:** `patient`, `doctor`, `nurse`, `hospital_admin`, `system_admin`, `super_admin`, `oncologist`, `surgeon`, `radiologist`, `pathologist`, `general_practitioner`, `specialist`

##### Patient (4 models)

| Model | Table | Key Fields | Mixin |
|-------|-------|-----------|-------|
| `Patient` | `patients` | user_id, health_id, DOB, gender, blood_type, height, weight, BMI, smoking/alcohol/exercise status, chronic conditions, cancer_risk_score, risk_category | AuditMixin |
| `PatientDemographics` | `patient_demographics` | patient_id, ethnicity, occupation, education, marital_status, income_range | — |
| `PatientAllergy` | `patient_allergies` | patient_id, allergen, type, severity (mild/moderate/severe/life-threatening), reaction, diagnosed_date | — |
| `PatientFamilyHistory` | `patient_family_history` | patient_id, relation, condition, age_at_diagnosis, cancer_type, genetic_testing | — |

##### Hospital (4 models)

| Model | Table | Key Fields | Mixin |
|-------|-------|-----------|-------|
| `Hospital` | `hospitals` | name, code, type, beds, cancer_center, ai_integration, latitude, longitude, rating, accreditation | AuditMixin |
| `HospitalDepartment` | `hospital_departments` | hospital_id, name, code, head_doctor, beds, specialization, floor | AuditMixin |
| `HospitalStaff` | `hospital_staff` | hospital_id, user_id, employee_id, department, position, specialization | AuditMixin |
| `Doctor` | `doctors` | hospital_id, user_id, license_number, specialization, years_experience, qualifications, consultation_fee, rating | AuditMixin |

##### Health Records (1 model)

| Model | Table | Key Fields | Mixin |
|-------|-------|-----------|-------|
| `HealthRecord` | `health_records` | patient_id, hospital_id, doctor_id, record_number, type, category, diagnosis, treatment, cancer_related, ai_risk_score, notes, attachments | AuditMixin |

##### Blood Samples (3 models)

| Model | Table | Key Fields | Mixin |
|-------|-------|-----------|-------|
| `BloodSample` | `blood_samples` | patient_id, sample_number, test_type, collection_date, lab_name, fasting, ai_analysis_done, risk_level, risk_score | AuditMixin |
| `BloodBiomarker` | `blood_biomarkers` | sample_id, marker_name, value, unit, reference_min/max, is_abnormal, is_critical | — |
| `BloodTestResult` | `blood_test_results` | sample_id, test_name, result, interpretation | AuditMixin |

##### Smartwatch & Wearables (10 models)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `SmartwatchDevice` | `smartwatch_devices` | user_id, device_name, model, os, firmware, mac_address, battery_level, last_sync |
| `SmartwatchData` | `smartwatch_data` | device_id, heart_rate, steps, calories, spo2, stress_level, sleep_hours |
| `HeartRateData` | `heart_rate_data` | device_id, bpm, variability, source |
| `SpO2Data` | `spo2_data` | device_id, saturation_percent, perfusion_index |
| `SleepData` | `sleep_data` | device_id, duration, deep/light/rem/awake stages, quality_score |
| `ActivityData` | `activity_data` | device_id, steps, calories, distance, active_minutes, exercise_type |
| `ECGData` | `ecg_data` | device_id, heart_rhythm, classification, pdf_report |
| `StressData` | `stress_data` | device_id, stress_level, hrv, relaxation_score |
| `TemperatureData` | `temperature_data` | device_id, skin_temperature, ambient_temp |
| `BloodPressureEstimate` | `blood_pressure_estimates` | device_id, systolic, diastolic, pulse |

##### Medications & Prescriptions (4 models)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `Medication` | `medications` | name, generic_name, dosage_form, strength, route, cancer_related, side_effects |
| `Prescription` | `prescriptions` | patient_id, doctor_id, prescription_number, medications (JSON), status, pharmacy |
| `MedicationSchedule` | `medication_schedules` | prescription_id, medication_id, scheduled_times, reminder_enabled |
| `MedicationAdherence` | `medication_adherence` | schedule_id, date, taken, missed_reason |

##### Cancer Screening & Detection (5 models)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `CancerScreening` | `cancer_screenings` | patient_id, cancer_type, method, results, stage, date |
| `CancerRiskAssessment` | `cancer_risk_assessments` | patient_id, risk_score, risk_category, factors (JSON), recommendations, model_version |
| `CancerPrediction` | `cancer_predictions` | patient_id, model_name, prediction_probability, features_used, shap_values |
| `ScreeningRecommendation` | `screening_recommendations` | patient_id, test_name, frequency, next_due_date, priority |
| `TumorMarker` | `tumor_markers` | patient_id, marker_name, value, unit, trend |

##### Appointments (1 model)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `Appointment` | `appointments` | patient_id, doctor_id, hospital_id, type, status, date, duration, telemedicine, notes |

##### Notifications (1 model)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `Notification` | `notifications` | user_id, type, priority (low/medium/high/critical), title, message, is_read, action_url |

**`NotificationType` enum (21 types):** `APPOINTMENT_REMINDER`, `APPOINTMENT_CONFIRMED`, `APPOINTMENT_CANCELLED`, `LAB_RESULTS_READY`, `MEDICATION_REMINDER`, `CANCER_RISK_UPDATE`, `HEALTH_GOAL_ACHIEVED`, `DOCTOR_MESSAGE`, `SYSTEM_ALERT`, `BLOOD_TEST_ALERT`, `VITAL_SIGN_ALERT`, `INSURANCE_UPDATE`, `EMERGENCY_ALERT`, `SCREENING_DUE`, `WELLNESS_TIP`, `DEVICE_ALERT`, `REPORT_READY`, `TREATMENT_UPDATE`, `BLOOD_DONATION_REQUEST`, `BLOOD_DONATION_ACCEPTED`, `BLOOD_DONATION_DECLINED`

##### Audit & Logging (1 model)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `AuditLog` | `audit_logs` | user_id, action, resource_type, resource_id, ip_address, timestamp, status, details |

##### Vital Signs (2 models)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `VitalSigns` | `vital_signs` | patient_id, heart_rate, blood_pressure_systolic/diastolic, temperature, spo2, respiratory_rate, recorded_at |
| `VitalSignAlert` | `vital_sign_alerts` | vital_sign_id, alert_type, severity, message, acknowledged |

##### Lab Results (3 models)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `LabTest` | `lab_tests` | name, code, category, reference_ranges (JSON), unit, description |
| `LabOrder` | `lab_orders` | patient_id, doctor_id, order_number, priority, status, tests (JSON) |
| `LabResult` | `lab_results` | order_id, test_id, value, unit, interpretation, flags, abnormal |

##### Medical Imaging (2 models)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `MedicalImage` | `medical_images` | patient_id, modality (CT/MRI/X-ray/Ultrasound/PET/Mammogram), file_path, description |
| `ImageAnalysisResult` | `image_analysis_results` | image_id, ai_model, findings, confidence, annotations |

##### Insurance (3 models)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `Insurance` | `insurance` | patient_id, provider_id, policy_number, coverage_type, valid_from/to |
| `InsuranceClaim` | `insurance_claims` | insurance_id, claim_number, amount, status, diagnosis_codes |
| `InsuranceProvider` | `insurance_providers` | name, code, contact, network_type |

##### Reports & System (7 models)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `EmergencyContact` | `emergency_contacts` | patient_id, name, relationship, phone, is_primary |
| `Device` | `devices` | user_id, device_type, status, serial_number, firmware |
| `ReportTemplate` | `report_templates` | name, format, sections, description |
| `Report` | `reports` | patient_id, title, type, generated_date, file_path, template_id |
| `Feedback` | `feedback` | user_id, type, rating, comments, status |
| `SystemConfig` | `system_configs` | key, value, description, editable |
| `FeatureFlag` | `feature_flags` | name, enabled, description, rollout_percentage |
| `MaintenanceWindow` | `maintenance_windows` | title, start_time, end_time, description, affected_services |

##### Blood Donor (4 models)

| Model | Table | Key Fields |
|-------|-------|-----------|
| `BloodDonor` | `blood_donors` | user_id, blood_group, latitude/longitude, max_distance_km, is_eligible, last_donation_date, total_donations, notification_preference |
| `BloodRequest` | `blood_requests` | requester_id, hospital_id, blood_group, units_needed/fulfilled, urgency, status, latitude/longitude, search_radius_km, deadline |
| `BloodDonorMatch` | `blood_donor_matches` | request_id, donor_id, distance_km, status, responded_at, donation_date |
| `DonationRecord` | `donation_records` | donor_id, match_id, hospital_id, donation_date, units_donated, hemoglobin_level, blood_pressure, weight, certificate_number |

### API Endpoints

All endpoints are prefixed with `/api/v1`. Authentication is via JWT Bearer token unless specified.

#### Authentication (`/api/v1/auth`) — 6 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/register` | Register a new user account | No |
| `POST` | `/login` | Login and receive JWT tokens | No |
| `POST` | `/refresh` | Refresh access token using refresh token | No |
| `GET` | `/me` | Get current authenticated user | Yes |
| `POST` | `/change-password` | Change user password | Yes |
| `POST` | `/logout` | Invalidate current session | Yes |

#### Users (`/api/v1/users`) — 5 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List all users (admin) | Admin |
| `GET` | `/{user_id}` | Get user by ID | Yes |
| `PUT` | `/{user_id}` | Update user | Yes |
| `PUT` | `/{user_id}/admin` | Admin update user (role, status) | Admin |
| `DELETE` | `/{user_id}` | Delete user (soft delete) | Admin |

#### Patients (`/api/v1/patients`) — 7 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/me` | Get my patient profile | Patient |
| `PUT` | `/me` | Update my patient profile | Patient |
| `GET` | `/me/health-summary` | Get comprehensive health summary | Patient |
| `GET` | `/health-id/{health_id}` | Lookup patient by Health ID | Yes |
| `GET` | `/{patient_id}` | Get patient details | Doctor/Admin |
| `POST` | `/me/allergies` | Add allergy record | Patient |
| `POST` | `/me/family-history` | Add family medical history | Patient |

#### Hospitals (`/api/v1/hospitals`) — 7 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List all hospitals | Yes |
| `GET` | `/{hospital_id}` | Get hospital details | Yes |
| `POST` | `/` | Create hospital | Admin |
| `PUT` | `/{hospital_id}` | Update hospital | Hospital Admin |
| `GET` | `/{hospital_id}/dashboard` | Get hospital dashboard stats | Hospital |
| `GET` | `/{hospital_id}/doctors` | List hospital doctors | Yes |
| `POST` | `/{hospital_id}/departments` | Create department | Hospital Admin |

#### Health Records (`/api/v1/health-records`) — 4 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/my` | Get my health records | Patient |
| `GET` | `/by-health-id/{health_id}` | Get records by Health ID | Doctor |
| `POST` | `/` | Create health record | Doctor |
| `GET` | `/{record_id}` | Get specific record | Yes |

#### Blood Samples (`/api/v1/blood-samples`) — 5 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/my` | Get my blood samples | Patient |
| `POST` | `/` | Create blood sample | Doctor |
| `POST` | `/{sample_id}/biomarkers` | Add biomarker to sample | Doctor |
| `GET` | `/{sample_id}/biomarkers` | Get biomarkers for sample | Yes |
| `POST` | `/{sample_id}/analyze` | Run AI analysis on blood sample | Doctor |

#### Smartwatch (`/api/v1/smartwatch`) — 4 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/dashboard` | Smartwatch vitals dashboard | Patient |
| `POST` | `/data` | Ingest smartwatch data | Patient |
| `GET` | `/data` | Retrieve smartwatch data | Patient |
| `POST` | `/devices/register` | Register new wearable device | Patient |

#### Cancer Detection (`/api/v1/cancer-detection`) — 3 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/predict/{patient_id}` | Run AI cancer risk prediction | Doctor |
| `GET` | `/risk-history/{patient_id}` | Get cancer risk score history | Yes |
| `POST` | `/screenings` | Create screening record | Doctor |

#### Appointments (`/api/v1/appointments`) — 3 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/my` | Get my appointments | Yes |
| `POST` | `/` | Create appointment | Yes |
| `PUT` | `/{appointment_id}/status` | Update appointment status | Doctor |

#### Notifications (`/api/v1/notifications`) — 3 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Get my notifications | Yes |
| `PUT` | `/{notification_id}/read` | Mark notification as read | Yes |
| `PUT` | `/read-all` | Mark all notifications as read | Yes |

#### Admin (`/api/v1/admin`) — 5 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/dashboard` | Admin dashboard statistics | Admin |
| `GET` | `/users/stats` | User registration & activity stats | Admin |
| `GET` | `/risk-distribution` | Cancer risk distribution data | Admin |
| `POST` | `/seed-data` | Seed database with sample data | SuperAdmin |
| `GET` | `/system-health` | System health check (DB, memory, disk) | Admin |

#### Reports (`/api/v1/reports`) — 1 endpoint

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/patient-summary/{patient_id}` | Generate patient summary report | Doctor |

#### Analytics (`/api/v1/analytics`) — 2 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/overview` | Platform analytics overview | Admin |
| `GET` | `/risk-trends` | Cancer risk trend analysis | Admin |

#### Blood Donor (`/api/v1/blood-donor`) — 14 endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/register` | Register as blood donor | Patient |
| `GET` | `/profile` | Get my donor profile | Patient |
| `PUT` | `/profile` | Update donor profile | Patient |
| `PUT` | `/toggle` | Toggle donor availability | Patient |
| `PUT` | `/location` | Update donor geolocation | Patient |
| `POST` | `/request` | Create blood request | Yes |
| `GET` | `/requests` | List active blood requests | Yes |
| `GET` | `/requests/{request_id}` | Get request details | Yes |
| `GET` | `/my-requests` | Get my blood requests | Yes |
| `GET` | `/incoming` | Get incoming donation requests | Patient |
| `PUT` | `/respond/{match_id}` | Accept/decline donation match | Patient |
| `GET` | `/history` | Get donation history | Patient |
| `GET` | `/stats` | Get donor statistics | Patient |
| `GET` | `/nearby` | Find nearby compatible donors | Yes |

### Authentication & Security

**JWT Flow:**
1. User registers → account created with hashed password
2. User logs in → receives `access_token` (60min) + `refresh_token` (30 days)
3. All API requests include `Authorization: Bearer <access_token>`
4. On expiry, client calls `/auth/refresh` with refresh token
5. Token validation checks expiry, user existence, and session validity

**Health ID:**
- Auto-generated on registration: `HID-XXXXXXXXXX` (10 alphanumeric chars)
- Unique patient identifier for cross-hospital record lookup

**Role-Based Access Control (RBAC):**
```
Roles: patient, doctor, nurse, hospital_admin, system_admin, super_admin,
       oncologist, surgeon, radiologist, pathologist, general_practitioner, specialist
```

**Password Requirements:**
- Minimum 8 characters
- Complexity validation via configurable rules

---

## Frontend Documentation

### Portal System

The app uses a **shared layout architecture** (`AppLayout`) with three themed portals:

| Portal | Color Theme | Target Users | Pages |
|--------|------------|-------------|-------|
| Patient | Deep Navy (`#0d1b2a`) | Patients | 39 pages |
| Hospital | Indigo (`#1a237e`) | Doctors, Nurses, Hospital Admin | 31 pages |
| Admin | Dark Purple (`#1b1b2f`) | System Admin, Super Admin | 22 pages |

**AppLayout Features:**
- Collapsible sidebar with section grouping
- Compact navigation with scrollable area
- Active route highlighting with accent border
- User card with role display
- Top AppBar with search, notifications, profile menu
- Health ID badge display
- Responsive: drawer becomes temporary on mobile

### Patient Portal (39 Pages)

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/patient` | Health overview, risk scores, recent activity, quick actions, charts |
| **Cancer Risk** | `/patient/cancer-risk` | AI cancer risk assessment, SHAP explanations, risk history charts |
| **Health Records** | `/patient/records` | Medical record viewer, categorized by type, search & filter |
| **Blood Tests** | `/patient/blood-tests` | Blood sample list, biomarker results, trend analysis, AI analysis |
| **Vital Signs** | `/patient/vitals` | Heart rate, BP, temperature, SpO2, respiratory rate tracking |
| **Smartwatch** | `/patient/smartwatch` | Device management, real-time vitals, sleep/activity/ECG data |
| **Wearable Enhanced** | `/patient/wearable` | Advanced wearable analytics, glucose, gait, respiratory |
| **Appointments** | `/patient/appointments` | Book/view appointments, telemedicine links, doctor selection |
| **Medications** | `/patient/medications` | Current prescriptions, schedule, adherence tracking, reminders |
| **Find Hospitals** | `/patient/hospitals` | Hospital directory, search by specialization, ratings, location |
| **Treatment Plan** | `/patient/treatment` | Active treatment plans, phases, clinical trial enrollment |
| **Screening Schedule** | `/patient/screening` | Cancer screening calendar, recommended tests, guideline adherence |
| **Cancer Screening** | `/patient/cancer-screening` | Full screening workflow, results, staging |
| **Symptom Checker** | `/patient/symptoms` | AI-powered symptom assessment, severity indicators, recommendations |
| **Health Goals** | `/patient/goals` | Set/track health goals, progress visualization, achievements |
| **Communication Hub** | `/patient/communication` | Secure messaging, care team, referrals, consent forms |
| **Diet & Nutrition** | `/patient/diet` | Meal planning, nutrition logs, anti-cancer food recommendations |
| **Nutrition Enhanced** | `/patient/nutrition` | Advanced nutrition assessment, hydration, enteral nutrition |
| **Mental Wellness** | `/patient/mental-health` | Mental health assessments, therapy sessions, mood tracking |
| **Mental Health Enhanced** | `/patient/mental-health-enhanced` | CBT, mindfulness, crisis intervention, safety plans |
| **Exercise & Fitness** | `/patient/exercise` | Exercise logging, fitness goals, activity recommendations |
| **Genetic Profile** | `/patient/genetics` | Genetic markers, pharmacogenomics, hereditary risk analysis |
| **Genomics** | `/patient/genomics` | Liquid biopsy, gene expression, sequencing data |
| **Family Health** | `/patient/family-health` | Family tree builder, hereditary condition tracking, risk analysis |
| **Blood Donor** | `/patient/blood-donor` | Register as donor, manage availability, respond to requests |
| **Clinical Pathways** | `/patient/clinical-pathways` | Clinical decision pathways, guidelines |
| **Documents** | `/patient/documents` | Upload/manage medical reports, scan results |
| **Insurance** | `/patient/insurance` | Policy management, claims tracking, coverage details |
| **Billing** | `/patient/billing` | Invoices, payments, cost estimates |
| **Telehealth** | `/patient/telehealth` | Video consultations, remote monitoring |
| **Messages** | `/patient/messages` | Secure messaging with healthcare providers |
| **Education** | `/patient/education` | Health literacy resources, quizzes, learning modules |
| **Social Determinants** | `/patient/sdoh` | SDOH assessments, community resources, food insecurity |
| **Rehabilitation** | `/patient/rehabilitation` | Rehab plans, therapy sessions, functional assessments |
| **Research & Trials** | `/patient/research` | Clinical trial enrollment, research participation |
| **Patient Engagement** | `/patient/engagement` | Gamification, challenges, peer support, rewards |
| **Notifications** | `/patient/notifications` | All notifications with filtering, mark read, action links |
| **Settings** | `/patient/settings` | App preferences, notification settings |
| **Profile** | `/patient/profile` | Personal info, settings, emergency contacts, preferences |

### Hospital Portal (31 Pages)

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/hospital` | Hospital KPIs, bed occupancy, daily stats, revenue, patient flow |
| **Patient Management** | `/hospital/patients` | Patient directory, admissions, discharge, health records access |
| **Doctor Management** | `/hospital/doctors` | Doctor roster, specializations, schedules, assignments |
| **Doctor Dashboard** | `/hospital/doctor-dashboard` | Individual doctor view, caseload, upcoming appointments |
| **Staff Directory** | `/hospital/staff` | Staff directory, departments, roles, shifts |
| **Appointments** | `/hospital/appointments` | Hospital-wide appointment management, scheduling |
| **Lab Management** | `/hospital/lab` | Lab order management, test queue, result entry, alerts |
| **Bed Management** | `/hospital/beds` | Bed allocation, ward management, occupancy tracking |
| **AI Analytics** | `/hospital/ai-analytics` | AI-powered analytics, risk distributions, prediction models |
| **Reports** | `/hospital/reports` | Hospital reports, patient summaries, compliance reports |
| **Settings** | `/hospital/settings` | Hospital configuration, departments, staff management |
| **Surgery** | `/hospital/surgery` | OR scheduling, surgery list, pre-op/post-op management |
| **Pharmacy** | `/hospital/pharmacy` | Drug inventory, prescription dispensing, stock alerts |
| **Pharmacy Enhanced** | `/hospital/pharmacy-enhanced` | Formulary, medication reconciliation, controlled substances |
| **Radiology** | `/hospital/radiology` | Imaging studies, AI analysis requests, DICOM viewer |
| **Radiology Enhanced** | `/hospital/radiology-enhanced` | AI reads, tumor measurements, dose tracking |
| **Pathology** | `/hospital/pathology` | Specimen tracking, slides, staining protocols, tumor boards |
| **Emergency** | `/hospital/emergency` | ED dashboard, triage, case management, wait times |
| **Emergency Enhanced** | `/hospital/emergency-enhanced` | Sepsis/stroke screening, rapid response |
| **Telemedicine** | `/hospital/telemedicine` | Virtual consultation sessions, video/chat |
| **Clinical Trials** | `/hospital/clinical-trials` | Trial management, patient enrollment, progress |
| **Clinical Trials V2** | `/hospital/clinical-trials-v2` | Enhanced protocol management, adverse events |
| **Clinical Decision** | `/hospital/clinical-decision` | Guidelines, calculators, drug interactions |
| **Genomics Lab** | `/hospital/genomics` | Sequencing workflows, variant analysis |
| **Quality Metrics** | `/hospital/quality` | Patient satisfaction, clinical outcomes, benchmarking |
| **Quality & Safety** | `/hospital/quality-safety` | Adverse events, incident reports, infection control |
| **Population Health** | `/hospital/population-health` | Disease registries, care gaps, health equity |
| **Nutrition Management** | `/hospital/nutrition` | Dietary orders, enteral nutrition |
| **Rehabilitation** | `/hospital/rehabilitation` | Therapy programs, functional assessments |
| **Supply Chain** | `/hospital/supply-chain` | Inventory, purchase orders, asset tracking |
| **Blood Bank** | `/hospital/blood-bank` | Blood inventory, requests, donor matching, transfusion records |

### Admin Portal (22 Pages)

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/admin` | Platform stats, user growth, system health, recent activity |
| **User Management** | `/admin/users` | CRUD users, role assignment, status management, bulk actions |
| **Hospital Management** | `/admin/hospitals` | Register/manage hospitals, metrics, compliance status |
| **System Monitoring** | `/admin/system` | Server health, memory, disk, DB connections, uptime |
| **AI Model Management** | `/admin/ai-models` | Model versions, accuracy metrics, retraining, A/B testing |
| **Security** | `/admin/security` | Access logs, threat detection, IP blocking, compliance |
| **Platform Analytics** | `/admin/analytics` | User engagement, feature usage, growth trends |
| **Audit Logs** | `/admin/audit-logs` | Complete audit trail, filterable by user/action/resource |
| **Reports** | `/admin/reports` | Platform-wide reports, export capabilities |
| **Configuration** | `/admin/config` | System configuration key-value store, feature flags |
| **Notifications** | `/admin/notifications` | Broadcast notifications, templates, scheduling |
| **Compliance** | `/admin/compliance` | HIPAA status, audit schedules, compliance reports |
| **Data Management** | `/admin/data-management` | Backups, storage stats, retention policies, data quality |
| **Billing** | `/admin/billing` | Subscription management, revenue tracking |
| **Integrations** | `/admin/integrations` | Third-party API connections, health checks |
| **Education Management** | `/admin/education` | Content management for education resources |
| **Population Health Admin** | `/admin/population-health` | Public health campaigns, disease tracking |
| **Quality Dashboard** | `/admin/quality` | System-wide quality metrics |
| **Research Portal** | `/admin/research` | Research study management, IRB submissions |
| **Social Determinants Admin** | `/admin/sdoh` | Community program management |
| **Workforce Management** | `/admin/workforce` | Staffing, scheduling, credentialing |
| **Training Center** | `/admin/training` | Staff training courses, certifications, progress tracking |

### Shared Components

Located in `frontend/src/components/common/`:

**`AppLayout`** — Core layout wrapper used by all pages
- Props: `children`, `title`, `navItems`, `portalType`, `subtitle`
- Features: Collapsible sidebar, theme-based colors, responsive design, section grouping with collapse/expand, scrollable navigation, sign out button

**`SharedComponents`** — Reusable UI components:
- `StatCard` — Metric display with icon, value, trend indicator
- `ProgressCard` — Progress bar with label and percentage
- `MetricGauge` — Circular gauge for metrics (risk scores, etc.)
- `GlassCard` — Glassmorphism styled card container
- `SectionHeader` — Section title with optional action button
- `StatusBadge` — Color-coded status indicators
- `TimelineItem` — Chronological event display

### API Service Layer

The `services/api.ts` file contains **29+ API modules** built on Axios with:

- **Base URL:** `/api/v1` (proxied in development from port 3000/3002 to backend port 8001)
- **Request interceptor:** Auto-attaches JWT Bearer token
- **Response interceptor:** Auto-refreshes token on 401, redirects to login on failure

| Module | Methods | Purpose |
|--------|---------|---------|
| `authAPI` | 6 | Registration, login, token management |
| `usersAPI` | 5 | User CRUD operations |
| `patientsAPI` | 7 | Patient profile and health data |
| `hospitalsAPI` | 6 | Hospital directory and management |
| `healthRecordsAPI` | 4 | Medical records CRUD |
| `bloodSamplesAPI` | 5 | Blood test management |
| `smartwatchAPI` | 4 | Wearable device data |
| `cancerDetectionAPI` | 3 | AI prediction and risk history |
| `appointmentsAPI` | 3 | Scheduling and status |
| `notificationsAPI` | 3 | Notification management |
| `adminAPI` | 5 | Admin dashboard and operations |
| `reportsAPI` | 1 | Patient report generation |
| `analyticsAPI` | 2 | Platform analytics |
| `geneticsAPI` | 4 | Genetic profiles and markers |
| `dietAPI` | 5 | Nutrition planning |
| `mentalHealthAPI` | 5 | Mental health tools |
| `treatmentAPI` | 4 | Treatment plan management |
| `exerciseAPI` | 4 | Fitness tracking |
| `screeningAPI` | 4 | Cancer screening schedules |
| `familyHealthAPI` | 4 | Family health tree |
| `secondOpinionAPI` | 3 | Second opinion requests |
| `surgeryAPI` | 5 | Surgical operations |
| `pharmacyAPI` | 5 | Pharmacy management |
| `radiologyAPI` | 4 | Medical imaging |
| `emergencyAPI` | 4 | Emergency department |
| `clinicalTrialsAPI` | 4 | Clinical trial management |
| `telemedicineAPI` | 4 | Telemedicine sessions |
| `qualityAPI` | 4 | Quality metrics |
| `complianceAPI` | 4 | Compliance tracking |
| `dataManagementAPI` | 5 | Data operations and backups |
| `billingAPI` | 4 | Billing and subscriptions |
| `integrationAPI` | 5 | Third-party integrations |
| `trainingAPI` | 4 | Training courses |
| `bloodDonorAPI` | 14 | Blood donation coordination |

### Type System

The `types/index.ts` file defines **60+ TypeScript interfaces** providing full type safety across the application:

**Core Types:** `User`, `AuthTokens`, `Patient`, `Hospital`, `HealthRecord`, `BloodSample`, `Biomarker`, `CancerRisk`, `Notification`, `DashboardStats`

**Clinical Types:** `Appointment`, `Medication`, `Allergy`, `FamilyHistory`, `EmergencyContact`, `VitalSign`, `Doctor`, `Department`, `LabOrder`, `BedInfo`, `Symptom`, `Prescription`, `PrescriptionItem`

**Wellness Types:** `HealthGoal`, `DietPlan`, `MealPlan`, `FoodItem`, `NutritionLog`, `MentalHealthAssessment`, `TherapySession`, `ExerciseSession`, `FitnessGoal`

**Advanced Types:** `GeneticProfile`, `GeneticMarker`, `PharmacogenomicResult`, `TreatmentPlan`, `TreatmentPhase`, `ScreeningSchedule`, `FamilyMember`, `FamilyCancerRecord`, `SecondOpinion`

**Hospital Types:** `Surgery`, `PharmacyItem`, `ImagingStudy`, `EmergencyCase`, `ClinicalTrial`, `TelemedicineSession`, `QualityMetric`

**Admin Types:** `AuditLog`, `SystemHealth`, `Report`, `ComplianceRecord`, `DataBackup`, `PlatformBilling`, `Integration`, `TrainingCourse`

**Blood Donor Types:** `BloodDonor`, `BloodRequest`, `BloodDonorMatch`, `DonationRecord`

**Data Types:** `ChartDataPoint`, `TimeSeriesData`, `Message`

---

## Feature Catalog

### Patient-Facing Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | AI Cancer Risk Assessment | Ensemble ML prediction (XGBoost, LightGBM, RF, Neural Net) from blood biomarkers |
| 2 | SHAP Explanations | Feature importance visualization for AI predictions |
| 3 | Health Records Portal | Unified medical record viewer with category filters |
| 4 | Blood Test Analytics | Biomarker tracking, trend charts, abnormal value alerts |
| 5 | Smartwatch Integration | Real-time vitals from wearable devices (HR, SpO2, sleep, ECG) |
| 6 | Appointment Booking | Schedule in-person and telemedicine consultations |
| 7 | Medication Tracking | Prescription management, reminders, adherence metrics |
| 8 | Symptom Checker | AI-powered symptom assessment with severity scoring |
| 9 | Health Goals | Goal setting and progress tracking with achievements |
| 10 | Diet & Nutrition | Meal planning, nutrition logging, anti-cancer food guide |
| 11 | Mental Wellness | Assessments, mood tracking, therapy session management |
| 12 | Exercise & Fitness | Workout logging, fitness goals, activity recommendations |
| 13 | Genetic Profile | Hereditary risk markers, pharmacogenomics, BRCA analysis |
| 14 | Family Health Tree | Interactive family health history builder |
| 15 | Blood Donor | Register, manage availability, geo-matching, donation tracking |
| 16 | Screening Calendar | Personalized cancer screening schedules per guidelines |
| 17 | Treatment Plans | View active treatment phases, clinical trial enrollment |
| 18 | Vital Signs Monitoring | Track BP, HR, temperature, SpO2, respiratory rate |
| 19 | Hospital Finder | Search hospitals by specialization, location, ratings |
| 20 | Health Timeline | Chronological health event stream |
| 21 | Real-time Notifications | Push notifications for appointments, results, alerts |
| 22 | Health ID System | Universal patient identifier (`HID-XXXXXXXXXX`) |

### Hospital-Facing Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Hospital Dashboard | KPIs, daily stats, bed occupancy, patient flow |
| 2 | Patient Management | Full patient directory, admissions, discharge workflows |
| 3 | Doctor/Staff Management | Staff directory, scheduling, role assignments |
| 4 | Lab Management | Order queue, result entry, abnormal value alerts |
| 5 | Bed Management | Ward allocation, real-time occupancy tracking |
| 6 | AI Analytics | Risk distribution analysis, predictive insights |
| 7 | Surgery Management | OR scheduling, pre-op/post-op tracking |
| 8 | Pharmacy | Drug inventory, dispensing, stock alerts |
| 9 | Radiology | Imaging studies, AI analysis, DICOM support |
| 10 | Emergency Department | Triage, case management, wait time monitoring |
| 11 | Telemedicine | Virtual consultation sessions |
| 12 | Clinical Trials | Trial creation, patient enrollment, progress |
| 13 | Quality Metrics | Patient satisfaction, outcome benchmarking |
| 14 | Blood Bank | Inventory, requests, donor matching, transfusion records |
| 15 | Hospital Reports | Clinical and compliance report generation |

### Admin Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Platform Dashboard | User growth, system health overview |
| 2 | User Management | CRUD, role assignment, account status |
| 3 | Hospital Onboarding | Register and manage hospital accounts |
| 4 | System Monitoring | Server metrics, DB health, uptime tracking |
| 5 | AI Model Management | Version tracking, accuracy metrics, retraining |
| 6 | Security & Compliance | Access logs, HIPAA compliance, threat detection |
| 7 | Audit Logs | Complete activity trail with filtering |
| 8 | Configuration | Feature flags, system settings |
| 9 | Data Management | Backups, retention policies, quality reports |
| 10 | Billing | Subscription management, revenue tracking |
| 11 | Integrations | Third-party API connections, health checks |
| 12 | Training Center | Staff courses, certifications, progress |

---

## Blood Donor System

### Overview

The Blood Donor module enables patients to register as blood donors, create blood requests, and matches donors with recipients using geolocation-based proximity and blood group compatibility.

### Blood Group Compatibility Matrix

| Recipient | Compatible Donors |
|-----------|------------------|
| A+ | A+, A-, O+, O- |
| A- | A-, O- |
| B+ | B+, B-, O+, O- |
| B- | B-, O- |
| AB+ | All (universal recipient) |
| AB- | AB-, A-, B-, O- |
| O+ | O+, O- |
| O- | O- (universal donor) |

### Geolocation Matching

- Uses **Haversine formula** for accurate distance calculation
- Donors set a `max_distance_km` preference
- Requests define a `search_radius_km`
- Matching considers both donor willingness and request radius
- Donors automatically filtered by eligibility (56-day cooldown after donation)

### Workflow

1. **Registration:** Patient registers as donor with blood group and location
2. **Request Creation:** Hospital/patient creates blood request with urgency level
3. **Auto-Matching:** System finds compatible donors within radius
4. **Notification:** Matched donors receive notification
5. **Response:** Donors accept/decline requests
6. **Donation:** Completed donations are recorded with health vitals
7. **Stats:** Donors earn donation count, see history and certificates

---

## AI & Machine Learning

### Cancer Risk Prediction Engine

The platform uses an **ensemble machine learning approach** combining four models:

| Model | Type | Strengths |
|-------|------|-----------|
| XGBoost | Gradient Boosting | Feature interactions, tabular data |
| LightGBM | Gradient Boosting | Speed, categorical features |
| Random Forest | Ensemble | Robustness, interpretability |
| Neural Network | Deep Learning | Non-linear patterns |

### Feature Set (46 Blood Biomarkers)

```
WBC, RBC, Hemoglobin, Hematocrit, MCV, MCH, MCHC, RDW,
Platelets, MPV, Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils,
Glucose, BUN, Creatinine, Sodium, Potassium, Chloride, CO2, Calcium,
Total Protein, Albumin, Bilirubin_Total, Bilirubin_Direct, ALP, AST, ALT,
Cholesterol_Total, Triglycerides, HDL, LDL, VLDL,
TSH, T3, T4, Free_T4, Iron, Ferritin, TIBC, Vitamin_B12, Folate,
ESR, CRP
```

### Risk Classification

| Score | Category | Action |
|-------|----------|--------|
| > 0.7 | **High Risk** | Immediate clinical review, specialist referral |
| 0.3 – 0.7 | **Moderate Risk** | Enhanced screening, lifestyle recommendations |
| < 0.3 | **Low Risk** | Standard screening schedule |

### SHAP Explainability

All predictions include SHAP (SHapley Additive exPlanations) values that:
- Show which biomarkers most influenced the prediction
- Provide direction (positive/negative contribution)
- Generate visual feature importance charts
- Enable clinician validation of AI decisions

### Model Requirements

| Metric | Minimum Threshold |
|--------|-------------------|
| Accuracy | 85% |
| AUC-ROC | 80% |

---

## Deployment

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DB_URL=sqlite+aiosqlite:///./cancer_guard.db
# DB_URL=postgresql+asyncpg://user:password@localhost:5432/cancerguard

# Authentication
AUTH_SECRET_KEY=your-secret-key-minimum-32-characters
AUTH_ACCESS_TOKEN_EXPIRE_MINUTES=60
AUTH_REFRESH_TOKEN_EXPIRE_DAYS=30

# Application
APP_NAME=CancerGuard AI
APP_ENV=production
APP_DEBUG=false
APP_PORT=8000

# CORS
CORS_ORIGINS=["https://your-domain.com"]

# Email (optional)
EMAIL_ENABLED=false
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587

# Monitoring (optional)
MONITORING_SENTRY_DSN=https://your-sentry-dsn
MONITORING_PROMETHEUS_ENABLED=true
```

### Production Build

```bash
# Frontend build
cd frontend
npm run build

# Backend serves the built frontend via SPA catch-all route
# Static files mounted at /static from frontend/build/static
```

### Docker (recommended)

```dockerfile
# Backend Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Health Check Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | No Auth | Database connectivity, uptime, version |
| `GET /api/v1/health` | No Auth | API health status |
| `GET /api/v1/admin/system-health` | Admin Auth | Full system metrics (DB, memory, disk) |

### Deployment Ports

| Service | Dev Port | Description |
|---------|----------|-------------|
| Backend (FastAPI) | 8001 | API server |
| Frontend (React) | 3000 / 3002 | Dev server (auto-selects next available) |
| Swagger UI | 8001/docs | Interactive API documentation |
| ReDoc | 8001/redoc | Alternative API docs |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Code Standards

- **Backend:** Follow PEP 8, type hints, async/await patterns
- **Frontend:** TypeScript strict mode, functional components, MUI theming
- **API:** RESTful conventions, proper HTTP status codes, consistent error responses
- **Database:** Always use migrations, soft-delete pattern, UUID primary keys

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Backend API endpoints | 457 |
| Backend API modules | 38 |
| Backend ORM tables | 239 |
| Backend model files | 41 |
| Backend service files | 17 |
| Backend schema files | 10 |
| Frontend pages (total) | 101 |
| Frontend patient pages | 39 |
| Frontend hospital pages | 31 |
| Frontend admin pages | 22 |
| Frontend components | 15 |
| Frontend service files | 4 |
| Frontend contexts | 6 |
| Frontend hooks | 2 |
| Frontend utilities | 6 |
| Frontend TypeScript interfaces | 60+ |
| Frontend dependencies | 17 |
| Mobile screens | 31 |
| Mobile components | 2 |
| AI/ML model files | 10 |
| AI/ML pipeline files (total) | 31 |
| Blood biomarker features | 46 |
| Notification types | 21 |
| User roles | 12 |

---

**CancerGuard AI** — Built with care for early cancer detection and comprehensive healthcare management.

*Repository: [https://github.com/Hemakotibonthada/CancerDetector.git](https://github.com/Hemakotibonthada/CancerDetector.git)*
