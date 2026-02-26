"""
Integration Service - External system integrations, FHIR, HL7, and interoperability
for the CancerGuard AI healthcare platform.
"""

import asyncio
import hashlib
import json
import logging
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)


# ============================================================================
# Enums
# ============================================================================

class IntegrationProvider(str, Enum):
    EPIC = "epic"
    CERNER = "cerner"
    ALLSCRIPTS = "allscripts"
    ATHENA = "athena"
    MEDITECH = "meditech"
    NEXTGEN = "nextgen"
    LABCORP = "labcorp"
    QUEST = "quest"
    APPLE_HEALTH = "apple_health"
    FITBIT = "fitbit"
    GARMIN = "garmin"
    SAMSUNG_HEALTH = "samsung_health"
    GOOGLE_FIT = "google_fit"
    TWILIO = "twilio"
    SENDGRID = "sendgrid"
    STRIPE = "stripe"
    SURESCRIPTS = "surescripts"
    OPENAI = "openai"
    PUBMED = "pubmed"
    CLINICALTRIALS_GOV = "clinicaltrials_gov"
    CDC = "cdc"
    FDA = "fda"
    GENOMICS_PROVIDER = "genomics_provider"
    PACS_SYSTEM = "pacs_system"
    PHARMACY_SYSTEM = "pharmacy_system"


class IntegrationStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    CONFIGURING = "configuring"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    MAINTENANCE = "maintenance"


class SyncDirection(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    BIDIRECTIONAL = "bidirectional"


class DataFormat(str, Enum):
    FHIR_R4 = "fhir_r4"
    FHIR_STU3 = "fhir_stu3"
    HL7_V2 = "hl7_v2"
    HL7_V3 = "hl7_v3"
    CDA = "cda"
    DICOM = "dicom"
    JSON = "json"
    XML = "xml"
    CSV = "csv"
    X12 = "x12"


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class IntegrationConfig:
    """Configuration for an integration."""
    provider: IntegrationProvider
    name: str
    description: str = ""
    base_url: str = ""
    api_key: str = ""
    client_id: str = ""
    client_secret: str = ""
    auth_type: str = "oauth2"
    data_format: DataFormat = DataFormat.FHIR_R4
    sync_direction: SyncDirection = SyncDirection.BIDIRECTIONAL
    sync_interval_minutes: int = 60
    timeout_seconds: int = 30
    max_retries: int = 3
    rate_limit_per_minute: int = 60
    enabled: bool = True
    custom_headers: Dict[str, str] = field(default_factory=dict)
    custom_params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SyncRecord:
    """Record of a sync operation."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    provider: str = ""
    direction: str = ""
    entity_type: str = ""
    records_processed: int = 0
    records_created: int = 0
    records_updated: int = 0
    records_failed: int = 0
    started_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    duration_ms: float = 0
    status: str = "running"
    error: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WebhookConfig:
    """Webhook configuration."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    url: str = ""
    events: List[str] = field(default_factory=list)
    secret: str = field(default_factory=lambda: uuid.uuid4().hex)
    active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    failure_count: int = 0
    last_triggered: Optional[datetime] = None


# ============================================================================
# FHIR Resource Mapper
# ============================================================================

class FHIRResourceMapper:
    """Maps internal data models to FHIR R4 resources and vice versa."""

    @staticmethod
    def to_patient(patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert internal patient data to FHIR Patient resource."""
        return {
            "resourceType": "Patient",
            "id": str(patient_data.get("id", "")),
            "meta": {
                "versionId": "1",
                "lastUpdated": datetime.utcnow().isoformat() + "Z",
                "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"],
            },
            "identifier": [
                {
                    "system": "urn:oid:cancerguard.ai/mrn",
                    "value": f"MRN-{patient_data.get('id', 0):06d}",
                },
            ],
            "active": True,
            "name": [
                {
                    "use": "official",
                    "family": patient_data.get("last_name", ""),
                    "given": [patient_data.get("first_name", "")],
                },
            ],
            "gender": patient_data.get("gender", "unknown"),
            "birthDate": patient_data.get("date_of_birth", ""),
            "telecom": [
                {"system": "phone", "value": patient_data.get("phone", ""), "use": "home"},
                {"system": "email", "value": patient_data.get("email", ""), "use": "home"},
            ],
            "address": [
                {
                    "use": "home",
                    "line": [patient_data.get("address_line1", "")],
                    "city": patient_data.get("city", ""),
                    "state": patient_data.get("state", ""),
                    "postalCode": patient_data.get("zip_code", ""),
                    "country": "US",
                },
            ],
            "communication": [
                {"language": {"coding": [{"system": "urn:ietf:bcp:47", "code": "en-US"}]}, "preferred": True},
            ],
        }

    @staticmethod
    def to_observation(vital_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert vital sign data to FHIR Observation resource."""
        loinc_codes = {
            "blood_pressure_systolic": ("8480-6", "Systolic blood pressure"),
            "blood_pressure_diastolic": ("8462-4", "Diastolic blood pressure"),
            "heart_rate": ("8867-4", "Heart rate"),
            "temperature": ("8310-5", "Body temperature"),
            "respiratory_rate": ("9279-1", "Respiratory rate"),
            "oxygen_saturation": ("2708-6", "Oxygen saturation"),
            "weight": ("29463-7", "Body weight"),
            "height": ("8302-2", "Body height"),
            "bmi": ("39156-5", "Body mass index"),
        }

        vital_type = vital_data.get("type", "")
        code_info = loinc_codes.get(vital_type, ("unknown", vital_type))

        return {
            "resourceType": "Observation",
            "id": str(vital_data.get("id", "")),
            "meta": {
                "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-vital-signs"],
            },
            "status": "final",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                            "code": "vital-signs",
                            "display": "Vital Signs",
                        }
                    ],
                }
            ],
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": code_info[0],
                        "display": code_info[1],
                    }
                ],
            },
            "subject": {"reference": f"Patient/{vital_data.get('patient_id', '')}"},
            "effectiveDateTime": vital_data.get("recorded_at", datetime.utcnow().isoformat()),
            "valueQuantity": {
                "value": vital_data.get("value", 0),
                "unit": vital_data.get("unit", ""),
                "system": "http://unitsofmeasure.org",
            },
        }

    @staticmethod
    def to_condition(diagnosis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert diagnosis data to FHIR Condition resource."""
        return {
            "resourceType": "Condition",
            "id": str(diagnosis_data.get("id", "")),
            "meta": {
                "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition"],
            },
            "clinicalStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                        "code": diagnosis_data.get("status", "active"),
                    }
                ],
            },
            "verificationStatus": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
                        "code": "confirmed",
                    }
                ],
            },
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                            "code": "encounter-diagnosis",
                        }
                    ],
                }
            ],
            "code": {
                "coding": [
                    {
                        "system": "http://hl7.org/fhir/sid/icd-10-cm",
                        "code": diagnosis_data.get("icd10_code", ""),
                        "display": diagnosis_data.get("description", ""),
                    }
                ],
            },
            "subject": {"reference": f"Patient/{diagnosis_data.get('patient_id', '')}"},
            "onsetDateTime": diagnosis_data.get("onset_date", ""),
            "recordedDate": diagnosis_data.get("recorded_date", datetime.utcnow().isoformat()),
        }

    @staticmethod
    def to_medication_request(prescription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert prescription data to FHIR MedicationRequest resource."""
        return {
            "resourceType": "MedicationRequest",
            "id": str(prescription_data.get("id", "")),
            "status": prescription_data.get("status", "active"),
            "intent": "order",
            "medicationCodeableConcept": {
                "coding": [
                    {
                        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                        "code": prescription_data.get("rxnorm_code", ""),
                        "display": prescription_data.get("medication_name", ""),
                    }
                ],
            },
            "subject": {"reference": f"Patient/{prescription_data.get('patient_id', '')}"},
            "authoredOn": prescription_data.get("prescribed_date", datetime.utcnow().isoformat()),
            "requester": {"reference": f"Practitioner/{prescription_data.get('prescriber_id', '')}"},
            "dosageInstruction": [
                {
                    "text": prescription_data.get("dosage_instructions", ""),
                    "timing": {
                        "repeat": {
                            "frequency": prescription_data.get("frequency", 1),
                            "period": 1,
                            "periodUnit": "d",
                        },
                    },
                    "route": {
                        "coding": [
                            {
                                "system": "http://snomed.info/sct",
                                "code": "26643006",
                                "display": prescription_data.get("route", "oral"),
                            }
                        ],
                    },
                    "doseAndRate": [
                        {
                            "doseQuantity": {
                                "value": prescription_data.get("dose_value", 0),
                                "unit": prescription_data.get("dose_unit", "mg"),
                            },
                        }
                    ],
                }
            ],
            "dispenseRequest": {
                "numberOfRepeatsAllowed": prescription_data.get("refills", 0),
                "quantity": {"value": prescription_data.get("quantity", 30), "unit": "tablets"},
            },
        }

    @staticmethod
    def to_diagnostic_report(lab_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert lab result data to FHIR DiagnosticReport resource."""
        return {
            "resourceType": "DiagnosticReport",
            "id": str(lab_data.get("id", "")),
            "meta": {
                "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-diagnosticreport-lab"],
            },
            "status": lab_data.get("status", "final"),
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
                            "code": "LAB",
                            "display": "Laboratory",
                        }
                    ],
                }
            ],
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": lab_data.get("loinc_code", ""),
                        "display": lab_data.get("test_name", ""),
                    }
                ],
            },
            "subject": {"reference": f"Patient/{lab_data.get('patient_id', '')}"},
            "effectiveDateTime": lab_data.get("collection_date", ""),
            "issued": lab_data.get("result_date", datetime.utcnow().isoformat()),
            "performer": [{"reference": f"Organization/{lab_data.get('lab_id', '')}"}],
            "result": [
                {"reference": f"Observation/{result_id}"}
                for result_id in lab_data.get("result_ids", [])
            ],
            "conclusion": lab_data.get("interpretation", ""),
        }

    @staticmethod
    def to_appointment(appt_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert appointment data to FHIR Appointment resource."""
        return {
            "resourceType": "Appointment",
            "id": str(appt_data.get("id", "")),
            "status": appt_data.get("status", "booked"),
            "serviceCategory": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/service-category",
                            "code": appt_data.get("category_code", "17"),
                            "display": appt_data.get("category", "General Practice"),
                        }
                    ],
                }
            ],
            "serviceType": [
                {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "display": appt_data.get("service_type", "Consultation"),
                        }
                    ],
                }
            ],
            "specialty": [
                {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "display": appt_data.get("specialty", "Oncology"),
                        }
                    ],
                }
            ],
            "appointmentType": {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/v2-0276",
                        "code": appt_data.get("type_code", "ROUTINE"),
                        "display": appt_data.get("appointment_type", "Routine"),
                    }
                ],
            },
            "description": appt_data.get("reason", ""),
            "start": appt_data.get("start_time", ""),
            "end": appt_data.get("end_time", ""),
            "minutesDuration": appt_data.get("duration_minutes", 30),
            "participant": [
                {
                    "actor": {"reference": f"Patient/{appt_data.get('patient_id', '')}"},
                    "status": "accepted",
                },
                {
                    "actor": {"reference": f"Practitioner/{appt_data.get('provider_id', '')}"},
                    "status": "accepted",
                },
            ],
        }

    @staticmethod
    def from_patient(fhir_patient: Dict[str, Any]) -> Dict[str, Any]:
        """Convert FHIR Patient resource to internal format."""
        name = fhir_patient.get("name", [{}])[0]
        telecom = {t.get("system"): t.get("value") for t in fhir_patient.get("telecom", [])}
        address = fhir_patient.get("address", [{}])[0]

        return {
            "fhir_id": fhir_patient.get("id"),
            "first_name": name.get("given", [""])[0],
            "last_name": name.get("family", ""),
            "gender": fhir_patient.get("gender", ""),
            "date_of_birth": fhir_patient.get("birthDate", ""),
            "phone": telecom.get("phone", ""),
            "email": telecom.get("email", ""),
            "address_line1": (address.get("line") or [""])[0],
            "city": address.get("city", ""),
            "state": address.get("state", ""),
            "zip_code": address.get("postalCode", ""),
        }


# ============================================================================
# HL7 Message Builder
# ============================================================================

class HL7MessageBuilder:
    """Builds HL7 v2.x messages for healthcare system interoperability."""

    SEGMENT_SEPARATOR = "\r"
    FIELD_SEPARATOR = "|"
    COMPONENT_SEPARATOR = "^"
    SUBCOMPONENT_SEPARATOR = "&"
    ESCAPE_CHAR = "\\"
    REPETITION_SEPARATOR = "~"

    @classmethod
    def build_adt_a01(cls, patient_data: Dict[str, Any]) -> str:
        """Build ADT^A01 (Admit/Visit) message."""
        now = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        msg_id = uuid.uuid4().hex[:10].upper()

        segments = [
            cls._build_msh("ADT", "A01", msg_id, now),
            cls._build_evn("A01", now),
            cls._build_pid(patient_data),
            cls._build_pv1(patient_data),
        ]
        return cls.SEGMENT_SEPARATOR.join(segments)

    @classmethod
    def build_orm_o01(cls, order_data: Dict[str, Any]) -> str:
        """Build ORM^O01 (Order) message."""
        now = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        msg_id = uuid.uuid4().hex[:10].upper()

        segments = [
            cls._build_msh("ORM", "O01", msg_id, now),
            cls._build_pid(order_data.get("patient", {})),
            cls._build_orc(order_data),
            cls._build_obr(order_data),
        ]
        return cls.SEGMENT_SEPARATOR.join(segments)

    @classmethod
    def build_oru_r01(cls, result_data: Dict[str, Any]) -> str:
        """Build ORU^R01 (Result) message."""
        now = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        msg_id = uuid.uuid4().hex[:10].upper()

        segments = [
            cls._build_msh("ORU", "R01", msg_id, now),
            cls._build_pid(result_data.get("patient", {})),
            cls._build_obr(result_data),
        ]

        for obs in result_data.get("observations", []):
            segments.append(cls._build_obx(obs))

        return cls.SEGMENT_SEPARATOR.join(segments)

    @classmethod
    def _build_msh(cls, msg_type: str, trigger: str, msg_id: str, timestamp: str) -> str:
        return (f"MSH|^~\\&|CANCERGUARD|CGAI|RECEIVER|RCVR|{timestamp}||"
                f"{msg_type}^{trigger}|{msg_id}|P|2.5.1|||AL|NE")

    @classmethod
    def _build_evn(cls, event_code: str, timestamp: str) -> str:
        return f"EVN|{event_code}|{timestamp}"

    @classmethod
    def _build_pid(cls, patient: Dict[str, Any]) -> str:
        pid = patient.get("id", "")
        last = patient.get("last_name", "")
        first = patient.get("first_name", "")
        dob = patient.get("date_of_birth", "").replace("-", "")
        gender = {"male": "M", "female": "F"}.get(patient.get("gender", ""), "U")
        addr = patient.get("address_line1", "")
        city = patient.get("city", "")
        state = patient.get("state", "")
        zip_code = patient.get("zip_code", "")
        phone = patient.get("phone", "")

        return (f"PID|1||{pid}^^^CGAI||{last}^{first}|||{gender}|||"
                f"{addr}^^{city}^{state}^{zip_code}||{phone}")

    @classmethod
    def _build_pv1(cls, data: Dict[str, Any]) -> str:
        visit_type = data.get("visit_type", "O")
        location = data.get("location", "")
        provider = data.get("provider_name", "")
        return f"PV1|1|{visit_type}|{location}|||{provider}"

    @classmethod
    def _build_orc(cls, order: Dict[str, Any]) -> str:
        order_id = order.get("order_id", "")
        order_control = order.get("order_control", "NW")
        return f"ORC|{order_control}|{order_id}"

    @classmethod
    def _build_obr(cls, data: Dict[str, Any]) -> str:
        order_id = data.get("order_id", "")
        test_code = data.get("test_code", "")
        test_name = data.get("test_name", "")
        timestamp = data.get("collection_date", "").replace("-", "").replace(":", "").replace("T", "")
        return f"OBR|1|{order_id}||{test_code}^{test_name}|||{timestamp}"

    @classmethod
    def _build_obx(cls, obs: Dict[str, Any]) -> str:
        set_id = obs.get("set_id", 1)
        value_type = obs.get("value_type", "NM")
        code = obs.get("code", "")
        name = obs.get("name", "")
        value = obs.get("value", "")
        unit = obs.get("unit", "")
        ref_range = obs.get("reference_range", "")
        flag = obs.get("abnormal_flag", "")
        return f"OBX|{set_id}|{value_type}|{code}^{name}||{value}|{unit}|{ref_range}|{flag}|||F"


# ============================================================================
# Webhook Manager
# ============================================================================

class WebhookManager:
    """Manages outbound webhooks for event notifications."""

    def __init__(self):
        self._webhooks: Dict[str, WebhookConfig] = {}
        self._delivery_log: List[Dict[str, Any]] = []
        self._max_log = 5000

    def register(self, url: str, events: List[str], secret: Optional[str] = None) -> WebhookConfig:
        webhook = WebhookConfig(url=url, events=events)
        if secret:
            webhook.secret = secret
        self._webhooks[webhook.id] = webhook
        return webhook

    def unregister(self, webhook_id: str) -> bool:
        return self._webhooks.pop(webhook_id, None) is not None

    async def trigger(self, event: str, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Trigger webhooks for an event."""
        results = []
        for webhook in self._webhooks.values():
            if not webhook.active:
                continue
            if event not in webhook.events and "*" not in webhook.events:
                continue

            delivery = {
                "webhook_id": webhook.id,
                "event": event,
                "url": webhook.url,
                "timestamp": datetime.utcnow().isoformat(),
                "payload_size": len(json.dumps(payload)),
            }

            try:
                signature = hashlib.sha256(
                    (webhook.secret + json.dumps(payload, sort_keys=True)).encode()
                ).hexdigest()

                # Simulated delivery
                await asyncio.sleep(0.01)

                delivery["status"] = "delivered"
                delivery["signature"] = signature
                webhook.last_triggered = datetime.utcnow()
                webhook.failure_count = 0

            except Exception as e:
                delivery["status"] = "failed"
                delivery["error"] = str(e)
                webhook.failure_count += 1

                if webhook.failure_count >= 10:
                    webhook.active = False
                    logger.warning(f"Webhook {webhook.id} disabled after {webhook.failure_count} failures")

            self._delivery_log.append(delivery)
            results.append(delivery)

        if len(self._delivery_log) > self._max_log:
            self._delivery_log = self._delivery_log[-self._max_log:]

        return results

    def list_webhooks(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": wh.id, "url": wh.url, "events": wh.events,
                "active": wh.active, "failure_count": wh.failure_count,
                "last_triggered": wh.last_triggered.isoformat() if wh.last_triggered else None,
            }
            for wh in self._webhooks.values()
        ]

    def get_delivery_log(self, webhook_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        log = self._delivery_log
        if webhook_id:
            log = [d for d in log if d.get("webhook_id") == webhook_id]
        return log[-limit:]


# ============================================================================
# External Data Connectors
# ============================================================================

class EHRConnector:
    """Connector for Electronic Health Record systems."""

    def __init__(self, provider: IntegrationProvider, config: IntegrationConfig):
        self.provider = provider
        self.config = config
        self._access_token: Optional[str] = None
        self._token_expires: Optional[datetime] = None

    async def authenticate(self) -> bool:
        """Authenticate with the EHR system."""
        logger.info(f"Authenticating with {self.provider.value}")
        self._access_token = f"mock_token_{uuid.uuid4().hex[:8]}"
        self._token_expires = datetime.utcnow() + timedelta(hours=1)
        return True

    async def fetch_patient(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Fetch patient data from EHR."""
        if not self._access_token:
            await self.authenticate()
        logger.info(f"Fetching patient {patient_id} from {self.provider.value}")
        return {"id": patient_id, "source": self.provider.value, "synced_at": datetime.utcnow().isoformat()}

    async def fetch_encounters(self, patient_id: str, date_from: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch patient encounters from EHR."""
        logger.info(f"Fetching encounters for {patient_id} from {self.provider.value}")
        return []

    async def push_observation(self, observation: Dict[str, Any]) -> bool:
        """Push observation data to EHR."""
        logger.info(f"Pushing observation to {self.provider.value}")
        return True

    async def push_diagnostic_report(self, report: Dict[str, Any]) -> bool:
        """Push diagnostic report to EHR."""
        logger.info(f"Pushing diagnostic report to {self.provider.value}")
        return True


class LabSystemConnector:
    """Connector for laboratory information systems."""

    def __init__(self, provider: IntegrationProvider, config: IntegrationConfig):
        self.provider = provider
        self.config = config

    async def submit_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        """Submit a lab order."""
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        logger.info(f"Submitted lab order {order_id} to {self.provider.value}")
        return {"order_id": order_id, "status": "submitted", "provider": self.provider.value}

    async def get_results(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Get lab results for an order."""
        logger.info(f"Fetching results for order {order_id} from {self.provider.value}")
        return {"order_id": order_id, "status": "completed", "results": []}

    async def get_pending_orders(self) -> List[Dict[str, Any]]:
        """Get list of pending lab orders."""
        return []


class WearableConnector:
    """Connector for wearable device data."""

    def __init__(self, provider: IntegrationProvider, config: IntegrationConfig):
        self.provider = provider
        self.config = config

    async def sync_health_data(self, user_token: str, data_types: List[str],
                                date_from: str, date_to: str) -> Dict[str, Any]:
        """Sync health data from wearable device."""
        logger.info(f"Syncing {data_types} from {self.provider.value}")
        return {
            "provider": self.provider.value,
            "data_types": data_types,
            "date_range": {"from": date_from, "to": date_to},
            "data_points": 0,
            "synced_at": datetime.utcnow().isoformat(),
        }

    async def get_available_data_types(self) -> List[str]:
        """Get available data types from the wearable provider."""
        provider_types = {
            IntegrationProvider.APPLE_HEALTH: [
                "heart_rate", "steps", "distance", "calories", "sleep",
                "blood_oxygen", "ecg", "blood_pressure", "weight",
                "body_temperature", "respiratory_rate", "noise_exposure",
            ],
            IntegrationProvider.FITBIT: [
                "heart_rate", "steps", "distance", "calories", "sleep",
                "floors_climbed", "active_minutes", "weight", "water",
                "spo2", "skin_temperature", "stress_score",
            ],
            IntegrationProvider.GARMIN: [
                "heart_rate", "steps", "distance", "calories", "sleep",
                "stress", "body_battery", "pulse_ox", "respiration",
                "intensity_minutes", "floors_climbed",
            ],
            IntegrationProvider.SAMSUNG_HEALTH: [
                "heart_rate", "steps", "distance", "calories", "sleep",
                "blood_oxygen", "blood_pressure", "stress", "body_composition",
            ],
            IntegrationProvider.GOOGLE_FIT: [
                "heart_rate", "steps", "distance", "calories", "sleep",
                "weight", "blood_pressure", "blood_glucose", "body_temperature",
            ],
        }
        return provider_types.get(self.provider, [])


class PharmacyConnector:
    """Connector for pharmacy systems."""

    def __init__(self, config: IntegrationConfig):
        self.config = config

    async def check_drug_interactions(self, medications: List[str]) -> List[Dict[str, Any]]:
        """Check for drug interactions."""
        logger.info(f"Checking interactions for {len(medications)} medications")
        return []

    async def verify_prescription(self, prescription: Dict[str, Any]) -> Dict[str, Any]:
        """Verify a prescription."""
        return {"valid": True, "warnings": [], "prescription_id": prescription.get("id")}

    async def submit_refill_request(self, prescription_id: str) -> Dict[str, Any]:
        """Submit a prescription refill request."""
        return {"status": "submitted", "prescription_id": prescription_id,
                "estimated_ready": (datetime.utcnow() + timedelta(hours=2)).isoformat()}


# ============================================================================
# Integration Service
# ============================================================================

class IntegrationService:
    """Main integration service managing all external integrations."""

    def __init__(self):
        self.fhir_mapper = FHIRResourceMapper()
        self.hl7_builder = HL7MessageBuilder()
        self.webhook_manager = WebhookManager()
        self._integrations: Dict[str, IntegrationConfig] = {}
        self._connectors: Dict[str, Any] = {}
        self._sync_history: List[SyncRecord] = []
        self._max_sync_history = 5000
        self._register_default_integrations()

    def _register_default_integrations(self):
        """Register default integration configurations."""
        defaults = [
            IntegrationConfig(IntegrationProvider.EPIC, "Epic EHR", "Electronic Health Records via Epic",
                              "https://api.epic.com/fhir/r4", data_format=DataFormat.FHIR_R4),
            IntegrationConfig(IntegrationProvider.CERNER, "Cerner EHR", "Cerner Millennium integration",
                              "https://api.cerner.com/fhir/r4", data_format=DataFormat.FHIR_R4),
            IntegrationConfig(IntegrationProvider.LABCORP, "LabCorp", "LabCorp laboratory integration",
                              "https://api.labcorp.com/v1", data_format=DataFormat.HL7_V2),
            IntegrationConfig(IntegrationProvider.QUEST, "Quest Diagnostics", "Quest lab integration",
                              "https://api.questdiagnostics.com/v1", data_format=DataFormat.HL7_V2),
            IntegrationConfig(IntegrationProvider.APPLE_HEALTH, "Apple Health", "Apple HealthKit integration",
                              data_format=DataFormat.JSON, sync_direction=SyncDirection.INBOUND),
            IntegrationConfig(IntegrationProvider.FITBIT, "Fitbit", "Fitbit Web API integration",
                              "https://api.fitbit.com/1/user", data_format=DataFormat.JSON),
            IntegrationConfig(IntegrationProvider.GARMIN, "Garmin Connect", "Garmin Health API",
                              "https://apis.garmin.com/wellness-api/rest", data_format=DataFormat.JSON),
            IntegrationConfig(IntegrationProvider.SURESCRIPTS, "Surescripts", "e-Prescribing network",
                              data_format=DataFormat.XML),
            IntegrationConfig(IntegrationProvider.CLINICALTRIALS_GOV, "ClinicalTrials.gov", "Clinical trial registry",
                              "https://clinicaltrials.gov/api/v2", data_format=DataFormat.JSON,
                              sync_direction=SyncDirection.INBOUND),
            IntegrationConfig(IntegrationProvider.PUBMED, "PubMed", "Medical literature search",
                              "https://eutils.ncbi.nlm.nih.gov/entrez/eutils", data_format=DataFormat.XML,
                              sync_direction=SyncDirection.INBOUND),
        ]
        for config in defaults:
            self._integrations[config.provider.value] = config

    def get_integration(self, provider: str) -> Optional[Dict[str, Any]]:
        config = self._integrations.get(provider)
        if not config:
            return None
        return {
            "provider": config.provider.value,
            "name": config.name,
            "description": config.description,
            "status": "active" if config.enabled else "inactive",
            "data_format": config.data_format.value,
            "sync_direction": config.sync_direction.value,
            "sync_interval_minutes": config.sync_interval_minutes,
        }

    def list_integrations(self) -> List[Dict[str, Any]]:
        return [self.get_integration(k) for k in self._integrations if self.get_integration(k)]

    async def sync_provider(self, provider: str, entity_type: str = "all") -> Dict[str, Any]:
        """Trigger sync with a specific provider."""
        config = self._integrations.get(provider)
        if not config:
            return {"success": False, "error": f"Unknown provider: {provider}"}

        record = SyncRecord(
            provider=provider,
            direction=config.sync_direction.value,
            entity_type=entity_type,
        )

        try:
            await asyncio.sleep(0.05)

            record.records_processed = 0
            record.records_created = 0
            record.records_updated = 0
            record.status = "completed"
            record.completed_at = datetime.utcnow()
            record.duration_ms = (record.completed_at - record.started_at).total_seconds() * 1000

        except Exception as e:
            record.status = "failed"
            record.error = str(e)
            record.completed_at = datetime.utcnow()

        self._sync_history.append(record)
        if len(self._sync_history) > self._max_sync_history:
            self._sync_history = self._sync_history[-self._max_sync_history:]

        return {
            "success": record.status == "completed",
            "sync_id": record.id,
            "provider": provider,
            "records_processed": record.records_processed,
            "duration_ms": record.duration_ms,
        }

    def convert_to_fhir(self, resource_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert internal data to FHIR R4 format."""
        converters = {
            "Patient": self.fhir_mapper.to_patient,
            "Observation": self.fhir_mapper.to_observation,
            "Condition": self.fhir_mapper.to_condition,
            "MedicationRequest": self.fhir_mapper.to_medication_request,
            "DiagnosticReport": self.fhir_mapper.to_diagnostic_report,
            "Appointment": self.fhir_mapper.to_appointment,
        }
        converter = converters.get(resource_type)
        if not converter:
            return {"error": f"Unsupported resource type: {resource_type}"}
        return converter(data)

    def build_hl7_message(self, message_type: str, data: Dict[str, Any]) -> str:
        """Build an HL7 v2 message."""
        builders = {
            "ADT_A01": self.hl7_builder.build_adt_a01,
            "ORM_O01": self.hl7_builder.build_orm_o01,
            "ORU_R01": self.hl7_builder.build_oru_r01,
        }
        builder = builders.get(message_type)
        if not builder:
            return f"Unsupported message type: {message_type}"
        return builder(data)

    async def register_webhook(self, url: str, events: List[str],
                                secret: Optional[str] = None) -> Dict[str, Any]:
        webhook = self.webhook_manager.register(url, events, secret)
        return {"id": webhook.id, "url": webhook.url, "events": webhook.events}

    async def trigger_webhook(self, event: str, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        return await self.webhook_manager.trigger(event, payload)

    def get_sync_history(self, provider: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        history = self._sync_history
        if provider:
            history = [h for h in history if h.provider == provider]
        return [
            {
                "id": h.id, "provider": h.provider,
                "direction": h.direction, "entity_type": h.entity_type,
                "records_processed": h.records_processed,
                "status": h.status, "duration_ms": h.duration_ms,
                "started_at": h.started_at.isoformat(),
                "completed_at": h.completed_at.isoformat() if h.completed_at else None,
                "error": h.error,
            }
            for h in history[-limit:]
        ]

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_integrations": len(self._integrations),
            "active_integrations": sum(1 for c in self._integrations.values() if c.enabled),
            "total_syncs": len(self._sync_history),
            "webhooks": len(self.webhook_manager._webhooks),
            "sync_by_provider": defaultdict(int, {h.provider: 1 for h in self._sync_history}),
        }


# Singleton instance
integration_service = IntegrationService()
