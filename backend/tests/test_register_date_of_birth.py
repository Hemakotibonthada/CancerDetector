"""Registration must accept the date-only DOB an HTML date input submits."""
from __future__ import annotations

import os
import sqlite3
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import pytest

# Configure the app before it is imported. Testing skips demo seed data and
# uses a throwaway SQLite file so local dev (and this suite) stay off Postgres.
_DB_PATH = Path(tempfile.mkdtemp(prefix="cg-register-")) / "test.db"
os.environ["ENVIRONMENT"] = "testing"
os.environ["DB_USE_SQLITE"] = "true"
os.environ["DB_SQLITE_PATH"] = str(_DB_PATH)
os.environ.pop("DATABASE_URL", None)
os.environ.setdefault("AUTH_SECRET_KEY", "test-secret-key-for-register-dob")

from app.config import reset_settings
import app.database as _database

# Other test modules may import the app first and cache a different SQLite path.
reset_settings()
_database._engine = None
_database._session_factory = None

from fastapi.testclient import TestClient
from sqlalchemy.dialects import postgresql

from app.main import app
from app.models.user import User
from app.schemas.dates import parse_optional_datetime
from app.schemas.patient import AllergyCreate
from app.schemas.user import UserRegister, UserUpdate


@pytest.fixture(scope="module")
def client():
    # Entering the context runs startup, which creates the SQLite tables.
    with TestClient(app) as test_client:
        yield test_client

_PASSWORD = "Secret123"


def _payload(**overrides):
    data = {
        "email": "vema@example.com",
        "username": "vema",
        "password": _PASSWORD,
        "confirm_password": _PASSWORD,
        "first_name": "Vema",
        "last_name": "Naidu",
        "phone_number": "7659993331",
        "role": "patient",
        "gender": "male",
        "date_of_birth": "1998-09-03",
    }
    data.update(overrides)
    return data


def _stored_dob(email: str):
    with sqlite3.connect(_DB_PATH) as conn:
        row = conn.execute(
            "SELECT date_of_birth FROM user WHERE email = ?", (email,)
        ).fetchone()
    assert row is not None, email
    return row[0]


def test_date_of_birth_column_is_timestamp_without_time_zone():
    """Production Postgres created this column from the model. No ALTER is required."""
    compiled = User.__table__.c.date_of_birth.type.compile(dialect=postgresql.dialect())
    assert compiled == "TIMESTAMP WITHOUT TIME ZONE"


def test_date_only_string_becomes_naive_midnight():
    parsed = parse_optional_datetime("1998-09-03", naive=True)
    assert parsed == datetime(1998, 9, 3)
    assert parsed.tzinfo is None
    # Keep the calendar date the client sent; do not shift it through UTC.
    aware = parse_optional_datetime("1998-09-03T00:00:00-07:00", naive=True)
    assert aware == datetime(1998, 9, 3)
    assert aware.tzinfo is None
    assert parse_optional_datetime("", naive=True) is None
    assert parse_optional_datetime(None, naive=True) is None
    # timestamptz columns need an aware UTC value.
    aware_utc = parse_optional_datetime("1998-09-03", naive=False)
    assert aware_utc == datetime(1998, 9, 3, tzinfo=timezone.utc)


def test_register_schema_accepts_html_date_and_blank():
    user = UserRegister.model_validate(_payload())
    assert user.date_of_birth == datetime(1998, 9, 3)
    assert user.date_of_birth.tzinfo is None

    blank = UserRegister.model_validate(_payload(email="blank@example.com", username="blank", date_of_birth=""))
    assert blank.date_of_birth is None

    omitted = UserRegister.model_validate(
        {k: v for k, v in _payload(email="omit@example.com", username="omit").items() if k != "date_of_birth"}
    )
    assert omitted.date_of_birth is None

    updated = UserUpdate.model_validate({"date_of_birth": "1998-09-03"})
    assert updated.date_of_birth == datetime(1998, 9, 3)
    assert updated.date_of_birth.tzinfo is None

    allergy = AllergyCreate.model_validate({
        "allergy_type": "drug",
        "allergen": "penicillin",
        "severity": "moderate",
        "onset_date": "2010-05-01",
    })
    assert allergy.onset_date == datetime(2010, 5, 1)
    assert allergy.onset_date.tzinfo is None


def test_register_with_date_only_dob_persists_patient(client):
    response = client.post("/api/v1/auth/register", json=_payload())
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["date_of_birth"].startswith("1998-09-03")
    assert body["user"]["health_id"]

    stored = _stored_dob("vema@example.com")
    assert stored is not None
    assert stored.startswith("1998-09-03")

    with sqlite3.connect(_DB_PATH) as conn:
        patient = conn.execute(
            "SELECT health_id FROM patient WHERE user_id = (SELECT id FROM user WHERE email = ?)",
            ("vema@example.com",),
        ).fetchone()
    assert patient is not None
    assert patient[0] == body["user"]["health_id"]


def test_register_with_blank_dob_succeeds(client):
    response = client.post(
        "/api/v1/auth/register",
        json=_payload(
            email="blank-dob@example.com",
            username="blankdob",
            date_of_birth="",
        ),
    )
    assert response.status_code == 201, response.text
    assert response.json()["user"]["date_of_birth"] is None
    assert _stored_dob("blank-dob@example.com") is None


def test_register_with_null_and_full_datetime_dob(client):
    null_response = client.post(
        "/api/v1/auth/register",
        json=_payload(email="null-dob@example.com", username="nulldob", date_of_birth=None),
    )
    assert null_response.status_code == 201, null_response.text
    assert _stored_dob("null-dob@example.com") is None

    full = client.post(
        "/api/v1/auth/register",
        json=_payload(
            email="full-dob@example.com",
            username="fulldob",
            date_of_birth="1980-01-15T00:00:00",
        ),
    )
    assert full.status_code == 201, full.text
    assert _stored_dob("full-dob@example.com").startswith("1980-01-15")


def test_profile_update_accepts_date_only_dob(client):
    registered = client.post(
        "/api/v1/auth/register",
        json=_payload(email="profile@example.com", username="profiledob", date_of_birth=""),
    )
    assert registered.status_code == 201, registered.text
    token = registered.json()["access_token"]
    user_id = registered.json()["user"]["id"]

    updated = client.put(
        f"/api/v1/users/{user_id}",
        json={"date_of_birth": "1998-09-03"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["date_of_birth"].startswith("1998-09-03")
    assert _stored_dob("profile@example.com").startswith("1998-09-03")


def test_add_allergy_accepts_date_only_onset(client):
    registered = client.post(
        "/api/v1/auth/register",
        json=_payload(email="allergy@example.com", username="allergydob", date_of_birth="1990-02-02"),
    )
    assert registered.status_code == 201, registered.text
    token = registered.json()["access_token"]

    created = client.post(
        "/api/v1/patients/me/allergies",
        json={
            "allergy_type": "drug",
            "allergen": "penicillin",
            "severity": "moderate",
            "onset_date": "2010-05-01",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert created.status_code == 200, created.text

    with sqlite3.connect(_DB_PATH) as conn:
        onset = conn.execute(
            "SELECT onset_date FROM patient_allergies WHERE allergen = ?",
            ("penicillin",),
        ).fetchone()
    assert onset is not None
    assert onset[0].startswith("2010-05-01")
