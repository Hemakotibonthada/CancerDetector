# CancerGuard AI — Project Overview

## 1. Introduction

**CancerGuard AI** is an enterprise-grade, full-stack healthcare platform designed to assist in early cancer detection, continuous health monitoring, and comprehensive hospital management. The application combines AI/ML-powered cancer risk prediction with a complete Electronic Health Record (EHR) system, serving patients, doctors, hospital administrators, and system administrators through dedicated portals.

---

## 2. Purpose & Vision

Cancer remains one of the leading causes of death worldwide, with early detection dramatically improving survival rates. CancerGuard AI addresses this by providing:

- **AI-Powered Cancer Risk Assessment** — Multi-model ensemble (TensorFlow, PyTorch, XGBoost, LightGBM, CatBoost) that analyzes blood biomarkers, genetic profiles, lifestyle factors, and medical history to predict cancer risk.
- **Continuous Health Monitoring** — Integration with smartwatches and wearable devices for real-time vital signs, sleep patterns, activity tracking, and anomaly detection.
- **Comprehensive EHR System** — Complete electronic health records covering 239 database tables spanning every aspect of patient care.
- **Multi-Portal Architecture** — Separate experiences for patients/users, hospital staff, and system administrators.
- **Telehealth & Communication** — Secure messaging, video consultations, and care coordination between patients and providers.

---

## 3. Key Statistics

| Metric | Count |
|--------|-------|
| Database Tables | 239 |
| API Endpoints | 457 |
| API Modules | 38 |
| Backend Model Files | 40 |
| Backend API Route Files | 37 |
| Frontend User Pages | 37 |
| Frontend Hospital Pages | 30 |
| Frontend Admin Pages | 22 |
| Mobile App Screens | 4 portals |
| AI/ML Model Files | 8 |

---

## 4. Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI 0.104.1 |
| Language | Python 3.13 |
| ORM | SQLAlchemy 2.0 (async) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (python-jose) + bcrypt |
| Server | Uvicorn |
| Migrations | Alembic |

### AI/ML
| Component | Technology |
|-----------|-----------|
| Deep Learning | TensorFlow 2.15, PyTorch 2.1 |
| Gradient Boosting | XGBoost, LightGBM, CatBoost |
| ML Pipeline | scikit-learn 1.3 |
| Hyperparameter Tuning | Optuna |
| Explainability | SHAP, LIME |
| Data Processing | NumPy, Pandas, SciPy |

### Frontend (Web)
| Component | Technology |
|-----------|-----------|
| Framework | React 18.2 |
| Language | TypeScript 4.9 |
| UI Library | Material UI (MUI) v5 |
| Charts | Recharts, Chart.js, MUI X Charts |
| Data Grid | MUI X Data Grid |
| HTTP Client | Axios |
| Routing | React Router v6 |

### Mobile
| Component | Technology |
|-----------|-----------|
| Framework | Expo 50 / React Native 0.73 |
| Navigation | React Navigation 6 |
| UI Library | React Native Paper |
| Notifications | expo-notifications |
| Security | expo-secure-store |

---

## 5. Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  React Web   │  Mobile App  │   Admin      │   Hospital     │
│  (User       │  (Expo/RN)   │   Dashboard  │   Portal       │
│   Portal)    │              │              │                │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬────────┘
       │              │              │               │
       └──────────────┴──────────────┴───────────────┘
                             │
                        HTTPS / REST
                             │
       ┌─────────────────────┴─────────────────────┐
       │           FastAPI Backend (457 routes)     │
       ├────────────────────────────────────────────┤
       │  Auth │ CORS │ Rate Limiting │ Middleware  │
       ├────────────────────────────────────────────┤
       │  38 API Modules (routers)                  │
       ├────────────────────────────────────────────┤
       │  Service Layer (business logic)            │
       ├────────────────────────────────────────────┤
       │  SQLAlchemy 2.0 Async ORM                  │
       ├──────────────┬─────────────────────────────┤
       │  SQLite (dev) │  PostgreSQL (production)   │
       └──────────────┴─────────────────────────────┘
                             │
       ┌─────────────────────┴─────────────────────┐
       │          AI/ML Pipeline                    │
       │  TensorFlow │ PyTorch │ XGBoost │ etc.    │
       │  Cancer Risk Prediction Engine             │
       └───────────────────────────────────────────┘
```

---

## 6. Portal Breakdown

### 6.1 User Portal (37 pages)
The user-facing portal provides comprehensive health management:

| Category | Features |
|----------|----------|
| **Dashboard** | Health score, risk overview, quick metrics, mood & water tracking |
| **Cancer Risk** | AI-powered risk assessment with multi-model scoring |
| **Health Records** | Complete medical history management |
| **Blood Tests** | Lab results, biomarker tracking, trend analysis |
| **Vital Signs** | Heart rate, SpO2, blood pressure, temperature |
| **Smartwatch/Wearables** | Real-time device data, continuous glucose, gait analysis |
| **Appointments** | Schedule, manage, view doctor appointments |
| **Medications** | Prescription tracking, adherence monitoring |
| **Symptom Checker** | AI-assisted symptom analysis |
| **Health Goals** | Goal setting, progress tracking |
| **Diet & Nutrition** | Meal planning, food logging, hydration |
| **Exercise & Fitness** | Workout tracking, exercise prescriptions |
| **Mental Health** | CBT sessions, mindfulness, crisis support |
| **Genetic Profile** | Hereditary cancer panels, pharmacogenomics |
| **Genomics** | Liquid biopsy, gene expression analysis |
| **Treatment Plan** | Care protocols, clinical pathways |
| **Screening Schedule** | Cancer screening recommendations & reminders |
| **Family Health** | Family medical history, hereditary risk |
| **Blood Donor** | Donor registration, matching, donation records |
| **Documents** | Upload/manage medical reports, scan results |
| **Insurance** | Policy management, claims tracking, coverage details |
| **Telehealth** | Video consultations, remote monitoring |
| **Communication** | Secure messaging with care team |
| **Education** | Health literacy resources, quizzes |
| **Social Support** | SDOH assessment, community resources |
| **Rehabilitation** | Rehab plans, therapy sessions, milestones |
| **Billing** | Invoices, payments, cost estimates |
| **Profile & Settings** | Account management, preferences |
| **Notifications** | Alert center, push notifications |

### 6.2 Hospital Portal (30 pages)
Hospital-facing tools for clinical and administrative operations:

| Category | Features |
|----------|----------|
| **Dashboard** | KPIs, occupancy, revenue, patient flow |
| **User Management** | Patient roster, demographics, care gaps |
| **Staff Directory** | Doctor/nurse profiles, credentialing |
| **Doctor Management** | Physician schedules, specialties |
| **Appointment Management** | Scheduling, calendar, waitlists |
| **Lab Management** | Sample tracking, result entry, quality control |
| **Radiology** | Imaging orders, AI-assisted reads, DICOM |
| **Pathology** | Specimen tracking, slides, staining protocols |
| **Pharmacy** | Formulary, medication reconciliation, controlled substances |
| **Surgery Management** | OR scheduling, case tracking |
| **Bed Management** | Occupancy, transfers, discharge planning |
| **Emergency** | Triage, sepsis/stroke screening, trauma |
| **Blood Bank** | Inventory, cross-matching, transfusion records |
| **Telemedicine** | Video sessions, virtual waiting rooms |
| **Genomics Lab** | Sequencing workflows, variant analysis |
| **Clinical Decision Support** | Guidelines, calculators, drug interactions |
| **Clinical Trials** | Protocol management, participant tracking |
| **Quality & Safety** | Adverse events, incident reports, infection control |
| **Population Health** | Disease registries, care gaps, health equity |
| **Nutrition Management** | Dietary orders, enteral nutrition |
| **Rehabilitation Management** | Therapy programs, functional assessments |
| **Supply Chain** | Inventory, purchase orders, asset tracking |
| **AI Analytics** | Predictive models, trend analysis |
| **Reports** | Custom reports, dashboards, KPI tracking |
| **Settings** | Hospital configuration, integrations |

### 6.3 Admin Portal (22 pages)
System-wide administration and oversight:

| Category | Features |
|----------|----------|
| **Dashboard** | System health, user growth, platform metrics |
| **User Management** | Account administration, roles, permissions |
| **Hospital Management** | Multi-hospital oversight, onboarding |
| **AI Model Management** | Model versions, performance, retraining |
| **Audit Logs** | User activity, system events, compliance |
| **Billing Management** | Revenue, financial analytics, pricing |
| **System Monitoring** | Server health, uptime, error tracking |
| **Platform Analytics** | Usage patterns, engagement metrics |
| **Configuration** | Feature flags, system config, maintenance |
| **Security** | Threat monitoring, access control, encryption |
| **Compliance** | HIPAA, regulatory compliance dashboards |
| **Data Management** | Import/export, archival, purging |
| **Integration Hub** | Third-party API connections, webhooks |
| **Research Portal** | Research study management, IRB submissions |
| **Education Management** | Content management for education resources |
| **Workforce Management** | Staffing, scheduling, credentialing |
| **Quality Dashboard** | System-wide quality metrics |
| **Population Health Admin** | Public health campaigns, disease tracking |
| **Social Determinants Admin** | Community program management |
| **Training Center** | Staff training, certifications |
| **Reports & Notifications** | System reports, admin notifications |

---

## 7. Data Model Domains

The 239 database tables are organized into the following domains:

| Domain | Tables | Key Models |
|--------|--------|------------|
| User & Auth | 4 | User, UserSession, UserPreference |
| Patient | 4 | Patient, Demographics, Allergies, FamilyHistory |
| Hospital & Staff | 4 | Hospital, Department, Staff, Doctor |
| Health Records | 3 | HealthRecord, LabResult, LabOrder |
| Blood & Lab | 5 | BloodSample, Biomarker, TestResult |
| Vital Signs | 3 | VitalSigns, VitalSignAlert |
| Smartwatch & Wearables | 22 | Device, HeartRate, SpO2, Sleep, ECG, Glucose, Gait, etc. |
| Medications & Pharmacy | 12 | Medication, Prescription, Formulary, Reconciliation |
| Appointments | 1 | Appointment |
| Cancer Screening | 6 | Screening, RiskAssessment, Prediction, TumorMarker |
| Imaging & Radiology | 10 | MedicalImage, AIReading, DoseRecord, Protocol |
| Pathology | 7 | Specimen, Block, Slide, StainingProtocol, TumorBoard |
| Genomics | 8 | GenomicSequence, GeneticVariant, GenePanel, LiquidBiopsy |
| Clinical Decisions | 9 | ClinicalPathway, DrugInteraction, ClinicalAlert |
| Clinical Trials | 8 | TrialProtocol, Site, Participant, Visit, AdverseEvent |
| Research | 7 | ResearchStudy, Cohort, Publication, Dataset, IRB |
| Communication | 8 | SecureMessage, CareTeam, Referral, ConsentForm |
| Telehealth | 7 | VideoSession, VirtualWaitingRoom, RemoteMonitoring |
| Billing & Insurance | 13 | Invoice, Payment, InsurancePlan, PriorAuth, Claims |
| Documents | 3 | Document, InsurancePolicy, UserInsuranceClaim |
| Quality & Safety | 9 | AdverseEvent, IncidentReport, QualityMeasure |
| Emergency | 6 | TriageAssessment, SepsisScreening, StrokeAssessment |
| Population Health | 9 | DiseaseRegistry, CareGap, HealthEquity, PublicHealthAlert |
| Nutrition | 8 | NutritionAssessment, MealPlan, FoodLog, Hydration |
| Mental Health | 9 | CBTSession, Mindfulness, CrisisIntervention, SafetyPlan |
| Rehabilitation | 7 | RehabPlan, TherapySession, FunctionalAssessment |
| Patient Engagement | 12 | Gamification, Badges, Challenges, PeerSupport |
| Education | 9 | EducationResource, Quiz, TrainingModule, Certification |
| Social Determinants | 7 | SDOHAssessment, SocialRisk, FoodInsecurity, Housing |
| Supply Chain | 7 | Inventory, Vendor, PurchaseOrder, Equipment, Waste |
| Workforce | 6 | StaffProfile, Shift, Leave, Credentialing, Performance |
| Blood Donor | 4 | BloodDonor, BloodRequest, DonorMatch, DonationRecord |
| Notifications & Audit | 2 | Notification, AuditLog |
| System Config | 3 | SystemConfig, FeatureFlag, MaintenanceWindow |

---

## 8. Security Features

- **JWT Authentication** with access & refresh tokens
- **Role-Based Access Control (RBAC)** — Patient, Doctor, Hospital Admin, System Admin
- **Password Hashing** using bcrypt
- **CORS Configuration** with configurable allowed origins
- **Request Timing Middleware** for performance monitoring
- **Audit Logging** for all critical operations
- **Session Management** with device tracking

---

## 9. Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| User (Patient) | patient@cancerguard.ai | Patient@123456 |
| Doctor | doctor@cancerguard.ai | Doctor@123456 |
| Hospital Admin | hospital.admin@cancerguard.ai | Hospital@123456 |
| System Admin | admin@cancerguard.ai | Admin@123456 |

---

## 10. Getting Started

```bash
# Clone repository
git clone https://github.com/Hemakotibonthada/CancerDetector.git

# Start backend
cd "Cancer detection"
pip install -r backend/requirements.txt
python run.py                    # Starts on http://localhost:8000

# Start frontend
cd frontend
npm install
npm start                        # Starts on http://localhost:3000

# Start mobile (Expo)
cd mobile
npm install
npx expo start
```

---

## 11. Repository Structure

```
Cancer detection/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # 37 route files (457 endpoints)
│   │   ├── models/            # 40 model files (239 tables)
│   │   ├── services/          # Business logic services
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── middleware/        # Custom middleware
│   │   ├── utils/             # Utility functions
│   │   ├── config.py          # Centralized config (Pydantic Settings)
│   │   ├── database.py        # SQLAlchemy async setup
│   │   ├── security.py        # JWT & password hashing
│   │   └── main.py            # FastAPI app factory
│   ├── tests/                 # Test suite
│   └── requirements.txt       # Python dependencies (87 packages)
├── frontend/                   # React web application
│   └── src/
│       ├── pages/
│       │   ├── patient/       # 37 user-facing pages
│       │   ├── hospital/      # 30 hospital pages
│       │   └── admin/         # 22 admin pages
│       ├── components/        # Reusable UI components
│       ├── context/           # Auth & app context
│       ├── services/          # API client (api.ts)
│       └── theme.ts           # MUI theme configuration
├── mobile/                     # Expo/React Native app
│   └── src/
│       ├── screens/           # Mobile screens (4 portals)
│       ├── components/        # Mobile components
│       ├── navigation/        # React Navigation setup
│       └── services/          # Mobile API client
├── ai_models/                  # AI/ML pipeline
│   ├── models/                # Model definitions
│   ├── training/              # Training scripts
│   ├── inference/             # Prediction pipeline
│   └── data_preprocessing/    # Feature engineering
├── docs/                       # Documentation
├── data/                       # Data files
├── scripts/                    # Utility scripts
├── run.py                      # Application entry point
└── README.md
```
