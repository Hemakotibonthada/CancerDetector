# CancerGuard AI — API Reference

> **Base URL:** `http://localhost:8000/api/v1`  
> **Auth:** Bearer JWT token in `Authorization` header  
> **Docs:** `http://localhost:8000/docs` (Swagger UI)

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/change-password` | Change password |
| POST | `/auth/logout` | Logout and invalidate tokens |

### Login Request
```json
POST /api/v1/auth/login
{
  "email": "patient@cancerguard.ai",
  "password": "Patient@123456"
}
```

### Login Response
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "patient@cancerguard.ai",
    "first_name": "Demo",
    "last_name": "Patient",
    "role": "patient"
  }
}
```

---

## Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user |
| PUT | `/users/me` | Update current user |
| GET | `/users/{id}` | Get user by ID |
| GET | `/users/` | List users (admin) |
| DELETE | `/users/{id}` | Delete user (admin) |

---

## Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/patients/me` | Get patient profile |
| PUT | `/patients/me` | Update patient profile |
| GET | `/patients/health-summary` | Get comprehensive health summary |
| GET | `/patients/demographics` | Get demographics |
| PUT | `/patients/demographics` | Update demographics |
| GET | `/patients/allergies` | Get allergies |
| POST | `/patients/allergies` | Add allergy |

---

## Cancer Detection

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cancer-detection/risk-assessment` | Get current risk assessment |
| POST | `/cancer-detection/predict` | Run cancer risk prediction |
| GET | `/cancer-detection/screening-history` | Get screening history |

---

## Health Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health-records/` | List health records |
| POST | `/health-records/` | Create health record |
| GET | `/health-records/{id}` | Get specific record |
| PUT | `/health-records/{id}` | Update health record |

---

## Blood Samples

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/blood-samples/` | List blood samples |
| POST | `/blood-samples/` | Submit blood sample |
| GET | `/blood-samples/{id}` | Get sample details |
| GET | `/blood-samples/{id}/results` | Get test results |
| GET | `/blood-samples/biomarkers` | Get biomarker trends |

---

## Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/appointments/` | List appointments |
| POST | `/appointments/` | Create appointment |
| PUT | `/appointments/{id}` | Update appointment |

---

## Smartwatch & Wearables

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/smartwatch/data` | Get smartwatch data |
| POST | `/smartwatch/data` | Submit wearable data |
| GET | `/smartwatch/devices` | List paired devices |
| POST | `/smartwatch/devices` | Register device |

### Enhanced Wearables (22 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wearables/devices` | List wearable devices |
| POST | `/wearables/devices` | Register new device |
| GET | `/wearables/glucose` | Continuous glucose readings |
| POST | `/wearables/glucose` | Submit glucose reading |
| GET | `/wearables/glucose/summary` | Glucose summary stats |
| GET | `/wearables/falls` | Fall detection events |
| POST | `/wearables/falls` | Report fall event |
| GET | `/wearables/medication-reminders` | Medication reminders |
| POST | `/wearables/medication-reminders` | Create reminder |
| GET | `/wearables/medication-doses` | Medication dose logs |
| POST | `/wearables/medication-doses` | Log medication dose |
| GET | `/wearables/gait` | Gait analysis data |
| POST | `/wearables/gait` | Submit gait analysis |
| GET | `/wearables/respiratory` | Respiratory monitoring |
| POST | `/wearables/respiratory` | Submit respiratory data |
| GET | `/wearables/pain` | Pain tracking entries |
| POST | `/wearables/pain` | Log pain entry |
| GET | `/wearables/sleep` | Sleep analysis |
| POST | `/wearables/sleep` | Submit sleep data |
| GET | `/wearables/vitals-stream` | Vital signs stream |
| POST | `/wearables/vitals-stream` | Submit vitals stream |
| GET | `/wearables/dashboard` | Wearable analytics dashboard |

---

## Documents & Insurance

### Documents (7 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/upload` | Upload document (multipart/form-data) |
| GET | `/documents/my` | List user's documents |
| GET | `/documents/{id}` | Get document metadata |
| PUT | `/documents/{id}` | Update document |
| DELETE | `/documents/{id}` | Delete document |
| GET | `/documents/download/{id}` | Download document file |
| GET | `/documents/stats/summary` | Document statistics |

### Insurance (7 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents/insurance/policies` | List insurance policies |
| POST | `/documents/insurance/policies` | Add insurance policy |
| PUT | `/documents/insurance/policies/{id}` | Update policy |
| DELETE | `/documents/insurance/policies/{id}` | Delete policy |
| GET | `/documents/insurance/claims` | List insurance claims |
| POST | `/documents/insurance/claims` | Submit insurance claim |
| GET | `/documents/insurance/summary` | Insurance summary |

---

## Communication (19 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/communication/messages` | List secure messages |
| POST | `/communication/messages` | Send message |
| GET | `/communication/care-team` | Get care team |
| POST | `/communication/care-team` | Create care team |
| GET | `/communication/referrals` | List referrals |
| POST | `/communication/referrals` | Create referral |
| GET | `/communication/handoffs` | Clinical handoffs |
| POST | `/communication/handoffs` | Create handoff |
| GET | `/communication/consent-forms` | Get consent forms |
| POST | `/communication/consent-forms` | Create consent form |
| GET | `/communication/tasks` | Care coordination tasks |
| POST | `/communication/tasks` | Create task |
| PUT | `/communication/tasks/{id}` | Update task |
| GET | `/communication/preferences` | Get comm preferences |
| PUT | `/communication/preferences` | Update preferences |
| ... | | |

---

## Telehealth (17 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/telehealth/sessions` | List video sessions |
| POST | `/telehealth/sessions` | Create session |
| GET | `/telehealth/waiting-room` | Virtual waiting room |
| POST | `/telehealth/waiting-room` | Join waiting room |
| GET | `/telehealth/monitoring-plans` | Remote monitoring plans |
| POST | `/telehealth/monitoring-plans` | Create monitoring plan |
| GET | `/telehealth/monitoring-data` | Monitoring data |
| POST | `/telehealth/monitoring-data` | Submit monitoring data |
| GET | `/telehealth/e-prescriptions` | E-prescriptions |
| POST | `/telehealth/e-prescriptions` | Create e-prescription |
| GET | `/telehealth/chats` | Telehealth chats |
| POST | `/telehealth/chats` | Create chat |
| GET | `/telehealth/consent` | Telehealth consent |
| POST | `/telehealth/consent` | Create consent |
| ... | | |

---

## Clinical Decision Support (16 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/clinical-decision/pathways` | Clinical pathways |
| POST | `/clinical-decision/pathways` | Create pathway |
| GET | `/clinical-decision/drug-interactions` | Drug interactions |
| POST | `/clinical-decision/drug-interactions/check` | Check interactions |
| GET | `/clinical-decision/guidelines` | Clinical guidelines |
| GET | `/clinical-decision/calculators` | Clinical calculators |
| POST | `/clinical-decision/calculators/{id}/calculate` | Run calculator |
| GET | `/clinical-decision/alerts` | Clinical alerts |
| POST | `/clinical-decision/alerts` | Create alert |
| GET | `/clinical-decision/order-sets` | Order sets |
| POST | `/clinical-decision/order-sets` | Create order set |
| GET | `/clinical-decision/bpa` | Best practice advisories |
| POST | `/clinical-decision/bpa` | Create advisory |
| ... | | |

---

## Genomics (15 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/genomics/sequences` | Genomic sequences |
| POST | `/genomics/sequences` | Submit sequence |
| GET | `/genomics/variants` | Genetic variants |
| GET | `/genomics/gene-panels` | Gene panels |
| POST | `/genomics/gene-panels` | Create gene panel |
| GET | `/genomics/reports` | Genomic reports |
| GET | `/genomics/liquid-biopsies` | Liquid biopsies |
| POST | `/genomics/liquid-biopsies` | Submit liquid biopsy |
| GET | `/genomics/gene-expression` | Gene expression data |
| GET | `/genomics/pharmacogenomics` | Pharmacogenomic profiles |
| GET | `/genomics/hereditary-panels` | Hereditary cancer panels |
| ... | | |

---

## Billing (19 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/invoices` | List invoices |
| POST | `/billing/invoices` | Create invoice |
| GET | `/billing/payments` | Payment history |
| POST | `/billing/payments` | Process payment |
| GET | `/billing/insurance-plans` | Insurance plans |
| POST | `/billing/insurance-verify` | Verify insurance |
| POST | `/billing/prior-auth` | Request prior auth |
| GET | `/billing/cost-estimates` | Cost estimates |
| POST | `/billing/cost-estimates` | Create estimate |
| POST | `/billing/charges` | Capture charges |
| POST | `/billing/claims` | Submit claim |
| GET | `/billing/denials` | Denial management |
| GET | `/billing/financial-counseling` | Financial counseling |
| ... | | |

---

## Additional API Modules

| Module | Endpoints | Key Features |
|--------|-----------|-------------|
| **Blood Donor** | 14 | Donor registration, matching, donation records |
| **Clinical Trials** | 17 | Protocol management, participant tracking, adverse events |
| **Education** | 16 | Learning resources, quizzes, certifications |
| **Emergency** | 14 | Triage, sepsis/stroke screening, rapid response |
| **Mental Health** | 18 | CBT sessions, mindfulness, crisis intervention |
| **Notifications** | 3 | Create, list, mark as read |
| **Nutrition** | 16 | Assessments, meal plans, food logging, hydration |
| **Pathology** | 16 | Specimens, slides, staining, tumor boards |
| **Patient Engagement** | 21 | Gamification, challenges, peer support, rewards |
| **Pharmacy** | 17 | Formulary, drug reviews, controlled substances |
| **Population Health** | 16 | Disease registries, care gaps, health equity |
| **Quality & Safety** | 18 | Adverse events, incident reports, infection control |
| **Radiology** | 13 | AI reads, tumor measurements, dose tracking |
| **Rehabilitation** | 15 | Rehab plans, therapy sessions, pain management |
| **Research** | 15 | Studies, cohorts, publications, IRB submissions |
| **Social Determinants** | 16 | SDOH assessments, community programs, transportation |
| **Supply Chain** | 16 | Inventory, vendors, purchase orders, equipment |
| **Workforce** | 15 | Staff profiles, scheduling, credentialing |
| **Admin** | 5 | Platform administration, user management |
| **Analytics** | 2 | Platform analytics, usage metrics |
| **Reports** | 1 | Report generation |
| **Hospitals** | 7 | Hospital management, departments, staff |

---

## Common Response Patterns

### Success
```json
{
  "data": { ... },
  "message": "Success",
  "total": 100,
  "page": 1,
  "per_page": 20
}
```

### Validation Error (422)
```json
{
  "detail": "Field X is required; Field Y must be a valid email"
}
```

### Authentication Error (401)
```json
{
  "detail": "Not authenticated"
}
```

### Not Found (404)
```json
{
  "detail": "Resource not found"
}
```

---

## Rate Limits & File Uploads

- **Max File Size:** 50 MB
- **Accepted File Types:** PDF, JPG, PNG, GIF, TIFF, DOC, DOCX, TXT, DCM
- **Upload Endpoint:** `POST /documents/upload` (multipart/form-data)
- **File Storage:** Server filesystem at `uploads/<user_id>/`

---

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check (includes DB status) |
| GET | `/api/v1/health` | API health check |

```json
GET /health
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "database": { "status": "healthy" },
  "uptime_seconds": 3600.5,
  "timestamp": "2026-02-23T12:00:00Z"
}
```
