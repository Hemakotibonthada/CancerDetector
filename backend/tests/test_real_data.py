"""Converted endpoints persist real rows and do not invent medical scores."""
import asyncio
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.database import get_db_context
from app.main import app
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
