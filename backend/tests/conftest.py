"""
Comprehensive test suite for the CancerGuard AI backend.
Includes fixtures, helpers, and shared test configuration.
"""

import asyncio
import hashlib
import json
import os
import sys
import uuid
from datetime import datetime, timedelta
from typing import Any, AsyncGenerator, Dict, Generator, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ============================================================================
# Test Configuration
# ============================================================================

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"
TEST_SECRET_KEY = "test-secret-key-for-unit-tests-only"
TEST_ALGORITHM = "HS256"
TEST_ACCESS_TOKEN_EXPIRE_MINUTES = 30


# ============================================================================
# Sample Test Data
# ============================================================================

class TestData:
    """Centralized test data factory."""

    @staticmethod
    def patient(overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = {
            "id": 1,
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "+1-555-0100",
            "date_of_birth": "1985-06-15",
            "gender": "male",
            "blood_type": "O+",
            "address_line1": "123 Main St",
            "city": "Springfield",
            "state": "IL",
            "zip_code": "62701",
            "emergency_contact_name": "Jane Doe",
            "emergency_contact_phone": "+1-555-0101",
            "insurance_provider": "Blue Cross",
            "insurance_id": "BC123456789",
        }
        if overrides:
            data.update(overrides)
        return data

    @staticmethod
    def user(overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = {
            "id": 1,
            "email": "admin@cancerguard.ai",
            "username": "admin",
            "full_name": "Admin User",
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow().isoformat(),
        }
        if overrides:
            data.update(overrides)
        return data

    @staticmethod
    def hospital(overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = {
            "id": 1,
            "name": "CancerGuard Medical Center",
            "address": "456 Hospital Blvd",
            "city": "Springfield",
            "state": "IL",
            "zip_code": "62702",
            "phone": "+1-555-0200",
            "email": "admin@cgmc.example.com",
            "bed_count": 250,
            "departments": ["oncology", "radiology", "pathology", "surgery"],
            "is_active": True,
        }
        if overrides:
            data.update(overrides)
        return data

    @staticmethod
    def appointment(overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = {
            "id": 1,
            "patient_id": 1,
            "provider_id": 1,
            "hospital_id": 1,
            "appointment_type": "consultation",
            "specialty": "oncology",
            "start_time": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "end_time": (datetime.utcnow() + timedelta(days=7, minutes=30)).isoformat(),
            "duration_minutes": 30,
            "status": "scheduled",
            "reason": "Follow-up consultation for treatment plan review",
            "notes": "",
        }
        if overrides:
            data.update(overrides)
        return data

    @staticmethod
    def health_record(overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = {
            "id": 1,
            "patient_id": 1,
            "record_type": "vital_signs",
            "recorded_at": datetime.utcnow().isoformat(),
            "recorded_by": 1,
            "data": {
                "blood_pressure_systolic": 120,
                "blood_pressure_diastolic": 80,
                "heart_rate": 72,
                "temperature": 98.6,
                "respiratory_rate": 16,
                "oxygen_saturation": 98,
                "weight_kg": 75.0,
                "height_cm": 175.0,
            },
        }
        if overrides:
            data.update(overrides)
        return data

    @staticmethod
    def lab_result(overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = {
            "id": 1,
            "patient_id": 1,
            "order_id": "ORD-001",
            "test_name": "Complete Blood Count",
            "test_code": "CBC",
            "loinc_code": "57021-8",
            "collection_date": datetime.utcnow().isoformat(),
            "result_date": datetime.utcnow().isoformat(),
            "status": "final",
            "results": [
                {"name": "WBC", "value": 7.5, "unit": "K/uL", "reference_range": "4.5-11.0", "flag": "N"},
                {"name": "RBC", "value": 4.8, "unit": "M/uL", "reference_range": "4.5-5.5", "flag": "N"},
                {"name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "reference_range": "13.5-17.5", "flag": "N"},
                {"name": "Hematocrit", "value": 43.0, "unit": "%", "reference_range": "38.8-50.0", "flag": "N"},
                {"name": "Platelets", "value": 250, "unit": "K/uL", "reference_range": "150-400", "flag": "N"},
            ],
        }
        if overrides:
            data.update(overrides)
        return data

    @staticmethod
    def cancer_screening(overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = {
            "id": 1,
            "patient_id": 1,
            "screening_type": "mammography",
            "cancer_type": "breast",
            "screening_date": datetime.utcnow().isoformat(),
            "result": "normal",
            "risk_score": 0.05,
            "risk_level": "low",
            "notes": "Normal bilateral mammogram. No suspicious findings.",
            "next_screening_date": (datetime.utcnow() + timedelta(days=365)).isoformat(),
            "performed_by": 1,
            "facility_id": 1,
        }
        if overrides:
            data.update(overrides)
        return data

    @staticmethod
    def prescription(overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = {
            "id": 1,
            "patient_id": 1,
            "prescriber_id": 1,
            "medication_name": "Tamoxifen",
            "rxnorm_code": "10324",
            "dosage": "20mg",
            "dose_value": 20,
            "dose_unit": "mg",
            "frequency": 1,
            "route": "oral",
            "dosage_instructions": "Take 20mg by mouth once daily",
            "start_date": datetime.utcnow().isoformat(),
            "end_date": (datetime.utcnow() + timedelta(days=1825)).isoformat(),
            "refills": 11,
            "quantity": 30,
            "status": "active",
        }
        if overrides:
            data.update(overrides)
        return data

    @staticmethod
    def smartwatch_data(overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = {
            "id": 1,
            "patient_id": 1,
            "device_type": "apple_watch",
            "device_model": "Apple Watch Series 9",
            "data_type": "heart_rate",
            "value": 72.0,
            "unit": "bpm",
            "recorded_at": datetime.utcnow().isoformat(),
            "metadata": {"confidence": 0.95, "motion_context": "resting"},
        }
        if overrides:
            data.update(overrides)
        return data

    @staticmethod
    def blood_sample(overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = {
            "id": 1,
            "patient_id": 1,
            "sample_id": f"BS-{uuid.uuid4().hex[:8].upper()}",
            "collected_at": datetime.utcnow().isoformat(),
            "collected_by": 1,
            "blood_type": "O+",
            "volume_ml": 10.0,
            "storage_temperature": -20.0,
            "status": "collected",
            "purpose": "cancer_marker_analysis",
        }
        if overrides:
            data.update(overrides)
        return data


# ============================================================================
# Test Utilities
# ============================================================================

class TestUtils:
    """Utility functions for tests."""

    @staticmethod
    def generate_jwt_token(user_id: int = 1, role: str = "admin",
                           expires_delta: timedelta = timedelta(hours=1)) -> str:
        """Generate a test JWT token."""
        import base64
        payload = {
            "sub": str(user_id),
            "role": role,
            "exp": int((datetime.utcnow() + expires_delta).timestamp()),
            "iat": int(datetime.utcnow().timestamp()),
        }
        header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
        body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        sig = hashlib.sha256(f"{header}.{body}.{TEST_SECRET_KEY}".encode()).hexdigest()[:43]
        return f"{header}.{body}.{sig}"

    @staticmethod
    def assert_pagination(response_data: Dict[str, Any], expected_total: int = None):
        """Assert pagination structure."""
        assert "items" in response_data or "data" in response_data
        assert "total" in response_data or "count" in response_data
        if expected_total is not None:
            total = response_data.get("total", response_data.get("count", 0))
            assert total == expected_total

    @staticmethod
    def assert_error_response(response_data: Dict[str, Any], expected_status: int = None):
        """Assert error response structure."""
        assert "detail" in response_data or "error" in response_data or "message" in response_data

    @staticmethod
    def assert_datetime_format(dt_string: str):
        """Assert that a string is in valid ISO datetime format."""
        try:
            datetime.fromisoformat(dt_string.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            pytest.fail(f"Invalid datetime format: {dt_string}")

    @staticmethod
    def create_multipart_file(filename: str = "test.jpg", content: bytes = b"fake image data",
                               content_type: str = "image/jpeg") -> Dict[str, Any]:
        """Create a file-like object for multipart upload testing."""
        from io import BytesIO
        file_obj = BytesIO(content)
        file_obj.name = filename
        return {"file": (filename, file_obj, content_type)}


# ============================================================================
# Service Tests
# ============================================================================

class TestEmailService:
    """Tests for the email service."""

    def setup_method(self):
        from backend.app.services.email_service import EmailService
        self.service = EmailService()

    def test_send_welcome_email(self):
        result = asyncio.get_event_loop().run_until_complete(
            self.service.send_welcome(
                to_email="newuser@example.com",
                to_name="New User",
                user_data={"login_url": "https://cancerguard.ai/login"},
            )
        )
        assert result is not None

    def test_send_appointment_confirmation(self):
        result = asyncio.get_event_loop().run_until_complete(
            self.service.send_appointment_confirmation(
                to_email="patient@example.com",
                to_name="John Doe",
                appointment_data={
                    "appointment_type": "Consultation",
                    "provider_name": "Dr. Smith",
                    "date": "2024-02-15",
                    "time": "10:00 AM",
                    "location": "Room 301",
                    "duration": "30 minutes",
                },
            )
        )
        assert result is not None

    def test_email_rate_limiting(self):
        """Test that email rate limiting works correctly."""
        from backend.app.services.email_service import EmailRateLimiter, EmailPriority
        limiter = EmailRateLimiter()

        for _ in range(5):
            assert limiter.check_rate_limit(EmailPriority.NORMAL) is True

    def test_unsubscribe_management(self):
        """Test unsubscribe functionality."""
        from backend.app.services.email_service import UnsubscribeManager, EmailType
        manager = UnsubscribeManager()

        manager.unsubscribe("user@example.com", EmailType.MARKETING)
        assert manager.is_unsubscribed("user@example.com", EmailType.MARKETING) is True
        assert manager.is_unsubscribed("user@example.com", EmailType.WELCOME) is False

        manager.resubscribe("user@example.com", EmailType.MARKETING)
        assert manager.is_unsubscribed("user@example.com", EmailType.MARKETING) is False


class TestSchedulerService:
    """Tests for the scheduler service."""

    def setup_method(self):
        from backend.app.services.scheduler_service import SchedulerService
        self.service = SchedulerService()

    def test_schedule_job(self):
        job_id = self.service.schedule_job(
            name="test_job",
            handler_name="generate_daily_reports",
            cron_expression="0 0 * * *",
        )
        assert job_id is not None

    def test_cancel_job(self):
        job_id = self.service.schedule_job(
            name="cancel_test",
            handler_name="generate_daily_reports",
            cron_expression="0 0 * * *",
        )
        result = self.service.cancel_job(job_id)
        assert result is True

    def test_pause_resume_job(self):
        job_id = self.service.schedule_job(
            name="pause_test",
            handler_name="generate_daily_reports",
            cron_expression="0 0 * * *",
        )
        self.service.pause_job(job_id)
        self.service.resume_job(job_id)

    def test_list_jobs(self):
        self.service.schedule_job(
            name="list_test",
            handler_name="generate_daily_reports",
            cron_expression="0 0 * * *",
        )
        jobs = self.service.list_jobs()
        assert len(jobs) > 0

    def test_cron_expression_parsing(self):
        from backend.app.services.scheduler_service import CronExpression
        cron = CronExpression("30 14 * * 1-5")
        next_run = cron.next_occurrence()
        assert next_run is not None
        assert next_run > datetime.utcnow()

    def test_job_stats(self):
        stats = self.service.get_stats()
        assert "total_jobs" in stats
        assert "active_jobs" in stats


class TestSearchService:
    """Tests for the search service."""

    def setup_method(self):
        from backend.app.services.search_service import SearchService
        self.service = SearchService()

    def test_basic_search(self):
        result = asyncio.get_event_loop().run_until_complete(
            self.service.search("patient")
        )
        assert result is not None
        assert "results" in result
        assert "total" in result

    def test_search_with_filters(self):
        from backend.app.services.search_service import SearchFilter
        filters = SearchFilter(entity_types=["patient"])
        result = asyncio.get_event_loop().run_until_complete(
            self.service.search("test", filters=filters)
        )
        assert result is not None

    def test_add_and_search_document(self):
        self.service.add_to_index(
            entity_type="patient",
            entity_id="test-1",
            title="Test Patient Record",
            content="John Doe chemotherapy treatment breast cancer",
            tags=["oncology", "breast_cancer"],
        )
        result = asyncio.get_event_loop().run_until_complete(
            self.service.search("chemotherapy")
        )
        assert result["total"] > 0

    def test_remove_document(self):
        self.service.add_to_index("patient", "remove-test", "To Remove", "Content to remove")
        self.service.remove_from_index("remove-test")

    def test_search_suggestions(self):
        asyncio.get_event_loop().run_until_complete(self.service.search("cancer treatment"))
        suggestions = self.service.get_suggestions("can")
        assert isinstance(suggestions, list)

    def test_search_stats(self):
        stats = self.service.get_stats()
        assert "total_documents" in stats


class TestAnalyticsService:
    """Tests for the analytics service."""

    def setup_method(self):
        from backend.app.services.analytics_service import AnalyticsService
        self.service = AnalyticsService()

    def test_record_metric(self):
        self.service.metric_store.record("test_metric", 42.0, {"source": "test"})
        aggregated = self.service.metric_store.aggregate("test_metric")
        assert aggregated is not None
        assert aggregated.count == 1
        assert aggregated.mean == 42.0

    def test_cancer_detection_metrics(self):
        metrics = self.service.clinical_engine.calculate_cancer_detection_metrics()
        assert "screening_metrics" in metrics
        assert "ai_model_performance" in metrics

    def test_patient_outcomes(self):
        outcomes = self.service.clinical_engine.calculate_patient_outcomes()
        assert "survival_rates" in outcomes
        assert "patient_satisfaction" in outcomes

    def test_appointment_analytics(self):
        analytics = self.service.operational_engine.calculate_appointment_analytics()
        assert "appointments_today" in analytics

    def test_financial_analytics(self):
        analytics = self.service.operational_engine.calculate_financial_analytics()
        assert "revenue" in analytics

    def test_demographics(self):
        demographics = self.service.population_engine.calculate_demographics()
        assert "age_distribution" in demographics

    def test_admin_dashboard(self):
        dashboard = self.service.dashboard_builder.build_admin_dashboard()
        assert "summary" in dashboard
        assert "clinical" in dashboard

    def test_clinical_dashboard(self):
        dashboard = self.service.dashboard_builder.build_clinical_dashboard()
        assert "cancer_detection" in dashboard

    def test_patient_dashboard(self):
        dashboard = self.service.dashboard_builder.build_patient_dashboard(patient_id=1)
        assert "health_score" in dashboard


class TestIntegrationService:
    """Tests for the integration service."""

    def setup_method(self):
        from backend.app.services.integration_service import IntegrationService
        self.service = IntegrationService()

    def test_list_integrations(self):
        integrations = self.service.list_integrations()
        assert len(integrations) > 0

    def test_get_integration(self):
        integration = self.service.get_integration("epic")
        assert integration is not None
        assert integration["provider"] == "epic"

    def test_convert_patient_to_fhir(self):
        patient = TestData.patient()
        fhir = self.service.convert_to_fhir("Patient", patient)
        assert fhir["resourceType"] == "Patient"
        assert fhir["name"][0]["family"] == "Doe"
        assert fhir["gender"] == "male"

    def test_convert_observation_to_fhir(self):
        vital = {
            "id": 1,
            "patient_id": 1,
            "type": "heart_rate",
            "value": 72,
            "unit": "bpm",
            "recorded_at": datetime.utcnow().isoformat(),
        }
        fhir = self.service.convert_to_fhir("Observation", vital)
        assert fhir["resourceType"] == "Observation"
        assert fhir["code"]["coding"][0]["code"] == "8867-4"

    def test_convert_condition_to_fhir(self):
        diagnosis = {
            "id": 1,
            "patient_id": 1,
            "icd10_code": "C50.911",
            "description": "Malignant neoplasm of unspecified site of right female breast",
            "status": "active",
            "onset_date": "2024-01-15",
        }
        fhir = self.service.convert_to_fhir("Condition", diagnosis)
        assert fhir["resourceType"] == "Condition"

    def test_convert_medication_to_fhir(self):
        prescription = TestData.prescription()
        fhir = self.service.convert_to_fhir("MedicationRequest", prescription)
        assert fhir["resourceType"] == "MedicationRequest"

    def test_build_hl7_adt_message(self):
        patient = TestData.patient()
        hl7 = self.service.build_hl7_message("ADT_A01", patient)
        assert "MSH|" in hl7
        assert "PID|" in hl7
        assert "PV1|" in hl7

    def test_build_hl7_order_message(self):
        order = {"patient": TestData.patient(), "order_id": "ORD-001",
                 "test_code": "CBC", "test_name": "Complete Blood Count"}
        hl7 = self.service.build_hl7_message("ORM_O01", order)
        assert "MSH|" in hl7
        assert "ORC|" in hl7
        assert "OBR|" in hl7

    def test_build_hl7_result_message(self):
        result = {
            "patient": TestData.patient(),
            "order_id": "ORD-001",
            "test_code": "CBC",
            "test_name": "Complete Blood Count",
            "observations": [
                {"set_id": 1, "value_type": "NM", "code": "WBC", "name": "White Blood Cells",
                 "value": "7.5", "unit": "K/uL", "reference_range": "4.5-11.0", "abnormal_flag": ""},
            ],
        }
        hl7 = self.service.build_hl7_message("ORU_R01", result)
        assert "OBX|" in hl7

    def test_webhook_registration(self):
        result = asyncio.get_event_loop().run_until_complete(
            self.service.register_webhook(
                url="https://example.com/webhook",
                events=["patient.created", "appointment.scheduled"],
            )
        )
        assert "id" in result
        assert result["url"] == "https://example.com/webhook"

    def test_webhook_trigger(self):
        asyncio.get_event_loop().run_until_complete(
            self.service.register_webhook("https://example.com/wh", ["test.event"])
        )
        results = asyncio.get_event_loop().run_until_complete(
            self.service.trigger_webhook("test.event", {"data": "test"})
        )
        assert len(results) > 0
        assert results[0]["status"] == "delivered"

    def test_sync_provider(self):
        result = asyncio.get_event_loop().run_until_complete(
            self.service.sync_provider("epic")
        )
        assert result["success"] is True

    def test_sync_unknown_provider(self):
        result = asyncio.get_event_loop().run_until_complete(
            self.service.sync_provider("unknown")
        )
        assert result["success"] is False

    def test_sync_history(self):
        asyncio.get_event_loop().run_until_complete(self.service.sync_provider("epic"))
        history = self.service.get_sync_history()
        assert len(history) > 0

    def test_integration_stats(self):
        stats = self.service.get_stats()
        assert "total_integrations" in stats
        assert stats["total_integrations"] > 0


class TestUtilsPackage:
    """Tests for the backend utils package."""

    def setup_method(self):
        from backend.app.utils import (
            encryption, validation, formatting, medical,
            file_utils, id_generator, app_cache,
        )
        self.encryption = encryption
        self.validation = validation
        self.formatting = formatting
        self.medical = medical
        self.file_utils = file_utils
        self.id_generator = id_generator
        self.cache = app_cache

    def test_hash_and_verify_password(self):
        password = "SecureP@ssw0rd!"
        hashed = self.encryption.hash_password(password)
        assert self.encryption.verify_password(password, hashed) is True
        assert self.encryption.verify_password("wrong", hashed) is False

    def test_generate_token(self):
        token = self.encryption.generate_token(32)
        assert len(token) > 0

    def test_generate_otp(self):
        otp = self.encryption.generate_otp(6)
        assert len(otp) == 6
        assert otp.isdigit()

    def test_mask_email(self):
        masked = self.encryption.mask_email("john.doe@example.com")
        assert "@" in masked
        assert "***" in masked or "j" in masked

    def test_mask_phone(self):
        masked = self.encryption.mask_phone("+1-555-0100")
        assert "***" in masked

    def test_validate_email(self):
        assert self.validation.validate_email("user@example.com") is True
        assert self.validation.validate_email("invalid-email") is False

    def test_validate_phone(self):
        assert self.validation.validate_phone("+1-555-0100") is True

    def test_validate_password(self):
        valid, errors = self.validation.validate_password("SecureP@ss1")
        assert valid is True
        assert len(errors) == 0

        valid, errors = self.validation.validate_password("weak")
        assert valid is False
        assert len(errors) > 0

    def test_validate_date_range(self):
        valid = self.validation.validate_date_range("2024-01-01", "2024-12-31")
        assert valid is True

        valid = self.validation.validate_date_range("2024-12-31", "2024-01-01")
        assert valid is False

    def test_validate_blood_type(self):
        for bt in ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]:
            assert self.validation.validate_blood_type(bt) is True
        assert self.validation.validate_blood_type("X+") is False

    def test_sanitize_html(self):
        clean = self.validation.sanitize_html("<script>alert('xss')</script><p>Safe</p>")
        assert "<script>" not in clean

    def test_sanitize_filename(self):
        safe = self.validation.sanitize_filename("file../name<>.exe")
        assert ".." not in safe
        assert "<" not in safe

    def test_format_currency(self):
        assert self.formatting.format_currency(1234.56) == "$1,234.56"

    def test_format_percentage(self):
        assert "75" in self.formatting.format_percentage(0.75)

    def test_format_file_size(self):
        assert "KB" in self.formatting.format_file_size(1024)
        assert "MB" in self.formatting.format_file_size(1048576)

    def test_format_blood_pressure(self):
        result = self.formatting.format_blood_pressure(120, 80)
        assert "120/80" in result

    def test_calculate_bmi(self):
        bmi = self.medical.calculate_bmi(75, 175)
        assert 24 < bmi < 25

    def test_bmi_category(self):
        assert self.medical.bmi_category(22.0) == "Normal weight"
        assert self.medical.bmi_category(27.0) == "Overweight"
        assert self.medical.bmi_category(32.0) == "Obese"

    def test_calculate_bsa(self):
        bsa = self.medical.calculate_bsa(75, 175)
        assert 1.8 < bsa < 2.0

    def test_calculate_egfr(self):
        egfr = self.medical.calculate_egfr(1.0, 40, "male")
        assert egfr > 60

    def test_calculate_map(self):
        map_val = self.medical.calculate_map(120, 80)
        assert 90 < map_val < 100

    def test_classify_blood_pressure(self):
        assert self.medical.classify_blood_pressure(120, 80) == "Normal"
        assert "Hypertension" in self.medical.classify_blood_pressure(160, 100)

    def test_calculate_news2(self):
        score = self.medical.calculate_news2(
            respiratory_rate=18, oxygen_saturation=96,
            systolic_bp=120, heart_rate=75, consciousness="alert",
            temperature=37.0,
        )
        assert isinstance(score, int)

    def test_corrected_calcium(self):
        corrected = self.medical.corrected_calcium(9.0, 3.5)
        assert isinstance(corrected, float)

    def test_calculate_anion_gap(self):
        gap = self.medical.calculate_anion_gap(140, 100, 24)
        assert gap == 16

    def test_id_generator(self):
        uid = self.id_generator.uuid()
        assert len(uid) > 0

        short = self.id_generator.short_id()
        assert len(short) > 0

        mrn = self.id_generator.patient_mrn()
        assert mrn.startswith("MRN-")

    def test_cache(self):
        self.cache.put("test_key", "test_value", ttl=60)
        assert self.cache.get("test_key") == "test_value"

        self.cache.invalidate("test_key")
        assert self.cache.get("test_key") is None

    def test_validate_npi(self):
        assert self.validation.validate_npi("1234567893") is True
        assert self.validation.validate_npi("1234567890") is False


class TestNotificationService:
    """Tests for the notification service."""

    def setup_method(self):
        from backend.app.services.notification_service import NotificationService
        self.service = NotificationService()

    def test_create_notification(self):
        from backend.app.services.notification_service import NotificationType
        result = asyncio.get_event_loop().run_until_complete(
            self.service.send_notification(
                user_id=1,
                notification_type=NotificationType.APPOINTMENT_REMINDER,
                title="Appointment Tomorrow",
                message="You have an appointment with Dr. Smith tomorrow at 10:00 AM",
                data={"appointment_id": 1},
            )
        )
        assert result is not None

    def test_get_user_notifications(self):
        from backend.app.services.notification_service import NotificationType
        asyncio.get_event_loop().run_until_complete(
            self.service.send_notification(
                user_id=1,
                notification_type=NotificationType.SYSTEM_UPDATE,
                title="Test",
                message="Test notification",
            )
        )
        notifications = self.service.get_user_notifications(user_id=1)
        assert len(notifications) > 0

    def test_mark_as_read(self):
        from backend.app.services.notification_service import NotificationType
        asyncio.get_event_loop().run_until_complete(
            self.service.send_notification(
                user_id=1,
                notification_type=NotificationType.SYSTEM_UPDATE,
                title="Read Test",
                message="Notification to mark as read",
            )
        )
        notifications = self.service.get_user_notifications(user_id=1)
        if notifications:
            self.service.mark_as_read(notifications[0].get("id", ""))


class TestAuditService:
    """Tests for the audit service."""

    def setup_method(self):
        from backend.app.services.audit_service import AuditService
        self.service = AuditService()

    def test_log_action(self):
        from backend.app.services.audit_service import AuditAction
        asyncio.get_event_loop().run_until_complete(
            self.service.log(
                action=AuditAction.LOGIN_SUCCESS,
                user_id=1,
                details={"ip_address": "127.0.0.1"},
            )
        )

    def test_get_audit_logs(self):
        from backend.app.services.audit_service import AuditAction
        asyncio.get_event_loop().run_until_complete(
            self.service.log(action=AuditAction.VIEW_PATIENT, user_id=1)
        )
        logs = self.service.get_logs(user_id=1)
        assert len(logs) > 0

    def test_compliance_report(self):
        report = self.service.generate_compliance_report()
        assert report is not None


class TestReportService:
    """Tests for the report service."""

    def setup_method(self):
        from backend.app.services.report_service import ReportService
        self.service = ReportService()

    def test_generate_report(self):
        from backend.app.services.report_service import ReportType
        result = asyncio.get_event_loop().run_until_complete(
            self.service.generate_report(
                report_type=ReportType.PATIENT_SUMMARY,
                params={"patient_id": 1},
                user_id=1,
            )
        )
        assert result is not None


# ============================================================================
# Medical Utility Tests (Detailed)
# ============================================================================

class TestMedicalCalculations:
    """Detailed tests for medical calculations."""

    def setup_method(self):
        from backend.app.utils import medical
        self.medical = medical

    def test_bmi_underweight(self):
        bmi = self.medical.calculate_bmi(50, 175)
        assert self.medical.bmi_category(bmi) == "Underweight"

    def test_bmi_normal(self):
        bmi = self.medical.calculate_bmi(70, 175)
        assert self.medical.bmi_category(bmi) == "Normal weight"

    def test_bmi_overweight(self):
        bmi = self.medical.calculate_bmi(85, 175)
        assert self.medical.bmi_category(bmi) == "Overweight"

    def test_bmi_obese(self):
        bmi = self.medical.calculate_bmi(105, 175)
        assert self.medical.bmi_category(bmi) == "Obese"

    def test_egfr_normal(self):
        egfr = self.medical.calculate_egfr(0.9, 35, "female")
        assert egfr > 60

    def test_egfr_low(self):
        egfr = self.medical.calculate_egfr(3.0, 70, "male")
        assert egfr < 30

    def test_egfr_stages(self):
        assert "1" in self.medical.egfr_stage(100)
        assert "2" in self.medical.egfr_stage(75)
        assert "3" in self.medical.egfr_stage(45)
        assert "4" in self.medical.egfr_stage(20)
        assert "5" in self.medical.egfr_stage(10)

    def test_bp_classifications(self):
        assert self.medical.classify_blood_pressure(110, 70) == "Normal"
        assert self.medical.classify_blood_pressure(125, 82) == "Elevated"

    def test_map_calculation(self):
        map_val = self.medical.calculate_map(120, 80)
        expected = 80 + (120 - 80) / 3
        assert abs(map_val - expected) < 0.1

    def test_bsa_calculation(self):
        bsa = self.medical.calculate_bsa(70, 170)
        assert 1.7 < bsa < 1.9

    def test_news2_low_score(self):
        score = self.medical.calculate_news2(
            respiratory_rate=16, oxygen_saturation=97,
            systolic_bp=125, heart_rate=70,
            consciousness="alert", temperature=37.0,
        )
        assert score <= 4

    def test_news2_high_score(self):
        score = self.medical.calculate_news2(
            respiratory_rate=28, oxygen_saturation=90,
            systolic_bp=85, heart_rate=130,
            consciousness="pain", temperature=39.5,
        )
        assert score > 4

    def test_anion_gap_normal(self):
        gap = self.medical.calculate_anion_gap(140, 104, 24)
        assert 8 <= gap <= 16


# ============================================================================
# Middleware Tests
# ============================================================================

class TestMiddleware:
    """Tests for middleware components."""

    def test_rate_limit_middleware_import(self):
        from backend.app.middleware import RateLimitMiddleware
        assert RateLimitMiddleware is not None

    def test_security_headers_middleware_import(self):
        from backend.app.middleware import SecurityHeadersMiddleware
        assert SecurityHeadersMiddleware is not None

    def test_error_handling_middleware_import(self):
        from backend.app.middleware import ErrorHandlingMiddleware
        assert ErrorHandlingMiddleware is not None


# ============================================================================
# FHIR Mapping Tests
# ============================================================================

class TestFHIRMapping:
    """Tests for FHIR resource mapping."""

    def setup_method(self):
        from backend.app.services.integration_service import FHIRResourceMapper
        self.mapper = FHIRResourceMapper()

    def test_patient_to_fhir_and_back(self):
        patient = TestData.patient()
        fhir = self.mapper.to_patient(patient)

        assert fhir["resourceType"] == "Patient"
        assert fhir["name"][0]["family"] == "Doe"
        assert fhir["name"][0]["given"][0] == "John"
        assert fhir["gender"] == "male"
        assert fhir["birthDate"] == "1985-06-15"

        internal = self.mapper.from_patient(fhir)
        assert internal["first_name"] == "John"
        assert internal["last_name"] == "Doe"
        assert internal["gender"] == "male"

    def test_observation_to_fhir(self):
        vital_types = {
            "heart_rate": ("8867-4", 72, "bpm"),
            "blood_pressure_systolic": ("8480-6", 120, "mmHg"),
            "temperature": ("8310-5", 98.6, "°F"),
            "oxygen_saturation": ("2708-6", 98, "%"),
        }
        for vital_type, (expected_code, value, unit) in vital_types.items():
            vital = {"id": 1, "patient_id": 1, "type": vital_type, "value": value, "unit": unit}
            fhir = self.mapper.to_observation(vital)
            assert fhir["resourceType"] == "Observation"
            assert fhir["code"]["coding"][0]["code"] == expected_code

    def test_condition_to_fhir(self):
        diagnosis = {
            "id": 1, "patient_id": 1,
            "icd10_code": "C50.911",
            "description": "Breast cancer",
            "status": "active",
        }
        fhir = self.mapper.to_condition(diagnosis)
        assert fhir["resourceType"] == "Condition"
        assert fhir["code"]["coding"][0]["code"] == "C50.911"

    def test_medication_request_to_fhir(self):
        rx = TestData.prescription()
        fhir = self.mapper.to_medication_request(rx)
        assert fhir["resourceType"] == "MedicationRequest"
        assert fhir["status"] == "active"
        assert fhir["dosageInstruction"][0]["doseAndRate"][0]["doseQuantity"]["value"] == 20

    def test_diagnostic_report_to_fhir(self):
        lab = TestData.lab_result()
        fhir = self.mapper.to_diagnostic_report(lab)
        assert fhir["resourceType"] == "DiagnosticReport"
        assert fhir["status"] == "final"

    def test_appointment_to_fhir(self):
        appt = TestData.appointment()
        fhir = self.mapper.to_appointment(appt)
        assert fhir["resourceType"] == "Appointment"
        assert fhir["status"] == "scheduled"
        assert len(fhir["participant"]) == 2


# ============================================================================
# HL7 Message Tests
# ============================================================================

class TestHL7Messages:
    """Tests for HL7 v2 message building."""

    def setup_method(self):
        from backend.app.services.integration_service import HL7MessageBuilder
        self.builder = HL7MessageBuilder()

    def test_adt_a01_structure(self):
        patient = TestData.patient()
        msg = self.builder.build_adt_a01(patient)
        segments = msg.split("\r")
        segment_types = [s.split("|")[0] for s in segments]
        assert "MSH" in segment_types
        assert "EVN" in segment_types
        assert "PID" in segment_types
        assert "PV1" in segment_types

    def test_adt_a01_msh_content(self):
        msg = self.builder.build_adt_a01(TestData.patient())
        msh = msg.split("\r")[0]
        assert "CANCERGUARD" in msh
        assert "ADT^A01" in msh
        assert "2.5.1" in msh

    def test_orm_o01_structure(self):
        order = {
            "patient": TestData.patient(),
            "order_id": "ORD-001",
            "test_code": "CBC",
            "test_name": "Complete Blood Count",
        }
        msg = self.builder.build_orm_o01(order)
        segment_types = [s.split("|")[0] for s in msg.split("\r")]
        assert "ORC" in segment_types
        assert "OBR" in segment_types

    def test_oru_r01_with_observations(self):
        result = {
            "patient": TestData.patient(),
            "order_id": "ORD-001",
            "test_code": "CBC",
            "test_name": "Complete Blood Count",
            "observations": [
                {"set_id": 1, "value_type": "NM", "code": "WBC", "name": "WBC",
                 "value": "7.5", "unit": "K/uL", "reference_range": "4.5-11.0", "abnormal_flag": ""},
                {"set_id": 2, "value_type": "NM", "code": "RBC", "name": "RBC",
                 "value": "4.8", "unit": "M/uL", "reference_range": "4.5-5.5", "abnormal_flag": ""},
            ],
        }
        msg = self.builder.build_oru_r01(result)
        obx_count = sum(1 for s in msg.split("\r") if s.startswith("OBX|"))
        assert obx_count == 2

    def test_pid_segment_content(self):
        msg = self.builder.build_adt_a01(TestData.patient())
        pid = [s for s in msg.split("\r") if s.startswith("PID|")][0]
        assert "Doe" in pid
        assert "John" in pid


# ============================================================================
# Validation Edge Cases
# ============================================================================

class TestValidationEdgeCases:
    """Edge case tests for validation utilities."""

    def setup_method(self):
        from backend.app.utils import validation
        self.validation = validation

    def test_email_edge_cases(self):
        valid_emails = [
            "user@example.com",
            "user.name@example.com",
            "user+tag@example.com",
            "user@subdomain.example.com",
        ]
        invalid_emails = [
            "", "user", "user@", "@example.com",
            "user@.com", "user@example.", "user@exam ple.com",
        ]
        for email in valid_emails:
            assert self.validation.validate_email(email) is True, f"Expected valid: {email}"
        for email in invalid_emails:
            assert self.validation.validate_email(email) is False, f"Expected invalid: {email}"

    def test_password_strength(self):
        too_short = "Aa1!"
        no_upper = "password1!"
        no_lower = "PASSWORD1!"
        no_digit = "Password!!"
        no_special = "Password12"
        good = "SecureP@ss1"

        for pw in [too_short, no_upper, no_lower, no_digit, no_special]:
            valid, errors = self.validation.validate_password(pw)
            assert valid is False, f"Expected invalid: {pw}"

        valid, errors = self.validation.validate_password(good)
        assert valid is True

    def test_blood_type_validation(self):
        valid_types = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        invalid_types = ["C+", "AB", "+", "-", "", "OO+", "A++"]
        for bt in valid_types:
            assert self.validation.validate_blood_type(bt) is True
        for bt in invalid_types:
            assert self.validation.validate_blood_type(bt) is False

    def test_icd10_validation(self):
        valid_codes = ["C50.9", "C34.1", "I10", "E11.65"]
        for code in valid_codes:
            assert self.validation.validate_icd10(code) is True

    def test_mrn_validation(self):
        valid_mrns = ["MRN-000001", "MRN-999999"]
        for mrn in valid_mrns:
            assert self.validation.validate_mrn(mrn) is True


# ============================================================================
# Cache Tests
# ============================================================================

class TestCacheSystem:
    """Tests for the LRU cache system."""

    def setup_method(self):
        from backend.app.utils import LRUCache
        self.cache = LRUCache(max_size=100, default_ttl=60)

    def test_basic_put_get(self):
        self.cache.put("key1", "value1")
        assert self.cache.get("key1") == "value1"

    def test_cache_miss(self):
        assert self.cache.get("nonexistent") is None

    def test_cache_default(self):
        assert self.cache.get("nonexistent", "default") == "default"

    def test_cache_invalidation(self):
        self.cache.put("key", "value")
        self.cache.invalidate("key")
        assert self.cache.get("key") is None

    def test_cache_clear(self):
        self.cache.put("k1", "v1")
        self.cache.put("k2", "v2")
        self.cache.clear()
        assert self.cache.get("k1") is None
        assert self.cache.get("k2") is None

    def test_cache_stats(self):
        self.cache.get("miss")
        self.cache.put("hit", "value")
        self.cache.get("hit")
        stats = self.cache.get_stats()
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1

    def test_cache_max_size(self):
        small_cache = type(self.cache)(max_size=3, default_ttl=60)
        small_cache.put("a", 1)
        small_cache.put("b", 2)
        small_cache.put("c", 3)
        small_cache.put("d", 4)
        assert small_cache.get("a") is None  # Should be evicted


# ============================================================================
# Search Tokenizer Tests
# ============================================================================

class TestSearchTokenizer:
    """Tests for the search tokenizer."""

    def setup_method(self):
        from backend.app.services.search_service import Tokenizer
        self.tokenizer = Tokenizer()

    def test_basic_tokenization(self):
        tokens = self.tokenizer.tokenize("Hello World")
        assert "hello" in tokens
        assert "world" in tokens

    def test_stop_word_removal(self):
        tokens = self.tokenizer.tokenize("the quick brown fox jumps over the lazy dog")
        assert "the" not in tokens
        assert "quick" in tokens
        assert "fox" in tokens

    def test_medical_synonym_expansion(self):
        expanded = self.tokenizer.expand_query(["cancer"])
        assert "cancer" in expanded
        assert "malignancy" in expanded or "tumor" in expanded or "neoplasm" in expanded

    def test_normalization(self):
        normalized = self.tokenizer.normalize("Running  Tests!")
        assert normalized == "running tests!"

    def test_ngram_generation(self):
        ngrams = self.tokenizer.generate_ngrams(["breast", "cancer", "treatment"], n=2)
        assert "breast cancer" in ngrams


# ============================================================================
# Webhook Manager Tests
# ============================================================================

class TestWebhookManager:
    """Tests for the webhook manager."""

    def setup_method(self):
        from backend.app.services.integration_service import WebhookManager
        self.manager = WebhookManager()

    def test_register_webhook(self):
        wh = self.manager.register("https://example.com/wh", ["patient.created"])
        assert wh.url == "https://example.com/wh"
        assert "patient.created" in wh.events

    def test_unregister_webhook(self):
        wh = self.manager.register("https://example.com/wh", ["*"])
        assert self.manager.unregister(wh.id) is True
        assert self.manager.unregister("nonexistent") is False

    def test_trigger_webhook(self):
        self.manager.register("https://example.com/wh", ["test.event"])
        results = asyncio.get_event_loop().run_until_complete(
            self.manager.trigger("test.event", {"data": "test"})
        )
        assert len(results) == 1
        assert results[0]["status"] == "delivered"

    def test_trigger_no_match(self):
        self.manager.register("https://example.com/wh", ["other.event"])
        results = asyncio.get_event_loop().run_until_complete(
            self.manager.trigger("test.event", {"data": "test"})
        )
        assert len(results) == 0

    def test_trigger_wildcard(self):
        self.manager.register("https://example.com/wh", ["*"])
        results = asyncio.get_event_loop().run_until_complete(
            self.manager.trigger("any.event", {"data": "test"})
        )
        assert len(results) == 1

    def test_list_webhooks(self):
        self.manager.register("https://example.com/wh1", ["event1"])
        self.manager.register("https://example.com/wh2", ["event2"])
        webhooks = self.manager.list_webhooks()
        assert len(webhooks) == 2

    def test_delivery_log(self):
        self.manager.register("https://example.com/wh", ["test"])
        asyncio.get_event_loop().run_until_complete(
            self.manager.trigger("test", {"data": "test"})
        )
        log = self.manager.get_delivery_log()
        assert len(log) > 0


# ============================================================================
# Wearable Data Tests
# ============================================================================

class TestWearableConnector:
    """Tests for wearable device connectors."""

    def setup_method(self):
        from backend.app.services.integration_service import (
            WearableConnector, IntegrationProvider, IntegrationConfig,
        )
        self.connector = WearableConnector(
            IntegrationProvider.APPLE_HEALTH,
            IntegrationConfig(IntegrationProvider.APPLE_HEALTH, "Apple Health"),
        )

    def test_get_available_data_types(self):
        data_types = asyncio.get_event_loop().run_until_complete(
            self.connector.get_available_data_types()
        )
        assert "heart_rate" in data_types
        assert "steps" in data_types
        assert "sleep" in data_types

    def test_sync_health_data(self):
        result = asyncio.get_event_loop().run_until_complete(
            self.connector.sync_health_data(
                user_token="test_token",
                data_types=["heart_rate", "steps"],
                date_from="2024-01-01",
                date_to="2024-01-31",
            )
        )
        assert result["provider"] == "apple_health"
        assert "data_points" in result


# ============================================================================
# Run Configuration
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short", "-q"])
