# CancerGuard AI — System Architecture

## 1. High-Level Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │              PRESENTATION LAYER               │
                    ├───────────┬──────────────┬────────────────────┤
                    │  Web App  │  Mobile App  │  Swagger/ReDoc     │
                    │  React 18 │  Expo/RN     │  OpenAPI 3.0       │
                    │  MUI v5   │  RN Paper    │  Auto-generated    │
                    │  Port 3000│  Expo GO     │  Port 8000/docs    │
                    └─────┬─────┴──────┬───────┴────────┬───────────┘
                          │            │                │
                     ═════╪════════════╪════════════════╪═════════
                          │       HTTPS / REST API      │
                     ═════╪════════════╪════════════════╪═════════
                          │            │                │
                    ┌─────┴────────────┴────────────────┴───────────┐
                    │              API GATEWAY LAYER                 │
                    │  ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
                    │  │   CORS   │ │   JWT    │ │  Request      │  │
                    │  │Middleware│ │   Auth   │ │  Timing       │  │
                    │  └──────────┘ └──────────┘ └───────────────┘  │
                    └──────────────────┬────────────────────────────┘
                                       │
                    ┌──────────────────┴────────────────────────────┐
                    │              APPLICATION LAYER                 │
                    │                                                │
                    │  ┌────────────────────────────────────────┐    │
                    │  │         38 API Router Modules          │    │
                    │  │  auth│users│patients│hospitals│cancer  │    │
                    │  │  genomics│billing│telehealth│pharmacy  │    │
                    │  │  clinical│emergency│research│quality   │    │
                    │  │  documents│wearables│nutrition│...     │    │
                    │  └────────────────────┬───────────────────┘    │
                    │                       │                        │
                    │  ┌────────────────────┴───────────────────┐    │
                    │  │          Service Layer                 │    │
                    │  │  SeedService│Business Logic│Validators │    │
                    │  └────────────────────┬───────────────────┘    │
                    │                       │                        │
                    │  ┌────────────────────┴───────────────────┐    │
                    │  │       Pydantic Schemas Layer           │    │
                    │  │   Request/Response Validation          │    │
                    │  └────────────────────────────────────────┘    │
                    └──────────────────┬────────────────────────────┘
                                       │
                    ┌──────────────────┴────────────────────────────┐
                    │              DATA ACCESS LAYER                 │
                    │                                                │
                    │  ┌────────────────────────────────────────┐    │
                    │  │      SQLAlchemy 2.0 Async ORM         │    │
                    │  │  40 Model Files │ 239 Tables           │    │
                    │  │  AsyncSession │ BaseMixin │ to_dict()  │    │
                    │  └────────────────────┬───────────────────┘    │
                    │                       │                        │
                    │  ┌────────────────────┴───────────────────┐    │
                    │  │           Database Engine              │    │
                    │  │  SQLite (dev) │ PostgreSQL (prod)      │    │
                    │  │  aiosqlite   │ asyncpg                │    │
                    │  │  Alembic migrations                    │    │
                    │  └────────────────────────────────────────┘    │
                    └──────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┴────────────────────────────┐
                    │             AI/ML ENGINE                       │
                    │                                                │
                    │  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
                    │  │TensorFlow│ │ PyTorch  │ │ XGBoost      │   │
                    │  │Deep NN   │ │ Models   │ │ LightGBM     │   │
                    │  │          │ │          │ │ CatBoost     │   │
                    │  └──────────┘ └──────────┘ └──────────────┘   │
                    │  ┌──────────────────────────────────────┐      │
                    │  │  SHAP/LIME Explainability │ Optuna   │      │
                    │  └──────────────────────────────────────┘      │
                    └──────────────────────────────────────────────┘
```

---

## 2. Backend Architecture

### 2.1 Application Factory Pattern

```python
# main.py
def create_application() -> FastAPI:
    app = FastAPI(title=..., lifespan=lifespan)
    # Add middleware
    # Register 38 routers
    # Mount static files
    return app

app = create_application()
```

### 2.2 Router Registration Flow

```
main.py
  ├── imports from app.api.__init__
  │     ├── auth_router           → /api/v1/auth/*
  │     ├── users_router          → /api/v1/users/*
  │     ├── patients_router       → /api/v1/patients/*
  │     ├── hospitals_router      → /api/v1/hospitals/*
  │     ├── cancer_detection_router → /api/v1/cancer-detection/*
  │     ├── ... (33 more routers)
  │     └── documents_router      → /api/v1/documents/*
  └── app.include_router(router, prefix="/api/v1")
```

### 2.3 Database Layer

```
database.py
  ├── DatabaseConfig (from settings)
  ├── create_async_engine()
  │     ├── SQLite:     aiosqlite:///cancerguard.db
  │     └── PostgreSQL: asyncpg://host:port/db
  ├── AsyncSessionLocal (sessionmaker)
  ├── BaseMixin
  │     ├── id (UUID primary key)
  │     ├── created_at, updated_at
  │     ├── is_deleted (soft delete)
  │     └── to_dict() helper
  ├── get_db() → AsyncSession (dependency)
  ├── init_db() → create_all tables
  └── check_db_health()
```

### 2.4 Authentication Flow

```
Client Request
  │
  ├─ POST /auth/login
  │    ├─ Validate credentials
  │    ├─ Generate JWT access_token (15min)
  │    ├─ Generate JWT refresh_token (7 days)
  │    └─ Return tokens + user object
  │
  ├─ Subsequent requests
  │    ├─ Authorization: Bearer <access_token>
  │    ├─ security.py → decode JWT
  │    ├─ get_current_user_id() dependency
  │    └─ Route handler executes
  │
  └─ Token expired
       ├─ POST /auth/refresh (refresh_token)
       └─ New access_token returned
```

---

## 3. Frontend Architecture

### 3.1 Component Hierarchy

```
App.tsx
  ├── ThemeProvider (MUI lightTheme)
  ├── AuthProvider (context)
  ├── BrowserRouter (React Router v6)
  └── Suspense (lazy loading)
       ├── Public Routes
       │    ├── / → LandingPage
       │    ├── /login → LoginPage
       │    └── /register → RegisterPage
       ├── Patient Routes (ProtectedRoute)
       │    ├── /patient → PatientDashboard
       │    ├── /patient/cancer-risk → CancerRiskPage
       │    ├── /patient/records → HealthRecordsPage
       │    ├── /patient/documents → DocumentsPage
       │    ├── /patient/insurance → InsurancePage
       │    └── ... (37 total)
       ├── Hospital Routes (ProtectedRoute + HOSPITAL_ROLES)
       │    ├── /hospital → HospitalDashboard
       │    ├── /hospital/patients → PatientManagement
       │    └── ... (30 total)
       └── Admin Routes (ProtectedRoute + ADMIN_ROLES)
            ├── /admin → AdminDashboard
            └── ... (22 total)
```

### 3.2 State Management

```
AuthContext
  ├── user (current user object)
  ├── login(email, password)
  ├── register(data)
  ├── logout()
  ├── isAuthenticated
  └── loading

Per-Page State (useState/useEffect)
  ├── Data loaded via API calls
  ├── Loading/error states
  └── Form state management
```

### 3.3 API Client Architecture

```
services/api.ts
  ├── axios.create({ baseURL: /api/v1 })
  ├── Request Interceptor
  │    └── Attach Bearer token from localStorage
  ├── Response Interceptor
  │    ├── 401 → Clear tokens, redirect /login
  │    └── Normalize validation errors (array → string)
  └── 39 API Modules
       ├── authAPI (6 methods)
       ├── patientsAPI (7 methods)
       ├── documentsAPI (7 methods)
       ├── insuranceAPI (7 methods)
       └── ... (35 more modules)
```

### 3.4 Shared Component Library

```
components/common/
  ├── AppLayout.tsx
  │    ├── Responsive sidebar navigation
  │    ├── Collapsible sections
  │    ├── Portal-based theming
  │    └── Mobile drawer
  └── SharedComponents.tsx
       ├── StatCard
       ├── ProgressCard
       ├── MetricGauge
       ├── GlassCard
       ├── SectionHeader
       ├── StatusBadge
       └── TimelineItem
```

---

## 4. Mobile Architecture

### 4.1 Navigation Structure

```
App.tsx
  └── NavigationContainer
       ├── AuthStack (unauthenticated)
       │    ├── LoginScreen
       │    └── RegisterScreen
       └── MainDrawer (authenticated)
            ├── PatientTabs
            │    ├── Dashboard
            │    ├── Health
            │    ├── Cancer Risk
            │    └── Profile
            ├── HospitalTabs
            │    ├── Dashboard
            │    ├── Patients
            │    └── Settings
            └── AdminTabs
                 ├── Dashboard
                 ├── Users
                 └── System
```

---

## 5. Data Flow Patterns

### 5.1 Page Data Load Pattern

```
┌─────────────┐   useEffect    ┌──────────────┐   axios    ┌──────────────┐
│  React Page │ ──────────────→│  api.ts      │ ─────────→│  FastAPI     │
│  Component  │                │  Module      │            │  Router      │
│             │   setData()    │              │  JSON      │              │
│  useState() │ ←──────────────│  response    │ ←─────────│  SQLAlchemy  │
└─────────────┘                └──────────────┘            └──────────────┘
     │                                                          │
     │ renders                                                  │ queries
     ▼                                                          ▼
┌─────────────┐                                          ┌──────────────┐
│  MUI Cards  │                                          │  SQLite/PG   │
│  Charts     │                                          │  Database    │
│  Tables     │                                          └──────────────┘
└─────────────┘
```

### 5.2 File Upload Flow

```
User selects file
     │
     ▼
FormData (file + metadata)
     │
     ▼
POST /documents/upload
     │
     ▼
Backend validates (50MB max, allowed types)
     │
     ▼
Save to uploads/<user_id>/<uuid>_<filename>
     │
     ▼
Create Document record in DB
     │
     ▼
Return document metadata
```

---

## 6. Deployment Architecture

### 6.1 Development

```
localhost:3000  ←  React dev server (npm start)
localhost:8000  ←  Uvicorn + FastAPI (python run.py)
cancerguard.db ←  SQLite file database
```

### 6.2 Production (Recommended)

```
                    ┌─────────────┐
                    │   Nginx     │
                    │   Reverse   │
                    │   Proxy     │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        ┌─────┴─────┐           ┌──────┴──────┐
        │  React    │           │  Uvicorn    │
        │  Build    │           │  Workers    │
        │  (static) │           │  (FastAPI)  │
        └───────────┘           └──────┬──────┘
                                       │
                                ┌──────┴──────┐
                                │ PostgreSQL  │
                                │ Database    │
                                └─────────────┘
```

---

## 7. Security Architecture

```
┌──────────────────────────────────────────────────┐
│                Security Layers                    │
├──────────────────────────────────────────────────┤
│  Layer 1: CORS (allowed origins whitelist)        │
│  Layer 2: JWT Authentication (access + refresh)   │
│  Layer 3: RBAC (patient/doctor/hospital/admin)    │
│  Layer 4: Input Validation (Pydantic schemas)     │
│  Layer 5: SQL Injection Prevention (ORM)          │
│  Layer 6: Password Hashing (bcrypt)               │
│  Layer 7: Audit Logging (all critical actions)    │
│  Layer 8: Soft Delete (data preservation)         │
└──────────────────────────────────────────────────┘
```
