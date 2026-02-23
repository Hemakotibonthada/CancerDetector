# CancerGuard AI — Presentation Slides

> Open `PRESENTATION.html` in a browser for the interactive slideshow version.

---

## Slide 1: Title

# 🏥 CancerGuard AI
### AI-Powered Cancer Detection & Comprehensive Healthcare Platform
**Version 1.0.0 | Full-Stack Enterprise Healthcare Solution**

React • FastAPI • TensorFlow • PyTorch • React Native  
457 API Endpoints • 239 Database Tables • 89 Pages • 38 Modules

---

## Slide 2: The Problem

- 🔴 **Cancer is the 2nd leading cause of death globally**
- 🔴 Late-stage detection reduces 5-year survival rates to as low as 10%
- 🔴 Fragmented health records make it difficult to track risk over time
- 🔴 Patients lack tools to actively manage their health data
- 🔴 Hospitals need integrated systems for end-to-end care

**Our Solution:** An AI-powered platform that combines early cancer risk prediction with comprehensive health monitoring, document management, and hospital operations — accessible to everyone.

---

## Slide 3: Platform at a Glance

| Metric | Count |
|--------|-------|
| API Endpoints | **457** |
| Database Tables | **239** |
| Frontend Pages | **89** |
| API Modules | **38** |

---

## Slide 4: Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | FastAPI 0.104, Python 3.13, SQLAlchemy 2.0 Async, JWT Auth |
| **Frontend** | React 18, TypeScript 4.9, Material UI v5, Recharts |
| **Mobile** | Expo 50, React Native 0.73, React Navigation 6, RN Paper |
| **AI/ML** | TensorFlow 2.15, PyTorch 2.1, XGBoost, LightGBM, SHAP/LIME |
| **Database** | SQLite (dev), PostgreSQL (prod), Alembic migrations |
| **Security** | JWT + Refresh Tokens, bcrypt, RBAC (4 roles), Audit Logging |

---

## Slide 5: Three Dedicated Portals

### User Portal — 37 Pages
Dashboard, Cancer Risk, Health Records, Documents, Insurance, Telehealth, Wearables, Mental Health

### Hospital Portal — 30 Pages
Operations, Lab & Radiology, Pathology, Pharmacy, Emergency, Surgery, Clinical Trials, Quality

### Admin Portal — 22 Pages
System Monitoring, User & Hospital Mgmt, AI Model Management, Security & Compliance

---

## Slide 6: User Portal — Key Features

- 🎯 AI Cancer Risk Assessment (multi-model ensemble)
- 📊 Health Dashboard with live vitals
- 📁 Medical Document Upload & Management
- 🛡️ Insurance Policy & Claims Tracking
- ⌚ Smartwatch & Wearable Integration
- 🩸 Blood Tests & Biomarker Tracking
- 💊 Medication Management & Adherence
- 📅 Appointment Scheduling
- 🧬 Genetic Profile & Genomics
- 🧠 Mental Health (CBT, Mindfulness)
- 🥗 Diet, Nutrition & Hydration
- 🏃 Exercise & Fitness Tracking
- 📹 Telehealth Video Consultations
- 💬 Secure Messaging with Care Team
- 📚 Health Education & Quizzes
- 🩺 Screening Schedule & Reminders
- 👨‍👩‍👧 Family Health History
- 🩸 Blood Donor Registration
- 💰 Billing & Payment Tracking
- 🏆 Gamification & Health Challenges

---

## Slide 7: Hospital Portal — Clinical Operations

- 📋 Patient Management & Demographics
- 🏥 Bed Management & Occupancy
- 🔬 Lab Management & Quality Control
- 📷 Radiology with AI-Assisted Reads
- 🧫 Pathology (Specimens, Slides, Tumor Board)
- 💊 Pharmacy & Formulary Management
- 🚑 Emergency (Triage, Sepsis, Stroke)
- 🩸 Blood Bank & Cross-Matching
- 🔪 Surgery Scheduling & Tracking
- 📹 Telemedicine & Virtual Waiting Room
- 🧬 Genomics Lab Workflows
- 📊 Clinical Decision Support
- 🧪 Clinical Trials Management
- ✅ Quality & Safety (Incidents, Infection Control)
- 📦 Supply Chain & Asset Tracking
- 👥 Staff Directory & Workforce Management
- 📊 Population Health & Disease Registries
- 📈 AI Analytics & Predictive Models

---

## Slide 8: System Architecture

```
┌─────────────────────────────────────────────┐
│   Client Layer: React Web | Expo Mobile     │
└─────────────────────┬───────────────────────┘
                      │ HTTPS / REST
┌─────────────────────┴───────────────────────┐
│   FastAPI Backend (38 modules, 457 routes)   │
│   CORS → JWT Auth → Routers → Services       │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────┴───────────────────────┐
│   SQLAlchemy 2.0 Async ORM (239 tables)      │
│   SQLite (dev) / PostgreSQL (prod)            │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────┴───────────────────────┐
│   AI/ML Engine                               │
│   TensorFlow | PyTorch | XGBoost | SHAP      │
└──────────────────────────────────────────────┘
```

---

## Slide 9: Data Model — 239 Tables

| Domain | Tables | Key Models |
|--------|--------|------------|
| User & Auth | 4 | User, Session, Preference |
| Patient & Health | 14 | Patient, Records, Vitals, Labs |
| Cancer & Screening | 6 | Screening, RiskAssessment, Prediction |
| Wearables & IoT | 22 | Glucose, ECG, Gait, Sleep |
| Genomics | 8 | Sequencing, Variants, LiquidBiopsy |
| Clinical Trials | 8 | Protocol, Participants, Visits |
| Imaging & Pathology | 17 | Radiology, AI Reads, Specimens |
| Billing & Insurance | 16 | Invoice, Claims, PriorAuth |
| Communication | 15 | Messages, Referrals, Telehealth |
| Quality & Safety | 9 | Incidents, Infections, Checklists |
| + 15 more domains | 120 | Nutrition, Rehab, Supply, etc. |

---

## Slide 10: Security Architecture

| Layer | Protection |
|-------|-----------|
| 1 | CORS whitelist — origin-based access control |
| 2 | JWT Authentication — access (15min) + refresh (7 days) |
| 3 | RBAC — Patient / Doctor / Hospital Admin / System Admin |
| 4 | Pydantic input validation on all requests |
| 5 | SQLAlchemy ORM — SQL injection prevention |
| 6 | bcrypt password hashing + audit logging |

---

## Slide 11: AI/ML Cancer Risk Engine

**Pipeline:**
1. **Data Collection** — Blood biomarkers, genetics, lifestyle
2. **Preprocessing** — Feature engineering, normalization
3. **Ensemble Models** — TensorFlow DNN, PyTorch, XGBoost/LightGBM
4. **Prediction** — Risk score, risk level, confidence
5. **Explainability** — SHAP values, LIME, feature importance

**Risk Levels:** Very Low → Low → Moderate → High → Very High → Critical

---

## Slide 12: Key Differentiators

- 🧠 **Multi-Model AI Ensemble** — Deep learning + gradient boosting + classical ML
- 📱 **Cross-Platform** — Web, iOS, Android with shared backend
- 🏥 **Full Hospital EHR** — Radiology, pathology, pharmacy, emergency
- ⌚ **IoT & Wearable Integration** — 22 wearable data tables
- 🔬 **Genomics-Ready** — Liquid biopsy, gene panels, pharmacogenomics

---

## Slide 13: Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 👤 User | patient@cancerguard.ai | Patient@123456 |
| 🩺 Doctor | doctor@cancerguard.ai | Doctor@123456 |
| 🏥 Hospital Admin | hospital.admin@cancerguard.ai | Hospital@123456 |
| ⚙️ System Admin | admin@cancerguard.ai | Admin@123456 |

**Backend:** http://localhost:8000 (Swagger at /docs)  
**Frontend:** http://localhost:3000  
**Mobile:** Expo Go scan QR

---

## Slide 14: Thank You

# CancerGuard AI
### Empowering Early Detection, Saving Lives

📂 [github.com/Hemakotibonthada/CancerDetector](https://github.com/Hemakotibonthada/CancerDetector)
