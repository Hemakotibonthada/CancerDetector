#!/usr/bin/env python3
"""
CancerGuard AI - Load Testing Script
=====================================
Locust-based load testing for the CancerGuard AI platform.
Tests API endpoints under various load conditions.

Usage:
    locust -f scripts/load_test.py --host=http://localhost:8000
    locust -f scripts/load_test.py --host=http://localhost:8000 --headless -u 100 -r 10 -t 5m
"""

import json
import random
import string
import time
from datetime import datetime, timedelta

try:
    from locust import HttpUser, TaskSet, between, events, task
    from locust.runners import MasterRunner
except ImportError:
    print("Locust not installed. Install with: pip install locust")
    print("Run with: locust -f scripts/load_test.py --host=http://localhost:8000")
    raise SystemExit(1)


# =============================================================================
# Test Data Generators
# =============================================================================

def random_email():
    """Generate a random email address."""
    chars = string.ascii_lowercase + string.digits
    name = ''.join(random.choices(chars, k=8))
    domains = ['example.com', 'test.org', 'loadtest.dev']
    return f"{name}@{random.choice(domains)}"


def random_phone():
    """Generate a random phone number."""
    return f"+1{random.randint(2000000000, 9999999999)}"


def random_name():
    """Generate a random name."""
    first_names = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana',
                   'Edward', 'Fiona', 'George', 'Hannah', 'Ivan', 'Julia']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
                  'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    return random.choice(first_names), random.choice(last_names)


def random_date(start_year=1950, end_year=2000):
    """Generate a random date string."""
    year = random.randint(start_year, end_year)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{year}-{month:02d}-{day:02d}"


def random_blood_type():
    """Generate a random blood type."""
    return random.choice(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])


def random_vital_signs():
    """Generate random vital signs data."""
    return {
        "systolic_bp": random.randint(90, 180),
        "diastolic_bp": random.randint(60, 120),
        "heart_rate": random.randint(50, 120),
        "temperature": round(random.uniform(36.0, 39.0), 1),
        "respiratory_rate": random.randint(12, 25),
        "oxygen_saturation": random.randint(90, 100),
        "weight": round(random.uniform(45.0, 120.0), 1),
        "height": round(random.uniform(150.0, 200.0), 1),
    }


def random_appointment_data():
    """Generate random appointment request data."""
    now = datetime.now()
    appointment_date = now + timedelta(days=random.randint(1, 30))
    return {
        "doctor_id": random.randint(1, 20),
        "date": appointment_date.strftime("%Y-%m-%d"),
        "time": f"{random.randint(8, 17):02d}:{random.choice(['00', '15', '30', '45'])}",
        "type": random.choice(["consultation", "follow_up", "screening", "lab_test"]),
        "reason": random.choice([
            "Annual checkup",
            "Follow-up on test results",
            "New symptoms",
            "Cancer screening",
            "Medication review",
            "Lab work",
        ]),
        "notes": "Load test appointment",
    }


# =============================================================================
# Task Sets
# =============================================================================

class AuthBehavior(TaskSet):
    """Authentication-related tasks."""

    def on_start(self):
        """Register and login a test user."""
        self.email = random_email()
        self.password = "LoadTest123!@#"
        first, last = random_name()

        # Register
        self.client.post("/api/auth/register", json={
            "email": self.email,
            "password": self.password,
            "first_name": first,
            "last_name": last,
            "phone": random_phone(),
            "date_of_birth": random_date(),
        }, name="/api/auth/register")

        # Login
        response = self.client.post("/api/auth/login", json={
            "email": self.email,
            "password": self.password,
        }, name="/api/auth/login")

        if response.status_code == 200:
            try:
                data = response.json()
                self.token = data.get("access_token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
            except Exception:
                self.token = ""
                self.headers = {}
        else:
            self.token = ""
            self.headers = {}

    @task(3)
    def get_profile(self):
        """Get user profile."""
        self.client.get("/api/auth/me", headers=self.headers, name="/api/auth/me")

    @task(1)
    def refresh_token(self):
        """Refresh authentication token."""
        self.client.post("/api/auth/refresh", headers=self.headers,
                         name="/api/auth/refresh")

    @task(1)
    def update_profile(self):
        """Update user profile."""
        self.client.put("/api/auth/profile", headers=self.headers, json={
            "phone": random_phone(),
        }, name="/api/auth/profile")


class HealthRecordsBehavior(TaskSet):
    """Health records browsing tasks."""

    @task(5)
    def list_records(self):
        """List health records."""
        self.client.get("/api/health-records", headers=self.user.headers,
                        params={"page": random.randint(1, 5), "limit": 20},
                        name="/api/health-records")

    @task(3)
    def search_records(self):
        """Search health records."""
        terms = ["blood", "cancer", "screening", "biopsy", "lab", "mri", "ct"]
        self.client.get("/api/health-records/search",
                        headers=self.user.headers,
                        params={"q": random.choice(terms)},
                        name="/api/health-records/search")

    @task(2)
    def get_record_detail(self):
        """Get a specific health record."""
        record_id = random.randint(1, 100)
        self.client.get(f"/api/health-records/{record_id}",
                        headers=self.user.headers,
                        name="/api/health-records/[id]")

    @task(1)
    def create_vital_signs(self):
        """Submit vital signs."""
        self.client.post("/api/health-records/vitals",
                         headers=self.user.headers,
                         json=random_vital_signs(),
                         name="/api/health-records/vitals")


class AppointmentBehavior(TaskSet):
    """Appointment scheduling tasks."""

    @task(5)
    def list_appointments(self):
        """List upcoming appointments."""
        self.client.get("/api/appointments", headers=self.user.headers,
                        params={"status": "upcoming"},
                        name="/api/appointments")

    @task(3)
    def get_available_slots(self):
        """Check available appointment slots."""
        doctor_id = random.randint(1, 20)
        date = (datetime.now() + timedelta(days=random.randint(1, 14))).strftime("%Y-%m-%d")
        self.client.get(f"/api/appointments/slots",
                        headers=self.user.headers,
                        params={"doctor_id": doctor_id, "date": date},
                        name="/api/appointments/slots")

    @task(2)
    def book_appointment(self):
        """Book a new appointment."""
        self.client.post("/api/appointments", headers=self.user.headers,
                         json=random_appointment_data(),
                         name="/api/appointments [POST]")

    @task(1)
    def cancel_appointment(self):
        """Cancel an appointment."""
        apt_id = random.randint(1, 50)
        self.client.put(f"/api/appointments/{apt_id}/cancel",
                        headers=self.user.headers,
                        name="/api/appointments/[id]/cancel")


class CancerDetectionBehavior(TaskSet):
    """Cancer detection API tasks."""

    @task(3)
    def get_risk_assessment(self):
        """Request cancer risk assessment."""
        self.client.post("/api/cancer-detection/risk-assessment",
                         headers=self.user.headers,
                         json={
                             "age": random.randint(20, 80),
                             "gender": random.choice(["male", "female"]),
                             "smoking_history": random.choice([True, False]),
                             "family_history": random.choice([True, False]),
                             "bmi": round(random.uniform(18.0, 35.0), 1),
                             "exercise_frequency": random.choice(["none", "low", "moderate", "high"]),
                         },
                         name="/api/cancer-detection/risk-assessment")

    @task(2)
    def get_screening_schedule(self):
        """Get recommended screening schedule."""
        self.client.get("/api/cancer-detection/screening-schedule",
                        headers=self.user.headers,
                        name="/api/cancer-detection/screening-schedule")

    @task(2)
    def analyze_biomarkers(self):
        """Analyze biomarker data."""
        self.client.post("/api/cancer-detection/analyze-biomarkers",
                         headers=self.user.headers,
                         json={
                             "psa": round(random.uniform(0.5, 10.0), 2),
                             "cea": round(random.uniform(0.0, 5.0), 2),
                             "ca125": round(random.uniform(0.0, 35.0), 1),
                             "afp": round(random.uniform(0.0, 10.0), 1),
                             "white_blood_cells": round(random.uniform(3.5, 12.0), 1),
                             "hemoglobin": round(random.uniform(10.0, 18.0), 1),
                         },
                         name="/api/cancer-detection/analyze-biomarkers")

    @task(1)
    def get_detection_history(self):
        """Get detection history."""
        self.client.get("/api/cancer-detection/history",
                        headers=self.user.headers,
                        name="/api/cancer-detection/history")


class AnalyticsBehavior(TaskSet):
    """Analytics dashboard tasks."""

    @task(5)
    def dashboard_stats(self):
        """Get dashboard statistics."""
        self.client.get("/api/analytics/dashboard",
                        headers=self.user.headers,
                        name="/api/analytics/dashboard")

    @task(3)
    def health_trends(self):
        """Get health trends data."""
        self.client.get("/api/analytics/trends",
                        headers=self.user.headers,
                        params={
                            "period": random.choice(["7d", "30d", "90d", "1y"]),
                            "metric": random.choice(["blood_pressure", "weight", "heart_rate"]),
                        },
                        name="/api/analytics/trends")

    @task(2)
    def population_stats(self):
        """Get population statistics."""
        self.client.get("/api/analytics/population",
                        headers=self.user.headers,
                        name="/api/analytics/population")


class NotificationBehavior(TaskSet):
    """Notification tasks."""

    @task(5)
    def list_notifications(self):
        """List notifications."""
        self.client.get("/api/notifications",
                        headers=self.user.headers,
                        params={"unread": True},
                        name="/api/notifications")

    @task(2)
    def mark_read(self):
        """Mark notification as read."""
        notif_id = random.randint(1, 100)
        self.client.put(f"/api/notifications/{notif_id}/read",
                        headers=self.user.headers,
                        name="/api/notifications/[id]/read")

    @task(1)
    def notification_preferences(self):
        """Get notification preferences."""
        self.client.get("/api/notifications/preferences",
                        headers=self.user.headers,
                        name="/api/notifications/preferences")


# =============================================================================
# User Types
# =============================================================================

class PatientUser(HttpUser):
    """Simulates a typical patient browsing the platform."""
    weight = 5  # Most users are patients
    wait_time = between(2, 8)

    def on_start(self):
        """Login before starting tasks."""
        self.email = random_email()
        self.password = "LoadTest123!@#"
        first, last = random_name()

        self.client.post("/api/auth/register", json={
            "email": self.email,
            "password": self.password,
            "first_name": first,
            "last_name": last,
            "role": "patient",
        }, name="/api/auth/register [patient]")

        response = self.client.post("/api/auth/login", json={
            "email": self.email,
            "password": self.password,
        }, name="/api/auth/login [patient]")

        self.token = ""
        self.headers = {}
        if response.status_code == 200:
            try:
                data = response.json()
                self.token = data.get("access_token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
            except Exception:
                pass

    @task(10)
    def browse_dashboard(self):
        """Patient browses their dashboard."""
        self.client.get("/api/analytics/dashboard", headers=self.headers,
                        name="/api/analytics/dashboard")
        self.client.get("/api/notifications", headers=self.headers,
                        params={"unread": True, "limit": 5},
                        name="/api/notifications [dash]")

    @task(8)
    def view_health_records(self):
        """Patient views their health records."""
        self.client.get("/api/health-records", headers=self.headers,
                        name="/api/health-records [patient]")

    @task(5)
    def check_appointments(self):
        """Patient checks their appointments."""
        self.client.get("/api/appointments", headers=self.headers,
                        params={"status": "upcoming"},
                        name="/api/appointments [patient]")

    @task(3)
    def risk_assessment(self):
        """Patient checks cancer risk."""
        self.client.post("/api/cancer-detection/risk-assessment",
                         headers=self.headers,
                         json={
                             "age": random.randint(30, 70),
                             "gender": random.choice(["male", "female"]),
                             "smoking_history": random.choice([True, False]),
                             "family_history": random.choice([True, False]),
                         },
                         name="/api/cancer-detection/risk-assessment [patient]")

    @task(2)
    def view_medications(self):
        """Patient views their medications."""
        self.client.get("/api/prescriptions", headers=self.headers,
                        name="/api/prescriptions [patient]")

    @task(1)
    def submit_vitals(self):
        """Patient submits vital signs."""
        self.client.post("/api/health-records/vitals",
                         headers=self.headers,
                         json=random_vital_signs(),
                         name="/api/health-records/vitals [patient]")


class DoctorUser(HttpUser):
    """Simulates a doctor using the platform."""
    weight = 2  # Fewer doctors than patients
    wait_time = between(1, 5)

    def on_start(self):
        """Login as a doctor."""
        self.email = random_email()
        self.password = "DoctorTest123!@#"
        first, last = random_name()

        self.client.post("/api/auth/register", json={
            "email": self.email,
            "password": self.password,
            "first_name": f"Dr. {first}",
            "last_name": last,
            "role": "doctor",
        }, name="/api/auth/register [doctor]")

        response = self.client.post("/api/auth/login", json={
            "email": self.email,
            "password": self.password,
        }, name="/api/auth/login [doctor]")

        self.token = ""
        self.headers = {}
        if response.status_code == 200:
            try:
                data = response.json()
                self.token = data.get("access_token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
            except Exception:
                pass

    @task(8)
    def view_patient_list(self):
        """Doctor views patient list."""
        self.client.get("/api/patients", headers=self.headers,
                        params={"page": 1, "limit": 25},
                        name="/api/patients [doctor]")

    @task(6)
    def view_appointments(self):
        """Doctor views scheduled appointments."""
        self.client.get("/api/appointments", headers=self.headers,
                        params={"status": "scheduled"},
                        name="/api/appointments [doctor]")

    @task(5)
    def view_patient_record(self):
        """Doctor views a patient record."""
        patient_id = random.randint(1, 100)
        self.client.get(f"/api/patients/{patient_id}/records",
                        headers=self.headers,
                        name="/api/patients/[id]/records [doctor]")

    @task(4)
    def review_lab_results(self):
        """Doctor reviews lab results."""
        self.client.get("/api/pathology/results", headers=self.headers,
                        params={"status": "pending_review"},
                        name="/api/pathology/results [doctor]")

    @task(3)
    def cancer_detection_results(self):
        """Doctor reviews cancer detection results."""
        self.client.get("/api/cancer-detection/results", headers=self.headers,
                        name="/api/cancer-detection/results [doctor]")

    @task(2)
    def clinical_decision_support(self):
        """Doctor uses clinical decision support."""
        self.client.post("/api/clinical-decision/analyze",
                         headers=self.headers,
                         json={
                             "patient_id": random.randint(1, 100),
                             "symptoms": random.sample(
                                 ["fatigue", "weight_loss", "pain", "fever",
                                  "cough", "nausea", "headache", "bleeding"],
                                 k=random.randint(1, 4)
                             ),
                         },
                         name="/api/clinical-decision/analyze [doctor]")

    @task(1)
    def view_analytics(self):
        """Doctor views analytics dashboard."""
        self.client.get("/api/analytics/dashboard", headers=self.headers,
                        name="/api/analytics/dashboard [doctor]")


class AdminUser(HttpUser):
    """Simulates an admin managing the platform."""
    weight = 1  # Fewest admins
    wait_time = between(3, 10)

    def on_start(self):
        """Login as admin."""
        self.email = random_email()
        self.password = "AdminTest123!@#"

        self.client.post("/api/auth/register", json={
            "email": self.email,
            "password": self.password,
            "first_name": "Admin",
            "last_name": "User",
            "role": "admin",
        }, name="/api/auth/register [admin]")

        response = self.client.post("/api/auth/login", json={
            "email": self.email,
            "password": self.password,
        }, name="/api/auth/login [admin]")

        self.token = ""
        self.headers = {}
        if response.status_code == 200:
            try:
                data = response.json()
                self.token = data.get("access_token", "")
                self.headers = {"Authorization": f"Bearer {self.token}"}
            except Exception:
                pass

    @task(5)
    def admin_dashboard(self):
        """Admin views dashboard."""
        self.client.get("/api/admin/dashboard", headers=self.headers,
                        name="/api/admin/dashboard")

    @task(4)
    def view_users(self):
        """Admin views user list."""
        self.client.get("/api/admin/users", headers=self.headers,
                        params={"page": 1, "limit": 50},
                        name="/api/admin/users")

    @task(3)
    def system_health(self):
        """Admin checks system health."""
        self.client.get("/api/admin/system-health", headers=self.headers,
                        name="/api/admin/system-health")

    @task(3)
    def view_audit_logs(self):
        """Admin reviews audit logs."""
        self.client.get("/api/admin/audit-logs", headers=self.headers,
                        params={"page": 1, "limit": 50},
                        name="/api/admin/audit-logs")

    @task(2)
    def hospital_management(self):
        """Admin manages hospitals."""
        self.client.get("/api/hospitals", headers=self.headers,
                        name="/api/hospitals [admin]")

    @task(1)
    def compliance_report(self):
        """Admin views compliance report."""
        self.client.get("/api/admin/compliance", headers=self.headers,
                        name="/api/admin/compliance")


class APIHealthCheck(HttpUser):
    """Lightweight health check user - runs frequently."""
    weight = 1
    wait_time = between(5, 15)

    @task
    def health_check(self):
        """Check API health endpoint."""
        self.client.get("/api/health", name="/api/health")

    @task
    def openapi_schema(self):
        """Fetch OpenAPI schema."""
        self.client.get("/openapi.json", name="/openapi.json")


# =============================================================================
# Event Hooks
# =============================================================================

@events.init.add_listener
def on_locust_init(environment, **kwargs):
    """Log when test starts."""
    if isinstance(environment.runner, MasterRunner):
        print("=" * 60)
        print(" CancerGuard AI - Load Test Starting")
        print(f" Target: {environment.host}")
        print(f" Time: {datetime.now().isoformat()}")
        print("=" * 60)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Generate summary when test stops."""
    stats = environment.runner.stats
    print("\n" + "=" * 60)
    print(" Load Test Complete - Summary")
    print("=" * 60)
    print(f" Total requests:  {stats.total.num_requests}")
    print(f" Total failures:  {stats.total.num_failures}")
    print(f" Avg response:    {stats.total.avg_response_time:.0f}ms")
    print(f" Median response: {stats.total.median_response_time}ms")
    print(f" 95th percentile: {stats.total.get_response_time_percentile(0.95):.0f}ms")
    print(f" 99th percentile: {stats.total.get_response_time_percentile(0.99):.0f}ms")
    print(f" Requests/sec:    {stats.total.current_rps:.1f}")
    print(f" Failure rate:    {stats.total.fail_ratio * 100:.1f}%")
    print("=" * 60)

    # Performance thresholds
    p95 = stats.total.get_response_time_percentile(0.95)
    fail_rate = stats.total.fail_ratio

    if p95 > 2000:
        print(" ⚠ WARNING: P95 response time exceeds 2s threshold")
    if fail_rate > 0.05:
        print(" ⚠ WARNING: Failure rate exceeds 5% threshold")
    if p95 <= 2000 and fail_rate <= 0.05:
        print(" ✅ All performance thresholds met")
