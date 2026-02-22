# CancerGuard AI - Advanced Cancer Detection & Health Monitoring Platform

## Overview

CancerGuard AI is a comprehensive healthcare platform that leverages AI/ML models to detect cancer risk in advance using data from smartwatches, blood samples, genetic information, and lifestyle factors. The system provides real-time health monitoring, predictive analytics, and integrated hospital management.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)            │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Landing   │  │ Auth (Login/ │  │ Dashboards              │ │
│  │ Page      │  │ Register)    │  │ - Patient Dashboard     │ │
│  │           │  │              │  │ - Hospital Dashboard    │ │
│  │           │  │              │  │ - Admin Dashboard       │ │
│  └──────────┘  └──────────────┘  └────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────────┐
│                   Backend (FastAPI + SQLAlchemy)              │
│  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Auth & │  │ Patient  │  │ Hospital │  │ Cancer       │  │
│  │ Users  │  │ Records  │  │ Mgmt     │  │ Detection    │  │
│  └────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Blood  │  │ Smart-   │  │ Appoint- │  │ Notifica-    │  │
│  │ Tests  │  │ watch    │  │ ments    │  │ tions        │  │
│  └────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    AI/ML Models                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Ensemble Cancer Classifier                            │   │
│  │ - Random Forest    - Gradient Boosting                │   │
│  │ - Extra Trees      - MLP Neural Network               │   │
│  │ - Stacking Meta-Learner (Logistic Regression)         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │ Blood    │  │ Smart-   │  │ Feature Engineering       │  │
│  │ Analyzer │  │ watch    │  │ - 130+ features           │  │
│  │          │  │ Analyzer │  │ - Auto preprocessing      │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Features

### For Patients
- **Unique Health ID**: Universal healthcare identifier shared across hospitals
- **AI Cancer Risk Assessment**: Multi-cancer risk prediction using ensemble ML
- **Smartwatch Integration**: Real-time monitoring via Apple Watch, Fitbit, etc.
- **Blood Test Analysis**: 60+ biomarker analysis with cancer marker detection
- **Health Records**: Complete medical history accessible via Health ID
- **Medication Tracking**: Prescription management and adherence monitoring
- **Appointment Booking**: Schedule consultations and screening tests

### For Hospitals
- **Patient Search by Health ID**: Access complete patient history instantly
- **Cancer Screening Management**: Track and manage cancer screenings
- **Lab Result Integration**: Blood test and imaging result management
- **Doctor Management**: Staff and department organization
- **AI-Powered Insights**: Cancer risk predictions for clinical decision support

### For Administrators
- **System Dashboard**: Complete platform oversight with real-time stats
- **User Management**: Role-based access control (RBAC) for all user types
- **Hospital Management**: Multi-hospital administration
- **Analytics & Reports**: Cancer detection rates, risk distributions, trends
- **System Health Monitoring**: API, database, and AI model status

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ (for frontend)

### Running the Application

```powershell
# 1. Install backend dependencies
cd backend
pip install -r requirements.txt

# 2. Start the server
cd ..
python run.py
```

The server starts at `http://localhost:8000` with:
- API Explorer: `http://localhost:8000/docs`
- Auto-seeded demo data with sample accounts

### Frontend (Optional - separate dev server)

```powershell
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@cancerguard.ai | Patient@123456 |
| Doctor/Oncologist | doctor@cancerguard.ai | Doctor@123456 |
| Hospital Admin | hospital.admin@cancerguard.ai | Hospital@123456 |
| System Admin | admin@cancerguard.ai | Admin@123456 |

## AI/ML Cancer Detection Model

### Model Architecture
- **Ensemble Classifier**: Stacking of Random Forest, Gradient Boosting, Extra Trees, MLP
- **Meta-Learner**: Logistic Regression for final prediction
- **Feature Set**: 130+ features from blood, smartwatch, lifestyle, genetic, and medical data

### Cancer Types Detected
Lung, Breast, Colorectal, Prostate, Skin, Liver, Pancreatic, Kidney, Bladder, Thyroid, Stomach, Ovarian, Cervical, Leukemia, Lymphoma, Brain, and more.

### Data Sources
1. **Blood Biomarkers**: CBC, tumor markers (CEA, CA125, CA199, AFP, PSA), liver/kidney function, inflammatory markers
2. **Smartwatch Data**: Heart rate, HRV, SpO2, sleep patterns, activity, stress, ECG, skin temperature
3. **Lifestyle Factors**: Smoking, alcohol, exercise, diet, BMI, sun exposure
4. **Genetic Information**: BRCA1/2, Lynch syndrome, TP53, family history
5. **Medical History**: Previous cancer, chronic conditions, medications

## API Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| Auth | POST /api/v1/auth/register | Register new user |
| Auth | POST /api/v1/auth/login | Login |
| Patients | GET /api/v1/patients/me | Get patient profile |
| Patients | GET /api/v1/patients/health-id/{id} | Lookup by Health ID |
| Health Records | GET /api/v1/health-records/by-health-id/{id} | Get records by Health ID |
| Blood Samples | POST /api/v1/blood-samples/{id}/analyze | AI blood analysis |
| Cancer Detection | POST /api/v1/cancer-detection/predict/{id} | Run AI cancer prediction |
| Smartwatch | POST /api/v1/smartwatch/data | Ingest smartwatch data |
| Hospitals | GET /api/v1/hospitals | List hospitals |
| Admin | GET /api/v1/admin/dashboard | Admin statistics |
| Analytics | GET /api/v1/analytics/overview | Platform analytics |

## Technology Stack

- **Backend**: FastAPI, SQLAlchemy, Pydantic, Python 3.10+
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **AI/ML**: scikit-learn, XGBoost, LightGBM, TensorFlow, PyTorch
- **Frontend**: React 18, TypeScript, Material-UI 5, Recharts
- **Auth**: JWT with role-based access control
- **Deployment**: Docker, Docker Compose

## License

MIT License - For research and educational purposes.
