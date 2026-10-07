"""Converted endpoints persist real rows and do not invent medical scores."""
import asyncio
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.database import get_db_context
from app.main import app
from app.models.hospital import Doctor
from app.models.patient import Patient
from app.models.user import User
from app.security import hash_password
from sqlalchemy import select


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _register(client, email: str, username: str) -> dict:
    response = client.post("/api/v1/auth/register", json={
        "email": email,
        "username": username,
        "password": "Patient1a",
        "confirm_password": "Patient1a",
        "first_name": "Pat",
        "last_name": "Ient",
        "date_of_birth": "1990-05-02T00:00:00",
        "gender": "female",
    })
    assert response.status_code == 201, response.text
    return response.json()


def test_register_login_and_health_summary_counts_real_records(client):
    created = _register(client, "patient.real@example.com", "patientreal")
    token = created["access_token"]
    assert created["user"]["role"] == "patient"

    login = client.post("/api/v1/auth/login", json={
        "email": "patient.real@example.com",
        "password": "Patient1a",
    })
    assert login.status_code == 200

    summary = client.get("/api/v1/patients/me/health-summary", headers=_auth(token))
    assert summary.status_code == 200
    assert summary.json()["total_health_records"] == 0

    logged = client.post("/api/v1/symptoms", headers=_auth(token), json={
        "name": "Fatigue",
        "severity": 3,
        "body_part": "General",
        "notes": "Recorded by the patient",
    })
    assert logged.status_code == 201, logged.text

    again = client.get("/api/v1/patients/me/health-summary", headers=_auth(token))
    assert again.json()["total_health_records"] == 1


def test_goals_persist(client):
    created = _register(client, "goals.real@example.com", "goalsreal")
    token = created["access_token"]
    saved = client.post("/api/v1/goals", headers=_auth(token), json={
        "title": "Walk daily",
        "category": "exercise",
        "target": "30 minutes",
        "unit": "minutes",
    })
    assert saved.status_code == 201, saved.text
    listed = client.get("/api/v1/goals", headers=_auth(token))
    assert listed.status_code == 200
    titles = [row["goal_description"] for row in listed.json()]
    assert "Walk daily" in titles


def test_beds_round_trip_and_analytics_for_non_patient_roles(client):
    async def _insert_staff():
        async with get_db_context() as db:
            admin = User(
                email="admin.real@example.com",
                username="adminreal",
                hashed_password=hash_password("Admin123a"),
                first_name="Ada",
                last_name="Min",
                role="system_admin",
                status="active",
            )
            analyst = User(
                email="analyst.real@example.com",
                username="analystreal",
                hashed_password=hash_password("Analyst1a"),
                first_name="Ana",
                last_name="Lyst",
                role="data_analyst",
                status="active",
            )
            db.add_all([admin, analyst])

    asyncio.run(_insert_staff())

    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin.real@example.com",
        "password": "Admin123a",
    })
    assert admin_login.status_code == 200, admin_login.text
    admin_token = admin_login.json()["access_token"]

    hospital = client.post("/api/v1/hospitals", headers=_auth(admin_token), json={
        "name": "Recorded General",
        "code": "RGH1",
        "city": "Austin",
    })
    assert hospital.status_code == 201, hospital.text
    hospital_id = hospital.json()["id"]

    bed = client.post("/api/v1/hospitals/beds", headers=_auth(admin_token), json={
        "hospital_id": hospital_id,
        "ward": "Oncology",
        "bed_code": "ONC-01",
    })
    assert bed.status_code == 201, bed.text

    beds = client.get("/api/v1/hospitals/beds", headers=_auth(admin_token), params={"hospital_id": hospital_id})
    assert beds.status_code == 200
    assert any(row["bed_code"] == "ONC-01" or row["id"] == "ONC-01" for row in beds.json())

    analyst_login = client.post("/api/v1/auth/login", json={
        "email": "analyst.real@example.com",
        "password": "Analyst1a",
    })
    assert analyst_login.status_code == 200
    overview = client.get("/api/v1/analytics/operations", headers=_auth(analyst_login.json()["access_token"]))
    assert overview.status_code == 200, overview.text
    body = overview.json()
    assert body["total_hospitals"] >= 1
    assert body["total_beds"] >= 1
    assert body["model_accuracy"] is None
    assert body["detection_rate"] is None


def test_cancer_predict_is_a_documented_prototype_and_blood_without_markers_is_unavailable(client):
    created = _register(client, "risk.real@example.com", "riskreal")
    token = created["access_token"]
    profile = client.get("/api/v1/patients/me", headers=_auth(token))
    assert profile.status_code == 200, profile.text
    patient_id = profile.json()["id"]

    denied = client.post(f"/api/v1/cancer-detection/predict/{patient_id}", headers=_auth(token))
    assert denied.status_code == 403

    async def _consent():
        async with get_db_context() as db:
            patient = (await db.execute(select(Patient).where(Patient.id == patient_id))).scalar_one()
            patient.ai_analysis_consent = True

    asyncio.run(_consent())

    predicted = client.post(f"/api/v1/cancer-detection/predict/{patient_id}", headers=_auth(token))
    assert predicted.status_code == 200, predicted.text
    payload = predicted.json()
    assert payload["model_version"] == "prototype-1"
    assert payload["model_confidence"] == 0.0

    sample = client.post("/api/v1/blood-samples", headers=_auth(token), json={
        "patient_id": patient_id,
        "test_type": "cbc",
        "collection_date": datetime.now(timezone.utc).isoformat(),
    })
    assert sample.status_code == 201, sample.text
    analyzed = client.post(f"/api/v1/blood-samples/{sample.json()['id']}/analyze", headers=_auth(token))
    assert analyzed.status_code == 200, analyzed.text
    assert analyzed.json()["risk_category"] == "not_available"
    assert analyzed.json()["model_version"] == "not_available"


def test_demo_seed_is_refused_without_the_flag_and_startup_did_not_insert_demo_users(client):
    missing = client.post("/api/v1/auth/login", json={
        "email": "admin@cancerguard.ai",
        "password": "Admin@123456",
    })
    assert missing.status_code in (401, 400)

    async def _admin():
        async with get_db_context() as db:
            existing = (await db.execute(select(User).where(User.email == "seed.admin@example.com"))).scalar_one_or_none()
            if existing:
                return
            db.add(User(
                email="seed.admin@example.com",
                username="seedadmin",
                hashed_password=hash_password("Admin123a"),
                first_name="Seed",
                last_name="Guard",
                role="system_admin",
                status="active",
            ))

    asyncio.run(_admin())
    login = client.post("/api/v1/auth/login", json={
        "email": "seed.admin@example.com",
        "password": "Admin123a",
    })
    assert login.status_code == 200, login.text
    refused = client.post("/api/v1/admin/seed-data", headers=_auth(login.json()["access_token"]))
    assert refused.status_code == 403


def test_patient_writes_round_trip(client):
    created = _register(client, "writes.real@example.com", "writesreal")
    headers = _auth(created["access_token"])

    meal = client.post("/api/v1/diet/log", headers=headers, json={
        "meal_type": "lunch", "calories": 420, "water_ml": 250, "notes": "salad",
    })
    assert meal.status_code == 201, meal.text
    diet = client.get("/api/v1/diet/log", headers=headers)
    assert diet.status_code == 200
    assert diet.json()["today_calories"] == 420
    assert diet.json()["today_water_ml"] == 250

    exercise = client.post("/api/v1/exercise/sessions", headers=headers, json={
        "exercise_type": "walking", "duration_minutes": 20, "steps": 1000,
    })
    assert exercise.status_code == 201, exercise.text
    sessions = client.get("/api/v1/exercise/sessions", headers=headers)
    assert sessions.json()["steps_today"] == 1000

    screening = client.post("/api/v1/screening/schedule", headers=headers, json={
        "cancer_type": "breast", "screening_method": "mammogram", "urgency": "routine",
    })
    assert screening.status_code == 201, screening.text
    schedule = client.get("/api/v1/screening/schedule", headers=headers)
    assert any(row["test"] == "mammogram" for row in schedule.json())

    member = client.post("/api/v1/family-health/members", headers=headers, json={
        "relationship_type": "mother",
        "relative_name": "Ann",
        "condition_name": "Breast cancer",
        "is_cancer": True,
        "cancer_type": "breast",
    })
    assert member.status_code == 201, member.text
    tree = client.get("/api/v1/family-health/tree", headers=headers)
    assert any(row["name"] == "Ann" for row in tree.json())

    mood = client.post("/api/v1/mental-health/assessments", headers=headers, json={
        "tool_name": "mood", "total_score": 6, "notes": "recorded",
    })
    assert mood.status_code == 201, mood.text
    history = client.get("/api/v1/mental-health/mood-history", headers=headers)
    assert any(row["total_score"] == 6 for row in history.json())

    allergy = client.post("/api/v1/patients/me/allergies", headers=headers, json={
        "allergy_type": "Drug", "allergen": "Penicillin", "severity": "Severe", "reaction": "rash",
    })
    assert allergy.status_code == 200, allergy.text
    contact = client.post("/api/v1/patients/me/emergency-contacts", headers=headers, json={
        "name": "Sam", "relationship": "spouse", "phone": "5550100",
    })
    assert contact.status_code == 201, contact.text
    profile = client.get("/api/v1/patients/me", headers=headers)
    body = profile.json()
    assert any(row["allergen"] == "Penicillin" for row in body["allergies"])
    assert any(row["name"] == "Sam" for row in body["emergency_contacts"])

    medication = client.post("/api/v1/pharmacy/prescriptions", headers=headers, json={
        "medication_name": "Tamoxifen", "dosage": "20mg", "frequency": "daily",
    })
    assert medication.status_code == 201, medication.text
    listed = client.get("/api/v1/pharmacy/prescriptions", headers=headers)
    assert listed.status_code == 200
    assert any(row["medication_name"] == "Tamoxifen" and row["adherence"] is None for row in listed.json())
    inventory = client.get("/api/v1/pharmacy/inventory", headers=headers)
    assert inventory.status_code == 200
    assert inventory.json() == []

    opinion = client.post("/api/v1/treatment/second-opinion", headers=headers, json={
        "original_diagnosis": "Stage II", "notes": "review margins",
    })
    assert opinion.status_code == 201, opinion.text
    opinions = client.get("/api/v1/treatment/second-opinion", headers=headers)
    assert any(row["original_diagnosis"] == "Stage II" for row in opinions.json())

    requested = client.post("/api/v1/genetics/test-request", headers=headers, json={
        "panel_name": "BRCA1/BRCA2 Analysis", "notes": "family history",
    })
    assert requested.status_code == 201, requested.text
    assert requested.json()["status"] == "requested"


def test_appointment_is_stored_and_cancelled(client):
    created = _register(client, "appt.real@example.com", "apptreal")
    patient_headers = _auth(created["access_token"])
    patient_id = client.get("/api/v1/patients/me", headers=patient_headers).json()["id"]

    async def _staff():
        async with get_db_context() as db:
            admin = User(
                email="appt.admin@example.com",
                username="apptadmin",
                hashed_password=hash_password("Admin123a"),
                first_name="Hosp",
                last_name="Admin",
                role="hospital_admin",
                status="active",
            )
            doctor_user = User(
                email="appt.doc@example.com",
                username="apptdoc",
                hashed_password=hash_password("Doctor1a"),
                first_name="Dee",
                last_name="Oc",
                role="doctor",
                status="active",
            )
            db.add_all([admin, doctor_user])
            await db.flush()
            return doctor_user.id

    doctor_user_id = asyncio.run(_staff())
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "appt.admin@example.com", "password": "Admin123a",
    })
    assert admin_login.status_code == 200, admin_login.text
    hospital = client.post("/api/v1/hospitals", headers=_auth(admin_login.json()["access_token"]), json={
        "name": "Appointment General", "code": "APPT1", "city": "Austin",
    })
    assert hospital.status_code == 201, hospital.text

    async def _doctor():
        async with get_db_context() as db:
            row = Doctor(
                user_id=doctor_user_id,
                hospital_id=hospital.json()["id"],
                medical_license_number="LIC-APPT-1",
                specialization="oncologist",
            )
            db.add(row)
            await db.flush()
            return row.id

    doctor_id = asyncio.run(_doctor())
    booked = client.post("/api/v1/appointments", headers=patient_headers, params={
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "appointment_type": "consultation",
        "scheduled_date": "2026-11-01T15:00:00+00:00",
        "reason": "Follow up",
    })
    assert booked.status_code == 201, booked.text
    appointment_id = booked.json()["appointment_id"]
    mine = client.get("/api/v1/appointments/my", headers=patient_headers)
    assert any(row["id"] == appointment_id for row in mine.json())
    cancelled = client.put(f"/api/v1/appointments/{appointment_id}/status", headers=patient_headers, params={
        "new_status": "cancelled", "cancellation_reason": "schedule conflict",
    })
    assert cancelled.status_code == 200, cancelled.text
    again = client.get("/api/v1/appointments/my", headers=patient_headers)
    match = next(row for row in again.json() if row["id"] == appointment_id)
    assert match["status"] == "cancelled"
