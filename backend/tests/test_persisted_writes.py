"""Admin and hospital dialogs persist, and the SPA fallback serves real files."""
import asyncio
import json
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.config import PROJECT_DIR
from app.database import get_db_context
from app.main import app
from app.models.hospital import HospitalStaff
from app.models.user import User
from app.security import hash_password


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _login(client: TestClient, email: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _insert_user(email: str, username: str, role: str, password: str = "Staff123a") -> None:
    async def _run():
        async with get_db_context() as db:
            db.add(User(
                email=email,
                username=username,
                hashed_password=hash_password(password),
                first_name="Staff",
                last_name="User",
                role=role,
                status="active",
            ))

    asyncio.run(_run())


def test_spa_routes_and_api_posts_with_a_frontend_build():
    build = PROJECT_DIR / "frontend" / "build"
    build.mkdir(parents=True, exist_ok=True)
    index = build / "index.html"
    if not index.exists():
        index.write_text("<!doctype html><html><body>spa</body></html>", encoding="utf-8")
    icon = build / "favicon.ico"
    if not icon.exists():
        icon.write_bytes(b"\x00\x00\x01\x00")

    with TestClient(app) as client:
        login = client.get("/login")
        assert login.status_code == 200, login.text
        assert "text/html" in login.headers["content-type"]
        assert client.get("/patient").status_code == 200
        icon_response = client.get("/favicon.ico")
        assert icon_response.status_code == 200
        assert len(icon_response.content) > 0

        denied = client.post("/api/v1/hospitals", json={"name": "Should Not 405", "code": "NO405"})
        assert denied.status_code != 405
        assert denied.status_code in (401, 403)
        health = client.get("/api/v1/health")
        assert health.status_code == 200
        assert health.headers["content-type"].startswith("application/json")


def test_dialogs_persist_and_permissions_hold():
    _insert_user("writes.admin@example.com", "writesadmin", "system_admin")
    _insert_user("writes.super@example.com", "writessuper", "super_admin")
    _insert_user("writes.hospital@example.com", "writeshospital", "hospital_admin")
    _insert_user("writes.research@example.com", "writesresearch", "researcher")
    _insert_user("writes.pharm@example.com", "writespharm", "pharmacist")

    with TestClient(app) as client:
        admin = _login(client, "writes.admin@example.com", "Staff123a")
        super_admin = _login(client, "writes.super@example.com", "Staff123a")
        hospital_admin = _login(client, "writes.hospital@example.com", "Staff123a")
        researcher = _login(client, "writes.research@example.com", "Staff123a")
        pharmacist = _login(client, "writes.pharm@example.com", "Staff123a")

        registered = client.post("/api/v1/auth/register", json={
            "email": "writes.patient@example.com",
            "username": "writespatient",
            "password": "Patient1a",
            "confirm_password": "Patient1a",
            "first_name": "Pat",
            "last_name": "Ient",
        })
        assert registered.status_code == 201, registered.text
        patient = registered.json()["access_token"]
        health_id = registered.json()["user"]["health_id"]

        assert client.post("/api/v1/users", headers=_auth(patient), json={
            "email": "nope@example.com", "first_name": "No", "last_name": "Pe", "password": "Patient1a", "role": "patient",
        }).status_code == 403

        assert client.get("/api/v1/billing/subscriptions").status_code == 401
        assert client.get("/api/v1/billing/revenue").status_code == 401
        assert client.get("/api/v1/billing/dashboard/stats").status_code == 401
        assert client.get("/api/v1/research/dashboard/stats").status_code == 401
        assert client.get("/api/v1/research/dashboard/stats", headers=_auth(patient)).status_code == 403
        assert client.get("/api/v1/research/dashboard/stats", headers=_auth(researcher)).status_code == 200
        assert client.get("/api/v1/billing/subscriptions", headers=_auth(admin)).json() == []
        assert "revenue_trend" in client.get("/api/v1/billing/revenue", headers=_auth(admin)).json()
        assert client.get("/api/v1/billing/dashboard/stats", headers=_auth(admin)).status_code == 200

        hospital = client.post("/api/v1/hospitals", headers=_auth(admin), json={
            "name": "Write General", "code": "WG1", "city": "Austin",
        })
        assert hospital.status_code == 201, hospital.text
        hospital_id = hospital.json()["id"]

        created_patient = client.post("/api/v1/users", headers=_auth(hospital_admin), json={
            "email": "writes.created@example.com",
            "first_name": "Created",
            "last_name": "Patient",
            "password": "Patient1a",
            "role": "patient",
            "must_change_password": True,
        })
        assert created_patient.status_code == 201, created_patient.text
        assert created_patient.json()["role"] == "patient"
        assert created_patient.json()["welcome_email_sent"] is False
        listed = client.get("/api/v1/users", headers=_auth(admin), params={"page_size": 100})
        assert any(row["email"] == "writes.created@example.com" for row in listed.json()["users"])

        privileged = client.post("/api/v1/users", headers=_auth(hospital_admin), json={
            "email": "writes.super2@example.com",
            "first_name": "Super",
            "last_name": "Nope",
            "password": "Patient1a",
            "role": "super_admin",
        })
        assert privileged.status_code == 403

        doctor = client.post("/api/v1/users", headers=_auth(admin), json={
            "email": "writes.doctor@example.com",
            "first_name": "Dee",
            "last_name": "Octor",
            "password": "Doctor1a",
            "role": "doctor",
        })
        assert doctor.status_code == 201, doctor.text
        assert _login(client, "writes.doctor@example.com", "Doctor1a")
        doctors = client.get("/api/v1/hospitals/doctors", headers=_auth(admin))
        assert doctors.status_code == 200, doctors.text
        doctor_id = doctors.json()[0]["id"]

        course = client.post("/api/v1/training/courses", headers=_auth(admin), json={
            "title": "Hand hygiene", "category": "clinical", "level": "beginner",
            "instructor": "Nurse Lee", "duration_hours": 2, "module_count": 3,
        })
        assert course.status_code == 201, course.text
        assert course.json()["enrolled"] == 0
        courses = client.get("/api/v1/training/courses", headers=_auth(admin)).json()
        assert any(row["title"] == "Hand hygiene" for row in courses)
        assert client.post("/api/v1/training/courses", headers=_auth(patient), json={
            "title": "Nope", "category": "clinical",
        }).status_code == 403

        integration = client.post("/api/v1/integrations", headers=_auth(admin), json={
            "name": "Lab link", "type": "lab", "endpoint_url": "https://example.invalid/lab",
            "api_key": "super-secret-key", "sync_frequency": "15",
        })
        assert integration.status_code == 201, integration.text
        assert "super-secret-key" not in integration.text
        assert integration.json()["status"] == "configured"
        assert integration.json()["apiKey"] == "stored"
        saved = client.get("/api/v1/integrations", headers=_auth(admin)).json()
        assert any(row["name"] == "Lab link" for row in saved)

        lab = client.post("/api/v1/lab/orders", headers=_auth(admin), json={
            "health_id": health_id, "doctor_id": doctor_id, "test_type": "cbc", "priority": "stat", "notes": "Fever",
        })
        assert lab.status_code == 201, lab.text
        lab_rows = client.get("/api/v1/lab/orders", headers=_auth(admin)).json()
        assert any(row["test_type"] == "cbc" and row["priority"] == "stat" for row in lab_rows)

        study = client.post("/api/v1/radiology/studies", headers=_auth(admin), json={
            "health_id": health_id, "modality": "ct", "body_part": "chest", "priority": "routine",
            "clinical_indication": "Cough",
        })
        assert study.status_code == 201, study.text
        assert study.json()["ai_status"] == "not_available"
        assert study.json()["ai_confidence"] is None
        studies = client.get("/api/v1/radiology/studies", headers=_auth(admin)).json()
        assert any(row["body_part"] == "chest" for row in studies)

        invoice = client.post("/api/v1/billing/hospital-invoices", headers=_auth(admin), json={
            "hospital_name": "Write General", "billing_period": "October 2026", "amount": 1250, "due_date": "2026-11-01",
        })
        assert invoice.status_code == 201, invoice.text
        invoices = client.get("/api/v1/billing/invoices", headers=_auth(admin)).json()
        match = next(row for row in invoices if row["hospital"] == "Write General")
        assert match["amount"] == 1250
        assert match["plan"] == "October 2026"

        room = client.post("/api/v1/surgery/or-schedule", headers=_auth(admin), json={
            "hospital_id": hospital_id, "name": "OR-Write",
        })
        assert room.status_code == 201, room.text
        surgery = client.post("/api/v1/surgery", headers=_auth(admin), json={
            "health_id": health_id,
            "doctor_id": doctor_id,
            "procedure": "Biopsy",
            "operating_room": "OR-Write",
            "scheduled_date": "2026-10-08T09:30",
            "duration_hours": 1.5,
            "priority": "elective",
            "anesthesia": "general",
        })
        assert surgery.status_code == 201, surgery.text
        surgeries = client.get("/api/v1/surgery", headers=_auth(admin)).json()["surgeries"]
        assert any(row["type"] == "Biopsy" and row["patient"] == "Pat Ient" for row in surgeries)
        rooms = client.get("/api/v1/surgery/or-schedule", headers=_auth(admin)).json()
        assert any(row["room"] == "OR-Write" and row["status"] == "In Use" for row in rooms)

        admitted = client.post("/api/v1/hospitals/admissions", headers=_auth(admin), json={
            "health_id": health_id, "ward": "oncology", "doctor_id": doctor_id, "reason": "Observation",
        })
        assert admitted.status_code == 201, admitted.text
        assert admitted.json()["status"] == "occupied"
        beds = client.get("/api/v1/hospitals/beds", headers=_auth(admin)).json()
        occupied = next(row for row in beds if row["patient"] == "Pat Ient")
        transfer = client.put(f"/api/v1/hospitals/beds/{occupied['record_id']}", headers=_auth(admin), json={
            "transfer_to_ward": "icu", "transfer_reason": "Closer monitoring", "transfer_status": "requested",
        })
        assert transfer.status_code == 200, transfer.text
        approved = client.put(f"/api/v1/hospitals/beds/{occupied['record_id']}", headers=_auth(admin), json={
            "transfer_status": "approved",
        })
        assert approved.status_code == 200, approved.text
        moved = client.get("/api/v1/hospitals/beds", headers=_auth(admin)).json()
        assert any(row["record_id"] == occupied["record_id"] and row["ward"] == "icu" for row in moved)

        triage = client.post("/api/v1/emergency/cases", headers=_auth(admin), json={
            "health_id": health_id,
            "triage_level": "Emergency",
            "chief_complaint": "Chest pain",
            "heart_rate": 110,
            "blood_pressure": "150/90",
            "spo2": 94,
            "temperature": 37.2,
            "assigned_doctor_id": doctor_id,
        })
        assert triage.status_code == 201, triage.text
        assert triage.json()["triage"] == "Emergency"
        cases = client.get("/api/v1/emergency/cases", headers=_auth(admin)).json()
        assert any(row["chief"] == "Chest pain" for row in cases)

        session = client.post("/api/v1/telemedicine/sessions", headers=_auth(admin), json={
            "health_id": health_id,
            "doctor_id": doctor_id,
            "session_type": "followup",
            "date": "2026-10-09",
            "time": "15:00",
            "duration_minutes": 30,
            "platform": "video",
            "notes": "Review labs",
        })
        assert session.status_code == 201, session.text
        sessions = client.get("/api/v1/telemedicine/sessions", headers=_auth(admin)).json()
        assert any(row["patient"] == "Pat Ient" and row["type"] == "followup" for row in sessions)

        trial = client.post("/api/v1/clinical-trials", headers=_auth(admin), json={
            "title": "Write Trial",
            "phase": "Phase II",
            "target_enrollment": 40,
            "principal_investigator": "Dr. Dee",
            "sponsor": "Write Labs",
            "cancer_type": "Lung",
            "primary_endpoint": "Response",
            "start_date": "2026-10-01",
            "arms": "Arm A\nArm B",
        })
        assert trial.status_code == 201, trial.text
        assert trial.json()["phase"] == "Phase II"
        assert trial.json()["arms"] == ["Arm A", "Arm B"]
        trials = client.get("/api/v1/clinical-trials", headers=_auth(admin)).json()
        assert any(row["title"] == "Write Trial" and row["enrolled"] == 0 for row in trials)

        assert client.post("/api/v1/pharmacy/stock", headers=_auth(patient), json={
            "drug_name": "Denied", "quantity": 1,
        }).status_code == 403
        stock = client.post("/api/v1/pharmacy/stock", headers=_auth(pharmacist), json={
            "drug_name": "Ondansetron", "generic_name": "ondansetron", "quantity": 12,
            "batch_number": "B1", "expiry": "2027-01-01", "unit_price": 3.5,
        })
        assert stock.status_code == 201, stock.text
        inventory = client.get("/api/v1/pharmacy/inventory", headers=_auth(admin)).json()
        assert any(row["drug"] == "Ondansetron" and row["stock"] == 12 for row in inventory)

        blocked = client.post("/api/v1/data/backups", headers=_auth(admin))
        assert blocked.status_code == 403
        exported = client.post("/api/v1/data/backups", headers=_auth(super_admin))
        assert exported.status_code == 200, exported.text
        assert exported.headers["content-type"].startswith("application/json")
        body = exported.text
        assert "hashed_password" not in body
        assert "super-secret-key" not in body
        parsed = json.loads(body)
        assert "user" in parsed["tables"]
        history = client.get("/api/v1/data/backups", headers=_auth(admin)).json()
        assert history and history[0]["status"] == "completed"

        async def _add_staff():
            async with get_db_context() as db:
                admin_row = (await db.execute(
                    select(User).where(User.email == "writes.admin@example.com")
                )).scalar_one()
                for index in range(2):
                    db.add(HospitalStaff(
                        user_id=admin_row.id,
                        hospital_id=hospital_id,
                        employee_id=f"EMP-{index}",
                        position="nurse",
                    ))

        asyncio.run(_add_staff())
        dashboard = client.get(f"/api/v1/hospitals/{hospital_id}/dashboard", headers=_auth(admin))
        assert dashboard.status_code == 200, dashboard.text
        assert dashboard.json()["total_staff"] == 2
