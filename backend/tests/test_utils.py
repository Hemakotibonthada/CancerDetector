"""
Cancer Detection Platform - Backend Test Suite
Comprehensive tests for API endpoints, services, utilities, and models.
"""

import json
import math
import os
import secrets
import sys
import uuid
from datetime import datetime, date, timedelta
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

# ==================== Fixtures ====================

@pytest.fixture
def sample_patient():
    return {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "date_of_birth": "1985-03-15",
        "gender": "male",
        "blood_type": "O+",
        "emergency_contact": {
            "name": "Jane Doe",
            "phone": "+1987654321",
            "relationship": "spouse"
        }
    }


@pytest.fixture
def sample_vital_signs():
    return {
        "heart_rate": 72,
        "bp_systolic": 120,
        "bp_diastolic": 80,
        "temperature": 98.6,
        "respiratory_rate": 16,
        "oxygen_saturation": 98,
        "blood_glucose": 95,
        "pain_level": 2,
    }


@pytest.fixture
def sample_lab_results():
    return {
        "wbc": 7.5,
        "rbc": 5.0,
        "hemoglobin": 15.0,
        "hematocrit": 45,
        "platelet_count": 250,
        "sodium": 140,
        "potassium": 4.2,
        "chloride": 102,
        "bicarbonate": 24,
        "bun": 15,
        "creatinine": 1.0,
        "glucose_fasting": 90,
    }


@pytest.fixture
def sample_cancer_detection_request():
    return {
        "patient_id": str(uuid.uuid4()),
        "image_type": "mammography",
        "modality": "MAMMOGRAPHY",
        "notes": "Routine screening",
    }


@pytest.fixture
def sample_appointment():
    return {
        "patient_id": str(uuid.uuid4()),
        "doctor_id": str(uuid.uuid4()),
        "appointment_datetime": (datetime.utcnow() + timedelta(days=7)).isoformat(),
        "appointment_type": "consultation",
        "duration_minutes": 30,
        "notes": "Initial consultation",
    }


@pytest.fixture
def sample_billing_data():
    return {
        "patient_id": str(uuid.uuid4()),
        "cpt_code": "99213",
        "diagnosis_codes": ["C50.1", "Z12.31"],
        "amount": 250.00,
        "insurance_id": "INS-123456789",
    }


# ==================== Helper Utility Tests ====================

class TestStringUtilities:
    """Test string utility functions"""

    def test_generate_id(self):
        from backend.app.utils.helpers import generate_id
        id1 = generate_id()
        id2 = generate_id()
        assert id1 != id2
        assert len(id1) == 32

    def test_generate_id_with_prefix(self):
        from backend.app.utils.helpers import generate_id
        id1 = generate_id("patient")
        assert id1.startswith("patient_")

    def test_generate_short_id(self):
        from backend.app.utils.helpers import generate_short_id
        sid = generate_short_id(8)
        assert len(sid) == 8
        assert sid.isalnum()

    def test_generate_medical_record_number(self):
        from backend.app.utils.helpers import generate_medical_record_number
        mrn = generate_medical_record_number()
        assert mrn.startswith("MRN-")
        assert len(mrn) == 14

    def test_generate_case_number(self):
        from backend.app.utils.helpers import generate_case_number
        cn = generate_case_number()
        assert cn.startswith("CASE-")
        date_part = datetime.utcnow().strftime("%Y%m%d")
        assert date_part in cn

    def test_slugify(self):
        from backend.app.utils.helpers import slugify
        assert slugify("Hello World!") == "hello-world"
        assert slugify("Cancer Detection AI") == "cancer-detection-ai"
        assert slugify("Test  123") == "test-123"

    def test_truncate(self):
        from backend.app.utils.helpers import truncate
        assert truncate("Hello", 10) == "Hello"
        assert truncate("Hello World", 8) == "Hello..."
        assert truncate("Hi", 100) == "Hi"

    def test_mask_sensitive(self):
        from backend.app.utils.helpers import mask_sensitive
        assert mask_sensitive("1234567890", 4) == "******7890"
        assert mask_sensitive("AB", 4) == "**"

    def test_sanitize_filename(self):
        from backend.app.utils.helpers import sanitize_filename
        assert sanitize_filename("test<file>.pdf") == "test_file_.pdf"
        assert sanitize_filename("") == "unnamed_file"
        assert sanitize_filename("normal.jpg") == "normal.jpg"

    def test_normalize_phone(self):
        from backend.app.utils.helpers import normalize_phone
        assert normalize_phone("(555) 123-4567") == "+15551234567"
        assert normalize_phone("5551234567") == "+15551234567"

    def test_normalize_email(self):
        from backend.app.utils.helpers import normalize_email
        assert normalize_email("John@Example.COM") == "john@example.com"
        assert normalize_email("  test@test.org  ") == "test@test.org"


class TestValidationUtilities:
    """Test validation utility functions"""

    def test_validate_email_valid(self):
        from backend.app.utils.helpers import validate_email
        assert validate_email("test@example.com") is True
        assert validate_email("user.name@domain.org") is True

    def test_validate_email_invalid(self):
        from backend.app.utils.helpers import validate_email
        assert validate_email("invalid") is False
        assert validate_email("@domain.com") is False
        assert validate_email("user@") is False

    def test_validate_phone(self):
        from backend.app.utils.helpers import validate_phone
        assert validate_phone("+1234567890") is True
        assert validate_phone("123") is False

    def test_validate_ssn(self):
        from backend.app.utils.helpers import validate_ssn
        assert validate_ssn("123-45-6789") is True
        assert validate_ssn("12345678") is False

    def test_validate_date_of_birth(self):
        from backend.app.utils.helpers import validate_date_of_birth
        valid, err = validate_date_of_birth("1990-01-15")
        assert valid is True
        assert err is None

        valid, err = validate_date_of_birth("2099-01-01")
        assert valid is False

    def test_validate_icd10_code(self):
        from backend.app.utils.helpers import validate_icd10_code
        valid, err = validate_icd10_code("C50.1")
        assert valid is True

        valid, err = validate_icd10_code("INVALID")
        assert valid is False

    def test_validate_icd10_cancer_code(self):
        from backend.app.utils.helpers import validate_icd10_cancer_code
        assert validate_icd10_cancer_code("C50") is True
        assert validate_icd10_cancer_code("D09") is True
        assert validate_icd10_cancer_code("Z99") is False

    def test_validate_password_strength(self):
        from backend.app.utils.helpers import validate_password_strength
        valid, issues = validate_password_strength("Str0ng!Pass@123")
        assert valid is True

        valid, issues = validate_password_strength("weak")
        assert valid is False
        assert len(issues) > 0

    def test_validate_file_upload(self):
        from backend.app.utils.helpers import validate_file_upload
        valid, err = validate_file_upload("scan.jpg", 1024 * 1024)
        assert valid is True

        valid, err = validate_file_upload("malware.exe", 1024)
        assert valid is False


class TestEncryptionUtilities:
    """Test encryption utility functions"""

    def test_hash_and_verify_password(self):
        from backend.app.utils.helpers import hash_password, verify_password
        hashed, salt = hash_password("MySecurePass123!")
        assert verify_password("MySecurePass123!", hashed, salt) is True
        assert verify_password("WrongPassword", hashed, salt) is False

    def test_generate_token(self):
        from backend.app.utils.helpers import generate_token
        token = generate_token(32)
        assert len(token) > 0
        token2 = generate_token(32)
        assert token != token2

    def test_generate_otp(self):
        from backend.app.utils.helpers import generate_otp
        otp = generate_otp(6)
        assert len(otp) == 6
        assert otp.isdigit()

    def test_encrypt_decrypt_field(self):
        from backend.app.utils.helpers import encrypt_field, decrypt_field
        original = "Patient SSN: 123-45-6789"
        key = "test-encryption-key"
        encrypted = encrypt_field(original, key)
        decrypted = decrypt_field(encrypted, key)
        assert decrypted == original
        assert encrypted != original

    def test_compute_file_hash(self):
        from backend.app.utils.helpers import compute_file_hash
        content = b"test file content"
        hash1 = compute_file_hash(content)
        hash2 = compute_file_hash(content)
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA-256


class TestDateTimeUtilities:
    """Test date/time utility functions"""

    def test_calculate_age(self):
        from backend.app.utils.helpers import calculate_age
        birth = date(1990, 6, 15)
        age = calculate_age(birth)
        expected = (date.today().year - 1990 -
                    (1 if (date.today().month, date.today().day) < (6, 15) else 0))
        assert age == expected

    def test_time_ago(self):
        from backend.app.utils.helpers import time_ago
        now = datetime.utcnow()
        assert time_ago(now - timedelta(seconds=30)) == "just now"
        assert "minute" in time_ago(now - timedelta(minutes=5))
        assert "hour" in time_ago(now - timedelta(hours=3))
        assert "day" in time_ago(now - timedelta(days=2))

    def test_parse_datetime(self):
        from backend.app.utils.helpers import parse_datetime
        dt = parse_datetime("2024-01-15T10:30:00Z")
        assert dt is not None
        assert dt.year == 2024
        assert dt.month == 1

        dt = parse_datetime("2024-01-15")
        assert dt is not None

        dt = parse_datetime("invalid")
        assert dt is None

    def test_get_date_range(self):
        from backend.app.utils.helpers import get_date_range
        start, end = get_date_range("today")
        assert start.date() == date.today()

        start, end = get_date_range("last_7_days")
        assert (end - start).days >= 7


class TestMedicalUtilities:
    """Test medical calculation functions"""

    def test_calculate_bmi(self):
        from backend.app.utils.helpers import calculate_bmi
        bmi, category = calculate_bmi(70, 170)
        assert 24 <= bmi <= 25
        assert category == "normal"

        bmi, category = calculate_bmi(120, 170)
        assert category.startswith("obese")

        bmi, category = calculate_bmi(0, 170)
        assert bmi == 0.0

    def test_calculate_bsa(self):
        from backend.app.utils.helpers import calculate_bsa
        bsa = calculate_bsa(70, 170)
        assert 1.7 <= bsa <= 2.0

    def test_calculate_egfr(self):
        from backend.app.utils.helpers import calculate_egfr
        egfr = calculate_egfr(1.0, 50, False)
        assert egfr > 0

    def test_cancer_stage_to_numeric(self):
        from backend.app.utils.helpers import cancer_stage_to_numeric
        assert cancer_stage_to_numeric("I") == 1
        assert cancer_stage_to_numeric("III") == 3
        assert cancer_stage_to_numeric("IV") == 4
        assert cancer_stage_to_numeric("unknown") == -1

    def test_tnm_stage(self):
        from backend.app.utils.helpers import tnm_stage
        assert tnm_stage("Tis", "N0", "M0") == "0"
        assert tnm_stage("T1", "N0", "M0") == "I"
        assert tnm_stage("T4", "N2", "M1") == "IV"

    def test_blood_type_compatibility(self):
        from backend.app.utils.helpers import blood_type_compatibility
        assert blood_type_compatibility("O-", "O+") is True
        assert blood_type_compatibility("O-", "AB+") is True
        assert blood_type_compatibility("AB+", "O-") is False
        assert blood_type_compatibility("A+", "B+") is False


class TestPaginationUtilities:
    """Test pagination functions"""

    def test_paginate(self):
        from backend.app.utils.helpers import paginate
        items = list(range(100))
        result = paginate(items, page=1, page_size=10)
        assert len(result["items"]) == 10
        assert result["pagination"]["total_items"] == 100
        assert result["pagination"]["total_pages"] == 10
        assert result["pagination"]["has_next"] is True
        assert result["pagination"]["has_previous"] is False

    def test_paginate_last_page(self):
        from backend.app.utils.helpers import paginate
        items = list(range(25))
        result = paginate(items, page=3, page_size=10)
        assert len(result["items"]) == 5
        assert result["pagination"]["has_next"] is False
        assert result["pagination"]["has_previous"] is True

    def test_paginate_empty(self):
        from backend.app.utils.helpers import paginate
        result = paginate([], page=1, page_size=10)
        assert len(result["items"]) == 0
        assert result["pagination"]["total_pages"] == 1


class TestResponseFormatting:
    """Test response formatting functions"""

    def test_success_response(self):
        from backend.app.utils.helpers import success_response
        resp = success_response({"id": 1}, "Created successfully")
        assert resp["success"] is True
        assert resp["data"]["id"] == 1
        assert resp["message"] == "Created successfully"
        assert "timestamp" in resp

    def test_error_response(self):
        from backend.app.utils.helpers import error_response
        resp = error_response("Not found", 404)
        assert resp["success"] is False
        assert resp["error"]["code"] == 404

    def test_list_response(self):
        from backend.app.utils.helpers import list_response
        resp = list_response([1, 2, 3], total=10, page=1, page_size=3)
        assert resp["success"] is True
        assert len(resp["data"]) == 3
        assert resp["pagination"]["total_items"] == 10


class TestCollectionUtilities:
    """Test collection utility functions"""

    def test_chunk_list(self):
        from backend.app.utils.helpers import chunk_list
        chunks = chunk_list([1, 2, 3, 4, 5], 2)
        assert len(chunks) == 3
        assert chunks[0] == [1, 2]
        assert chunks[-1] == [5]

    def test_flatten(self):
        from backend.app.utils.helpers import flatten
        result = flatten([[1, 2], [3, 4], [5]])
        assert result == [1, 2, 3, 4, 5]

    def test_unique_by_key(self):
        from backend.app.utils.helpers import unique_by_key
        items = [{"id": 1, "name": "a"}, {"id": 1, "name": "b"}, {"id": 2, "name": "c"}]
        result = unique_by_key(items, "id")
        assert len(result) == 2

    def test_group_by(self):
        from backend.app.utils.helpers import group_by
        items = [
            {"type": "A", "val": 1},
            {"type": "B", "val": 2},
            {"type": "A", "val": 3},
        ]
        groups = group_by(items, "type")
        assert len(groups["A"]) == 2
        assert len(groups["B"]) == 1

    def test_deep_merge(self):
        from backend.app.utils.helpers import deep_merge
        base = {"a": 1, "b": {"c": 2, "d": 3}}
        override = {"b": {"c": 99, "e": 4}, "f": 5}
        result = deep_merge(base, override)
        assert result["a"] == 1
        assert result["b"]["c"] == 99
        assert result["b"]["d"] == 3
        assert result["b"]["e"] == 4
        assert result["f"] == 5


class TestStatisticsUtilities:
    """Test statistics functions"""

    def test_calculate_statistics(self):
        from backend.app.utils.helpers import calculate_statistics
        stats = calculate_statistics([1, 2, 3, 4, 5])
        assert stats["count"] == 5
        assert stats["mean"] == 3.0
        assert stats["median"] == 3.0
        assert stats["min"] == 1.0
        assert stats["max"] == 5.0

    def test_calculate_statistics_empty(self):
        from backend.app.utils.helpers import calculate_statistics
        stats = calculate_statistics([])
        assert stats["count"] == 0

    def test_percentile(self):
        from backend.app.utils.helpers import percentile
        vals = list(range(1, 101))
        assert percentile(vals, 50) == 50.5
        assert percentile(vals, 0) == 1
        assert percentile(vals, 100) == 100


# ==================== Data Validators Tests ====================

class TestVitalSignsValidator:
    """Test vital signs validation"""

    def test_normal_heart_rate(self):
        from backend.app.utils.validators import validate_vital_sign, VitalSignType
        result = validate_vital_sign(VitalSignType.HEART_RATE, 72)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_critical_heart_rate(self):
        from backend.app.utils.validators import validate_vital_sign, VitalSignType
        result = validate_vital_sign(VitalSignType.HEART_RATE, 30)
        assert result.is_valid is False

    def test_warning_blood_pressure(self):
        from backend.app.utils.validators import validate_vital_sign, VitalSignType
        result = validate_vital_sign(VitalSignType.BLOOD_PRESSURE_SYSTOLIC, 135)
        assert len(result.warnings) > 0

    def test_normal_temperature(self):
        from backend.app.utils.validators import validate_vital_sign, VitalSignType
        result = validate_vital_sign(VitalSignType.TEMPERATURE, 98.6)
        assert result.is_valid is True

    def test_vitals_set_validation(self, sample_vital_signs):
        from backend.app.utils.validators import validate_vitals_set
        result = validate_vitals_set(sample_vital_signs)
        assert result.is_valid is True

    def test_vitals_set_invalid_bp(self):
        from backend.app.utils.validators import validate_vitals_set
        vitals = {"bp_systolic": 80, "bp_diastolic": 90}
        result = validate_vitals_set(vitals)
        assert len(result.errors) > 0


class TestLabResultsValidator:
    """Test lab results validation"""

    def test_normal_lab_result(self):
        from backend.app.utils.validators import validate_lab_result
        result = validate_lab_result("hemoglobin", 15.0, "male")
        assert result.is_valid is True

    def test_critical_low_lab_result(self):
        from backend.app.utils.validators import validate_lab_result
        result = validate_lab_result("hemoglobin", 5.0, "male")
        assert result.is_valid is False

    def test_lab_panel_validation(self, sample_lab_results):
        from backend.app.utils.validators import validate_lab_panel
        result = validate_lab_panel("cbc", sample_lab_results, "male")
        assert result.is_valid is True

    def test_tumor_marker_validation(self):
        from backend.app.utils.validators import validate_lab_result
        result = validate_lab_result("psa", 2.5)
        assert result.is_valid is True

        result = validate_lab_result("psa", 12.0)
        assert len(result.warnings) > 0


class TestMedicationValidator:
    """Test medication validation"""

    def test_drug_interaction_check(self):
        from backend.app.utils.validators import check_drug_interactions
        result = check_drug_interactions(["warfarin", "aspirin"])
        assert result.is_valid is False

    def test_no_interactions(self):
        from backend.app.utils.validators import check_drug_interactions
        result = check_drug_interactions(["acetaminophen", "ibuprofen"])
        assert result.is_valid is True

    def test_dosage_validation(self):
        from backend.app.utils.validators import validate_dosage
        result = validate_dosage("ibuprofen", 400, "mg", "three_times_daily")
        assert result.is_valid is True

        result = validate_dosage("ibuprofen", -1, "mg", "once_daily")
        assert result.is_valid is False


class TestPatientDataValidator:
    """Test patient demographic validation"""

    def test_valid_patient(self, sample_patient):
        from backend.app.utils.validators import validate_patient_demographics
        result = validate_patient_demographics(sample_patient)
        assert result.is_valid is True

    def test_missing_required_fields(self):
        from backend.app.utils.validators import validate_patient_demographics
        result = validate_patient_demographics({})
        assert result.is_valid is False
        assert len(result.errors) >= 2

    def test_invalid_email(self):
        from backend.app.utils.validators import validate_patient_demographics
        result = validate_patient_demographics({
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1990-01-01",
            "email": "invalid-email",
        })
        assert any(e["field"] == "email" for e in result.errors)


class TestAppointmentValidator:
    """Test appointment validation"""

    def test_valid_appointment(self, sample_appointment):
        from backend.app.utils.validators import validate_appointment
        result = validate_appointment(sample_appointment)
        assert result.is_valid is True

    def test_missing_patient_id(self):
        from backend.app.utils.validators import validate_appointment
        result = validate_appointment({"doctor_id": "123"})
        assert result.is_valid is False


class TestMedicalImageValidator:
    """Test medical image validation"""

    def test_valid_dicom(self):
        from backend.app.utils.validators import validate_medical_image
        result = validate_medical_image("scan.dcm", 50 * 1024 * 1024, "CT")
        assert result.is_valid is True

    def test_invalid_extension(self):
        from backend.app.utils.validators import validate_medical_image
        result = validate_medical_image("file.exe", 1024)
        assert result.is_valid is False

    def test_oversized_file(self):
        from backend.app.utils.validators import validate_medical_image
        result = validate_medical_image("scan.dcm", 600 * 1024 * 1024)
        assert result.is_valid is False


# ==================== Security Utils Tests ====================

class TestSecurityUtils:
    """Test security utility functions"""

    def test_jwt_create_and_decode(self):
        from backend.app.utils.security_utils import JWTManager
        jwt = JWTManager(secret_key="test-secret")
        token = jwt.create_access_token("user123", "doctor")
        payload = jwt.decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user123"
        assert payload["role"] == "doctor"

    def test_jwt_expired_token(self):
        from backend.app.utils.security_utils import JWTManager
        jwt = JWTManager(secret_key="test-secret", access_token_ttl=0)
        token = jwt.create_access_token("user123", "doctor")
        import time
        time.sleep(1)
        payload = jwt.decode_token(token)
        assert payload is None

    def test_jwt_blacklist(self):
        from backend.app.utils.security_utils import JWTManager
        jwt = JWTManager(secret_key="test-secret")
        token = jwt.create_access_token("user123", "doctor")
        jwt.blacklist_token(token)
        payload = jwt.decode_token(token)
        assert payload is None

    def test_rbac_permissions(self):
        from backend.app.utils.security_utils import RBACManager, Role, Permission
        rbac = RBACManager()
        rbac.assign_role("doc1", Role.DOCTOR)

        assert rbac.has_permission("doc1", Permission.VIEW_PATIENTS)
        assert rbac.has_permission("doc1", Permission.CREATE_PRESCRIPTION)
        assert not rbac.has_permission("doc1", Permission.MANAGE_USERS)

    def test_rbac_multiple_roles(self):
        from backend.app.utils.security_utils import RBACManager, Role, Permission
        rbac = RBACManager()
        rbac.assign_role("admin1", Role.ADMIN)
        rbac.assign_role("admin1", Role.DOCTOR)

        assert rbac.has_permission("admin1", Permission.MANAGE_USERS)
        assert rbac.has_permission("admin1", Permission.CREATE_PRESCRIPTION)

    def test_password_policy(self):
        from backend.app.utils.security_utils import PasswordPolicy
        policy = PasswordPolicy()

        valid, issues = policy.validate("Str0ng!Password@123")
        assert valid is True

        valid, issues = policy.validate("weak")
        assert valid is False
        assert len(issues) > 0

    def test_input_sanitizer(self):
        from backend.app.utils.security_utils import InputSanitizer
        assert InputSanitizer.check_sql_injection("'; DROP TABLE users; --") is True
        assert InputSanitizer.check_sql_injection("normal text") is False

        assert InputSanitizer.check_xss("<script>alert('xss')</script>") is True
        assert InputSanitizer.check_xss("safe content") is False

    def test_data_masker(self):
        from backend.app.utils.security_utils import DataMasker
        masker = DataMasker()
        assert masker.mask_email("john@example.com") == "j**n@example.com"
        assert masker.mask_phone("+1234567890").endswith("7890")
        assert masker.mask_ssn("123-45-6789") == "***-**-6789"

    def test_rate_limiter(self):
        from backend.app.utils.security_utils import RateLimitTracker
        limiter = RateLimitTracker()
        for i in range(5):
            allowed, remaining = limiter.check_rate_limit("test_key", 5, 60)
            assert allowed is True
        allowed, remaining = limiter.check_rate_limit("test_key", 5, 60)
        assert allowed is False

    def test_security_audit_logger(self):
        from backend.app.utils.security_utils import SecurityAuditLogger
        logger = SecurityAuditLogger()
        logger.log_event("test_event", "user1", "127.0.0.1", {"action": "test"})
        events = logger.get_events(user_id="user1")
        assert len(events) == 1
        assert events[0]["event_type"] == "test_event"

    def test_account_lockout(self):
        from backend.app.utils.security_utils import SecurityAuditLogger
        logger = SecurityAuditLogger()
        logger.max_failed_attempts = 3
        for i in range(3):
            logger.log_login_attempt("user1", "127.0.0.1", False)
        assert logger.is_account_locked("user1") is True

    def test_csrf_protection(self):
        from backend.app.utils.security_utils import CSRFProtection
        csrf = CSRFProtection()
        token = csrf.generate_token("session1")
        assert csrf.validate_token("session1", token) is True
        # Single use - second validation should fail
        assert csrf.validate_token("session1", token) is False


# ==================== JSON Encoder Tests ====================

class TestJSONEncoder:
    """Test enhanced JSON encoder"""

    def test_datetime_encoding(self):
        from backend.app.utils.helpers import to_json
        data = {"created": datetime(2024, 1, 15, 10, 30)}
        result = to_json(data)
        assert "2024-01-15" in result

    def test_enum_encoding(self):
        from backend.app.utils.helpers import to_json
        from enum import Enum
        class Status(Enum):
            ACTIVE = "active"
        data = {"status": Status.ACTIVE}
        result = to_json(data)
        assert "active" in result

    def test_uuid_encoding(self):
        from backend.app.utils.helpers import to_json
        uid = uuid.uuid4()
        data = {"id": uid}
        result = to_json(data)
        assert str(uid) in result


# ==================== Export/CSV Tests ====================

class TestExportUtilities:
    """Test CSV export functions"""

    def test_dicts_to_csv(self):
        from backend.app.utils.helpers import dicts_to_csv
        data = [
            {"name": "John", "age": "30"},
            {"name": "Jane", "age": "25"},
        ]
        csv = dicts_to_csv(data)
        assert "name,age" in csv
        assert "John,30" in csv
        assert "Jane,25" in csv

    def test_dicts_to_csv_empty(self):
        from backend.app.utils.helpers import dicts_to_csv
        assert dicts_to_csv([]) == ""

    def test_csv_with_special_chars(self):
        from backend.app.utils.helpers import dicts_to_csv
        data = [{"name": 'John "Jr" Doe', "notes": "test,value"}]
        csv = dicts_to_csv(data)
        assert '"' in csv


# ==================== Run Configuration ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short", "-q"])
