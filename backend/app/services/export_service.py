"""
Export Service - Data export in multiple formats (CSV, JSON, Excel, PDF, FHIR Bundle)
for the CancerGuard AI healthcare platform.
"""

import csv
import io
import json
import logging
import os
import uuid
import zipfile
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


# ============================================================================
# Enums
# ============================================================================

class ExportFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"
    PDF = "pdf"
    FHIR_BUNDLE = "fhir_bundle"
    HL7 = "hl7"
    XML = "xml"
    HTML = "html"
    ZIP = "zip"


class ExportType(str, Enum):
    PATIENT_RECORDS = "patient_records"
    HEALTH_RECORDS = "health_records"
    LAB_RESULTS = "lab_results"
    APPOINTMENTS = "appointments"
    PRESCRIPTIONS = "prescriptions"
    VITAL_SIGNS = "vital_signs"
    CANCER_SCREENING = "cancer_screening"
    BILLING = "billing"
    CLINICAL_NOTES = "clinical_notes"
    WEARABLE_DATA = "wearable_data"
    GENOMIC_DATA = "genomic_data"
    AUDIT_LOG = "audit_log"
    ANALYTICS_REPORT = "analytics_report"
    POPULATION_HEALTH = "population_health"
    CLINICAL_TRIAL = "clinical_trial"
    FULL_PATIENT_EXPORT = "full_patient_export"
    COMPLIANCE_REPORT = "compliance_report"
    HOSPITAL_REPORT = "hospital_report"
    RESEARCH_DATA = "research_data"
    QUALITY_METRICS = "quality_metrics"


class ExportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class ExportRequest:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    export_type: ExportType = ExportType.PATIENT_RECORDS
    format: ExportFormat = ExportFormat.CSV
    requested_by: int = 0
    params: Dict[str, Any] = field(default_factory=dict)
    filters: Dict[str, Any] = field(default_factory=dict)
    columns: Optional[List[str]] = None
    sort_by: Optional[str] = None
    sort_order: str = "asc"
    include_headers: bool = True
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    status: ExportStatus = ExportStatus.PENDING
    filename: Optional[str] = None
    file_size: int = 0
    record_count: int = 0
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    download_url: Optional[str] = None
    expires_at: Optional[datetime] = None


@dataclass
class ExportColumn:
    name: str
    label: str
    data_type: str = "string"
    width: int = 15
    format_fn: Optional[str] = None
    visible: bool = True


# ============================================================================
# Column Definitions
# ============================================================================

class ExportColumnDefinitions:
    """Column definitions for each export type."""

    PATIENT_RECORDS = [
        ExportColumn("id", "Patient ID", "integer", 10),
        ExportColumn("mrn", "MRN", "string", 12),
        ExportColumn("first_name", "First Name", "string", 15),
        ExportColumn("last_name", "Last Name", "string", 15),
        ExportColumn("date_of_birth", "Date of Birth", "date", 12),
        ExportColumn("age", "Age", "integer", 5),
        ExportColumn("gender", "Gender", "string", 8),
        ExportColumn("blood_type", "Blood Type", "string", 8),
        ExportColumn("email", "Email", "string", 25),
        ExportColumn("phone", "Phone", "string", 15),
        ExportColumn("address", "Address", "string", 30),
        ExportColumn("city", "City", "string", 15),
        ExportColumn("state", "State", "string", 5),
        ExportColumn("zip_code", "ZIP Code", "string", 8),
        ExportColumn("insurance_provider", "Insurance", "string", 20),
        ExportColumn("insurance_id", "Insurance ID", "string", 15),
        ExportColumn("emergency_contact", "Emergency Contact", "string", 20),
        ExportColumn("emergency_phone", "Emergency Phone", "string", 15),
        ExportColumn("allergies", "Allergies", "string", 25),
        ExportColumn("created_at", "Registered Date", "datetime", 18),
    ]

    HEALTH_RECORDS = [
        ExportColumn("id", "Record ID", "integer", 10),
        ExportColumn("patient_id", "Patient ID", "integer", 10),
        ExportColumn("patient_name", "Patient Name", "string", 20),
        ExportColumn("record_type", "Type", "string", 15),
        ExportColumn("recorded_at", "Date", "datetime", 18),
        ExportColumn("recorded_by", "Recorded By", "string", 20),
        ExportColumn("diagnosis", "Diagnosis", "string", 30),
        ExportColumn("icd10_code", "ICD-10", "string", 10),
        ExportColumn("notes", "Notes", "string", 40),
        ExportColumn("attachments", "Attachments", "integer", 10),
    ]

    LAB_RESULTS = [
        ExportColumn("id", "Result ID", "integer", 10),
        ExportColumn("patient_id", "Patient ID", "integer", 10),
        ExportColumn("patient_name", "Patient Name", "string", 20),
        ExportColumn("order_id", "Order ID", "string", 12),
        ExportColumn("test_name", "Test Name", "string", 25),
        ExportColumn("test_code", "Test Code", "string", 10),
        ExportColumn("result_value", "Value", "string", 12),
        ExportColumn("unit", "Unit", "string", 8),
        ExportColumn("reference_range", "Ref Range", "string", 15),
        ExportColumn("flag", "Flag", "string", 8),
        ExportColumn("status", "Status", "string", 10),
        ExportColumn("collection_date", "Collected", "datetime", 18),
        ExportColumn("result_date", "Resulted", "datetime", 18),
        ExportColumn("lab_name", "Laboratory", "string", 20),
    ]

    APPOINTMENTS = [
        ExportColumn("id", "Appt ID", "integer", 10),
        ExportColumn("patient_id", "Patient ID", "integer", 10),
        ExportColumn("patient_name", "Patient Name", "string", 20),
        ExportColumn("provider_name", "Provider", "string", 20),
        ExportColumn("department", "Department", "string", 15),
        ExportColumn("appointment_type", "Type", "string", 15),
        ExportColumn("start_time", "Start", "datetime", 18),
        ExportColumn("end_time", "End", "datetime", 18),
        ExportColumn("duration_minutes", "Duration", "integer", 8),
        ExportColumn("status", "Status", "string", 12),
        ExportColumn("reason", "Reason", "string", 30),
        ExportColumn("location", "Location", "string", 15),
        ExportColumn("is_telehealth", "Telehealth", "boolean", 8),
    ]

    VITAL_SIGNS = [
        ExportColumn("id", "ID", "integer", 10),
        ExportColumn("patient_id", "Patient ID", "integer", 10),
        ExportColumn("patient_name", "Patient Name", "string", 20),
        ExportColumn("recorded_at", "Date/Time", "datetime", 18),
        ExportColumn("bp_systolic", "Systolic", "integer", 8),
        ExportColumn("bp_diastolic", "Diastolic", "integer", 8),
        ExportColumn("heart_rate", "Heart Rate", "integer", 10),
        ExportColumn("temperature", "Temp (°F)", "float", 10),
        ExportColumn("respiratory_rate", "Resp Rate", "integer", 10),
        ExportColumn("oxygen_saturation", "SpO2 (%)", "integer", 10),
        ExportColumn("weight_kg", "Weight (kg)", "float", 10),
        ExportColumn("height_cm", "Height (cm)", "float", 10),
        ExportColumn("bmi", "BMI", "float", 8),
        ExportColumn("pain_level", "Pain (0-10)", "integer", 10),
    ]

    CANCER_SCREENING = [
        ExportColumn("id", "ID", "integer", 10),
        ExportColumn("patient_id", "Patient ID", "integer", 10),
        ExportColumn("patient_name", "Patient Name", "string", 20),
        ExportColumn("cancer_type", "Cancer Type", "string", 15),
        ExportColumn("screening_type", "Screening Type", "string", 20),
        ExportColumn("screening_date", "Date", "datetime", 18),
        ExportColumn("result", "Result", "string", 12),
        ExportColumn("risk_score", "Risk Score", "float", 10),
        ExportColumn("risk_level", "Risk Level", "string", 10),
        ExportColumn("next_screening", "Next Screening", "date", 12),
        ExportColumn("performed_by", "Performed By", "string", 20),
        ExportColumn("facility", "Facility", "string", 20),
        ExportColumn("notes", "Notes", "string", 30),
    ]

    BILLING = [
        ExportColumn("id", "Invoice ID", "integer", 10),
        ExportColumn("patient_id", "Patient ID", "integer", 10),
        ExportColumn("patient_name", "Patient Name", "string", 20),
        ExportColumn("service_date", "Service Date", "date", 12),
        ExportColumn("service_code", "CPT Code", "string", 10),
        ExportColumn("service_description", "Description", "string", 25),
        ExportColumn("diagnosis_code", "ICD-10", "string", 10),
        ExportColumn("provider_name", "Provider", "string", 20),
        ExportColumn("total_amount", "Total", "currency", 12),
        ExportColumn("insurance_paid", "Insurance Paid", "currency", 12),
        ExportColumn("patient_responsibility", "Patient Due", "currency", 12),
        ExportColumn("payment_status", "Status", "string", 12),
        ExportColumn("insurance_provider", "Insurance", "string", 20),
        ExportColumn("claim_number", "Claim #", "string", 15),
    ]

    WEARABLE_DATA = [
        ExportColumn("id", "ID", "integer", 10),
        ExportColumn("patient_id", "Patient ID", "integer", 10),
        ExportColumn("device_type", "Device", "string", 15),
        ExportColumn("data_type", "Metric", "string", 15),
        ExportColumn("value", "Value", "float", 10),
        ExportColumn("unit", "Unit", "string", 8),
        ExportColumn("recorded_at", "Timestamp", "datetime", 18),
        ExportColumn("confidence", "Confidence", "float", 10),
        ExportColumn("context", "Context", "string", 15),
    ]

    @classmethod
    def get_columns(cls, export_type: ExportType) -> List[ExportColumn]:
        column_map = {
            ExportType.PATIENT_RECORDS: cls.PATIENT_RECORDS,
            ExportType.HEALTH_RECORDS: cls.HEALTH_RECORDS,
            ExportType.LAB_RESULTS: cls.LAB_RESULTS,
            ExportType.APPOINTMENTS: cls.APPOINTMENTS,
            ExportType.VITAL_SIGNS: cls.VITAL_SIGNS,
            ExportType.CANCER_SCREENING: cls.CANCER_SCREENING,
            ExportType.BILLING: cls.BILLING,
            ExportType.WEARABLE_DATA: cls.WEARABLE_DATA,
        }
        return column_map.get(export_type, cls.PATIENT_RECORDS)


# ============================================================================
# Data Generators (Sample Data for Export)
# ============================================================================

class ExportDataGenerator:
    """Generates sample data for exports."""

    @staticmethod
    def generate_patients(count: int = 50) -> List[Dict[str, Any]]:
        first_names = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa",
                       "William", "Maria", "James", "Anna", "Thomas", "Jennifer", "Daniel"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
                      "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson"]
        blood_types = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        genders = ["male", "female"]
        states = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI"]
        insurances = ["Blue Cross", "Aetna", "Cigna", "UnitedHealth", "Humana", "Kaiser"]

        patients = []
        for i in range(count):
            first = first_names[i % len(first_names)]
            last = last_names[i % len(last_names)]
            year = 1940 + (i * 7 % 60)
            month = (i % 12) + 1
            day = (i % 28) + 1
            patients.append({
                "id": i + 1,
                "mrn": f"MRN-{i + 1:06d}",
                "first_name": first,
                "last_name": last,
                "date_of_birth": f"{year}-{month:02d}-{day:02d}",
                "age": 2024 - year,
                "gender": genders[i % 2],
                "blood_type": blood_types[i % len(blood_types)],
                "email": f"{first.lower()}.{last.lower()}{i}@example.com",
                "phone": f"+1-555-{1000 + i:04d}",
                "address": f"{100 + i} Main St",
                "city": "Springfield",
                "state": states[i % len(states)],
                "zip_code": f"{60000 + i:05d}",
                "insurance_provider": insurances[i % len(insurances)],
                "insurance_id": f"INS-{uuid.uuid4().hex[:8].upper()}",
                "emergency_contact": f"{first_names[(i + 1) % len(first_names)]} {last}",
                "emergency_phone": f"+1-555-{2000 + i:04d}",
                "allergies": ["None", "Penicillin", "Aspirin", "Latex", "Peanuts"][i % 5],
                "created_at": (datetime.utcnow() - timedelta(days=i * 10)).isoformat(),
            })
        return patients

    @staticmethod
    def generate_lab_results(count: int = 100) -> List[Dict[str, Any]]:
        tests = [
            ("CBC", "57021-8", "Complete Blood Count"),
            ("BMP", "51990-0", "Basic Metabolic Panel"),
            ("CMP", "24323-8", "Comprehensive Metabolic Panel"),
            ("LFT", "24325-3", "Liver Function Tests"),
            ("TSH", "3016-3", "Thyroid Stimulating Hormone"),
            ("HbA1c", "4548-4", "Hemoglobin A1c"),
            ("PSA", "2857-1", "Prostate-Specific Antigen"),
            ("CEA", "2039-6", "Carcinoembryonic Antigen"),
            ("CA-125", "10334-1", "Cancer Antigen 125"),
            ("AFP", "1834-1", "Alpha-Fetoprotein"),
        ]

        results = []
        for i in range(count):
            test = tests[i % len(tests)]
            results.append({
                "id": i + 1,
                "patient_id": (i % 50) + 1,
                "patient_name": f"Patient {(i % 50) + 1}",
                "order_id": f"ORD-{i + 1:05d}",
                "test_name": test[2],
                "test_code": test[0],
                "loinc_code": test[1],
                "result_value": str(round(5 + (i * 3.7 % 200), 2)),
                "unit": ["mg/dL", "K/uL", "g/dL", "mEq/L"][i % 4],
                "reference_range": "4.5-11.0",
                "flag": ["N", "N", "N", "H", "L"][i % 5],
                "status": "final",
                "collection_date": (datetime.utcnow() - timedelta(days=i)).isoformat(),
                "result_date": (datetime.utcnow() - timedelta(days=i, hours=-4)).isoformat(),
                "lab_name": ["LabCorp", "Quest Diagnostics"][i % 2],
            })
        return results

    @staticmethod
    def generate_appointments(count: int = 80) -> List[Dict[str, Any]]:
        types = ["consultation", "follow_up", "screening", "procedure", "telehealth", "urgent_care"]
        departments = ["Oncology", "Radiology", "Surgery", "Internal Medicine", "Pathology"]
        providers = ["Dr. Smith", "Dr. Johnson", "Dr. Williams", "Dr. Chen", "Dr. Patel"]
        statuses = ["scheduled", "completed", "cancelled", "no_show"]

        appointments = []
        for i in range(count):
            appointments.append({
                "id": i + 1,
                "patient_id": (i % 50) + 1,
                "patient_name": f"Patient {(i % 50) + 1}",
                "provider_name": providers[i % len(providers)],
                "department": departments[i % len(departments)],
                "appointment_type": types[i % len(types)],
                "start_time": (datetime.utcnow() + timedelta(days=i - 40)).isoformat(),
                "end_time": (datetime.utcnow() + timedelta(days=i - 40, minutes=30)).isoformat(),
                "duration_minutes": [15, 30, 45, 60][i % 4],
                "status": statuses[i % len(statuses)],
                "reason": f"Follow-up for case #{i + 100}",
                "location": f"Room {200 + i % 20}",
                "is_telehealth": i % 5 == 0,
            })
        return appointments

    @staticmethod
    def generate_cancer_screenings(count: int = 60) -> List[Dict[str, Any]]:
        cancer_types = ["breast", "lung", "colon", "prostate", "cervical", "skin", "liver", "pancreatic"]
        screening_types = {
            "breast": "mammography", "lung": "low_dose_ct", "colon": "colonoscopy",
            "prostate": "psa_test", "cervical": "pap_smear", "skin": "dermoscopy",
            "liver": "ultrasound", "pancreatic": "eus",
        }
        results = ["normal", "normal", "normal", "abnormal", "indeterminate"]
        risk_levels = ["low", "low", "moderate", "moderate", "high"]

        screenings = []
        for i in range(count):
            cancer = cancer_types[i % len(cancer_types)]
            risk = round(0.01 + (i * 0.013 % 0.35), 3)
            screenings.append({
                "id": i + 1,
                "patient_id": (i % 50) + 1,
                "patient_name": f"Patient {(i % 50) + 1}",
                "cancer_type": cancer,
                "screening_type": screening_types[cancer],
                "screening_date": (datetime.utcnow() - timedelta(days=i * 5)).isoformat(),
                "result": results[i % len(results)],
                "risk_score": risk,
                "risk_level": risk_levels[i % len(risk_levels)],
                "next_screening": (datetime.utcnow() + timedelta(days=180 + i * 10)).strftime("%Y-%m-%d"),
                "performed_by": f"Dr. Specialist-{i % 5 + 1}",
                "facility": f"Imaging Center {i % 3 + 1}",
                "notes": f"Routine screening - {'Normal findings' if results[i % 5] == 'normal' else 'Requires follow-up'}",
            })
        return screenings


# ============================================================================
# Format Renderers
# ============================================================================

class CSVRenderer:
    """Renders data to CSV format."""

    @staticmethod
    def render(data: List[Dict[str, Any]], columns: List[ExportColumn],
               include_headers: bool = True) -> str:
        output = io.StringIO()
        visible_cols = [c for c in columns if c.visible]

        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        if include_headers:
            writer.writerow([c.label for c in visible_cols])

        for row in data:
            writer.writerow([row.get(c.name, "") for c in visible_cols])

        return output.getvalue()


class JSONRenderer:
    """Renders data to JSON format."""

    @staticmethod
    def render(data: List[Dict[str, Any]], columns: List[ExportColumn],
               export_type: str = "", metadata: Optional[Dict] = None) -> str:
        visible_cols = {c.name for c in columns if c.visible}
        filtered_data = [
            {k: v for k, v in row.items() if k in visible_cols}
            for row in data
        ]

        export_obj = {
            "metadata": {
                "export_type": export_type,
                "exported_at": datetime.utcnow().isoformat(),
                "record_count": len(filtered_data),
                "columns": [{"name": c.name, "label": c.label, "type": c.data_type}
                            for c in columns if c.visible],
                **(metadata or {}),
            },
            "data": filtered_data,
        }
        return json.dumps(export_obj, indent=2, default=str)


class HTMLRenderer:
    """Renders data to HTML table format."""

    @staticmethod
    def render(data: List[Dict[str, Any]], columns: List[ExportColumn],
               title: str = "Data Export") -> str:
        visible_cols = [c for c in columns if c.visible]

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} - CancerGuard AI</title>
<style>
body {{ font-family: 'Inter', -apple-system, sans-serif; margin: 20px; background: #f5f5f5; color: #333; }}
.header {{ background: linear-gradient(135deg, #1565c0, #00897b); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
.header h1 {{ margin: 0; font-size: 24px; }}
.header p {{ margin: 5px 0 0; opacity: 0.9; font-size: 14px; }}
.stats {{ display: flex; gap: 20px; margin-bottom: 20px; }}
.stat-card {{ background: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }}
.stat-card .label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
.stat-card .value {{ font-size: 24px; font-weight: 700; color: #1565c0; }}
table {{ width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }}
th {{ background: #1565c0; color: white; padding: 12px 15px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }}
td {{ padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-size: 14px; }}
tr:hover {{ background: #f5f8ff; }}
tr:nth-child(even) {{ background: #fafafa; }}
tr:nth-child(even):hover {{ background: #f0f4ff; }}
.flag-H {{ color: #d32f2f; font-weight: bold; }}
.flag-L {{ color: #f57c00; font-weight: bold; }}
.flag-N {{ color: #2e7d32; }}
.status-completed {{ color: #2e7d32; }}
.status-scheduled {{ color: #1565c0; }}
.status-cancelled {{ color: #d32f2f; }}
.footer {{ margin-top: 20px; padding: 15px; text-align: center; font-size: 12px; color: #999; }}
</style>
</head>
<body>
<div class="header">
<h1>📊 {title}</h1>
<p>Generated by CancerGuard AI • {datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")}</p>
</div>
<div class="stats">
<div class="stat-card"><div class="label">Total Records</div><div class="value">{len(data)}</div></div>
<div class="stat-card"><div class="label">Columns</div><div class="value">{len(visible_cols)}</div></div>
<div class="stat-card"><div class="label">Export Date</div><div class="value">{datetime.utcnow().strftime("%m/%d/%Y")}</div></div>
</div>
<table>
<thead><tr>"""
        for col in visible_cols:
            html += f"<th>{col.label}</th>"
        html += "</tr></thead>\n<tbody>\n"

        for row in data:
            html += "<tr>"
            for col in visible_cols:
                value = row.get(col.name, "")
                css_class = ""
                if col.name == "flag" and value:
                    css_class = f' class="flag-{value}"'
                elif col.name == "status" and value:
                    css_class = f' class="status-{value}"'
                html += f"<td{css_class}>{value}</td>"
            html += "</tr>\n"

        html += """</tbody>
</table>
<div class="footer">
CancerGuard AI &copy; 2024 • This export is confidential and intended for authorized personnel only.
</div>
</body>
</html>"""
        return html


class FHIRBundleRenderer:
    """Renders data as a FHIR Bundle."""

    @staticmethod
    def render(data: List[Dict[str, Any]], resource_type: str = "Patient") -> str:
        from backend.app.services.integration_service import FHIRResourceMapper
        mapper = FHIRResourceMapper()

        entries = []
        converter_map = {
            "Patient": mapper.to_patient,
            "Observation": mapper.to_observation,
            "Condition": mapper.to_condition,
            "MedicationRequest": mapper.to_medication_request,
            "DiagnosticReport": mapper.to_diagnostic_report,
            "Appointment": mapper.to_appointment,
        }

        converter = converter_map.get(resource_type)
        if converter:
            for item in data:
                try:
                    fhir_resource = converter(item)
                    entries.append({
                        "fullUrl": f"urn:uuid:{uuid.uuid4()}",
                        "resource": fhir_resource,
                        "request": {
                            "method": "POST",
                            "url": resource_type,
                        },
                    })
                except Exception as e:
                    logger.warning(f"Failed to convert item to FHIR: {e}")

        bundle = {
            "resourceType": "Bundle",
            "id": str(uuid.uuid4()),
            "meta": {"lastUpdated": datetime.utcnow().isoformat() + "Z"},
            "type": "collection",
            "total": len(entries),
            "entry": entries,
        }
        return json.dumps(bundle, indent=2, default=str)


class XMLRenderer:
    """Renders data to XML format."""

    @staticmethod
    def render(data: List[Dict[str, Any]], root_element: str = "export",
               item_element: str = "record") -> str:
        lines = ['<?xml version="1.0" encoding="UTF-8"?>']
        lines.append(f'<{root_element} xmlns="urn:cancerguard:export" '
                     f'exportDate="{datetime.utcnow().isoformat()}" '
                     f'recordCount="{len(data)}">')

        for item in data:
            lines.append(f"  <{item_element}>")
            for key, value in item.items():
                safe_value = str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                lines.append(f"    <{key}>{safe_value}</{key}>")
            lines.append(f"  </{item_element}>")

        lines.append(f"</{root_element}>")
        return "\n".join(lines)


# ============================================================================
# Export Service
# ============================================================================

class ExportService:
    """Main export service handling all data export operations."""

    def __init__(self):
        self._export_history: List[ExportRequest] = []
        self._max_history = 1000
        self._export_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))))), "exports")
        os.makedirs(self._export_dir, exist_ok=True)
        self._data_generator = ExportDataGenerator()
        self._stats = {
            "total_exports": 0,
            "by_format": defaultdict(int),
            "by_type": defaultdict(int),
            "total_records_exported": 0,
            "total_size_bytes": 0,
        }

    async def create_export(self, export_type: ExportType, format: ExportFormat,
                            user_id: int, params: Optional[Dict] = None,
                            filters: Optional[Dict] = None,
                            columns: Optional[List[str]] = None) -> Dict[str, Any]:
        """Create a new data export."""
        request = ExportRequest(
            export_type=export_type,
            format=format,
            requested_by=user_id,
            params=params or {},
            filters=filters or {},
            columns=columns,
        )
        request.status = ExportStatus.PROCESSING

        try:
            # Get data
            data = self._get_data(export_type, filters)

            # Filter columns if specified
            col_defs = ExportColumnDefinitions.get_columns(export_type)
            if columns:
                col_defs = [c for c in col_defs if c.name in columns]

            # Render in requested format
            content = self._render(data, col_defs, format, export_type)

            # Save to file
            ext = self._get_extension(format)
            filename = f"{export_type.value}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{ext}"
            filepath = os.path.join(self._export_dir, filename)

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)

            request.status = ExportStatus.COMPLETED
            request.filename = filename
            request.file_size = len(content.encode("utf-8"))
            request.record_count = len(data)
            request.completed_at = datetime.utcnow()
            request.expires_at = datetime.utcnow() + timedelta(days=7)
            request.download_url = f"/api/exports/download/{request.id}"

            self._stats["total_exports"] += 1
            self._stats["by_format"][format.value] += 1
            self._stats["by_type"][export_type.value] += 1
            self._stats["total_records_exported"] += len(data)
            self._stats["total_size_bytes"] += request.file_size

        except Exception as e:
            request.status = ExportStatus.FAILED
            request.error = str(e)
            request.completed_at = datetime.utcnow()
            logger.error(f"Export failed: {e}")

        self._export_history.append(request)
        if len(self._export_history) > self._max_history:
            self._export_history = self._export_history[-self._max_history:]

        return self._request_to_dict(request)

    def _get_data(self, export_type: ExportType, filters: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Get data for export."""
        generator_map = {
            ExportType.PATIENT_RECORDS: lambda: self._data_generator.generate_patients(50),
            ExportType.LAB_RESULTS: lambda: self._data_generator.generate_lab_results(100),
            ExportType.APPOINTMENTS: lambda: self._data_generator.generate_appointments(80),
            ExportType.CANCER_SCREENING: lambda: self._data_generator.generate_cancer_screenings(60),
        }

        generator = generator_map.get(export_type, lambda: self._data_generator.generate_patients(20))
        data = generator()

        # Apply filters
        if filters:
            if "patient_id" in filters:
                data = [d for d in data if d.get("patient_id") == filters["patient_id"]]
            if "status" in filters:
                data = [d for d in data if d.get("status") == filters["status"]]
            if "date_from" in filters:
                data = [d for d in data
                        if any(str(v) >= filters["date_from"] for k, v in d.items()
                               if "date" in k.lower() and v)]
            if "limit" in filters:
                data = data[:filters["limit"]]

        return data

    def _render(self, data: List[Dict[str, Any]], columns: List[ExportColumn],
                format: ExportFormat, export_type: ExportType) -> str:
        """Render data in the specified format."""
        if format == ExportFormat.CSV:
            return CSVRenderer.render(data, columns)
        elif format == ExportFormat.JSON:
            return JSONRenderer.render(data, columns, export_type.value)
        elif format == ExportFormat.HTML:
            title = export_type.value.replace("_", " ").title()
            return HTMLRenderer.render(data, columns, title)
        elif format == ExportFormat.XML:
            return XMLRenderer.render(data)
        elif format == ExportFormat.FHIR_BUNDLE:
            resource_map = {
                ExportType.PATIENT_RECORDS: "Patient",
                ExportType.LAB_RESULTS: "DiagnosticReport",
                ExportType.APPOINTMENTS: "Appointment",
            }
            return FHIRBundleRenderer.render(data, resource_map.get(export_type, "Patient"))
        else:
            return JSONRenderer.render(data, columns, export_type.value)

    @staticmethod
    def _get_extension(format: ExportFormat) -> str:
        extensions = {
            ExportFormat.CSV: "csv",
            ExportFormat.JSON: "json",
            ExportFormat.EXCEL: "xlsx",
            ExportFormat.PDF: "pdf",
            ExportFormat.HTML: "html",
            ExportFormat.XML: "xml",
            ExportFormat.FHIR_BUNDLE: "json",
            ExportFormat.HL7: "hl7",
            ExportFormat.ZIP: "zip",
        }
        return extensions.get(format, "txt")

    def get_export(self, export_id: str) -> Optional[Dict[str, Any]]:
        """Get export request by ID."""
        for req in self._export_history:
            if req.id == export_id:
                return self._request_to_dict(req)
        return None

    def list_exports(self, user_id: Optional[int] = None,
                     status: Optional[ExportStatus] = None,
                     limit: int = 50) -> List[Dict[str, Any]]:
        """List export history."""
        history = self._export_history
        if user_id is not None:
            history = [h for h in history if h.requested_by == user_id]
        if status is not None:
            history = [h for h in history if h.status == status]
        return [self._request_to_dict(h) for h in history[-limit:]]

    def cancel_export(self, export_id: str) -> bool:
        """Cancel a pending export."""
        for req in self._export_history:
            if req.id == export_id and req.status in (ExportStatus.PENDING, ExportStatus.PROCESSING):
                req.status = ExportStatus.CANCELLED
                return True
        return False

    def cleanup_expired(self) -> int:
        """Remove expired export files."""
        now = datetime.utcnow()
        removed = 0
        for req in self._export_history:
            if req.expires_at and req.expires_at < now and req.filename:
                filepath = os.path.join(self._export_dir, req.filename)
                if os.path.exists(filepath):
                    os.remove(filepath)
                    removed += 1
                req.status = ExportStatus.EXPIRED
        return removed

    def get_available_export_types(self) -> List[Dict[str, Any]]:
        """Get all available export types with their details."""
        return [
            {
                "type": et.value,
                "name": et.value.replace("_", " ").title(),
                "formats": [f.value for f in ExportFormat],
                "columns": [
                    {"name": c.name, "label": c.label, "type": c.data_type}
                    for c in ExportColumnDefinitions.get_columns(et)
                ],
            }
            for et in ExportType
        ]

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_exports": self._stats["total_exports"],
            "by_format": dict(self._stats["by_format"]),
            "by_type": dict(self._stats["by_type"]),
            "total_records_exported": self._stats["total_records_exported"],
            "total_size_mb": round(self._stats["total_size_bytes"] / (1024 * 1024), 2),
            "pending_exports": sum(1 for e in self._export_history if e.status == ExportStatus.PROCESSING),
            "expired_exports": sum(1 for e in self._export_history if e.status == ExportStatus.EXPIRED),
        }

    @staticmethod
    def _request_to_dict(req: ExportRequest) -> Dict[str, Any]:
        return {
            "id": req.id,
            "export_type": req.export_type.value,
            "format": req.format.value,
            "requested_by": req.requested_by,
            "status": req.status.value,
            "filename": req.filename,
            "file_size": req.file_size,
            "record_count": req.record_count,
            "created_at": req.created_at.isoformat(),
            "completed_at": req.completed_at.isoformat() if req.completed_at else None,
            "expires_at": req.expires_at.isoformat() if req.expires_at else None,
            "download_url": req.download_url,
            "error": req.error,
        }


# Singleton instance
export_service = ExportService()
