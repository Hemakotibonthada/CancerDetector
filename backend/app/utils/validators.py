"""
Backend Data Validators
Comprehensive data validation for medical/healthcare data.
Includes lab result validators, vital sign validators, medication validators, etc.
"""

import re
import logging
from datetime import datetime, date
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Union

logger = logging.getLogger(__name__)


# ==================== Enums ====================

class VitalSignType(str, Enum):
    HEART_RATE = "heart_rate"
    BLOOD_PRESSURE_SYSTOLIC = "bp_systolic"
    BLOOD_PRESSURE_DIASTOLIC = "bp_diastolic"
    TEMPERATURE = "temperature"
    RESPIRATORY_RATE = "respiratory_rate"
    OXYGEN_SATURATION = "oxygen_saturation"
    BLOOD_GLUCOSE = "blood_glucose"
    WEIGHT = "weight"
    HEIGHT = "height"
    PAIN_LEVEL = "pain_level"


class LabTestType(str, Enum):
    CBC = "cbc"
    BMP = "bmp"
    CMP = "cmp"
    LIPID_PANEL = "lipid_panel"
    LIVER_FUNCTION = "liver_function"
    THYROID = "thyroid"
    HEMOGLOBIN_A1C = "hemoglobin_a1c"
    URINALYSIS = "urinalysis"
    TUMOR_MARKERS = "tumor_markers"
    COAGULATION = "coagulation"
    IRON_STUDIES = "iron_studies"
    VITAMIN_LEVELS = "vitamin_levels"


class ValidationSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    ERROR = "error"


# ==================== Validation Result ====================

class ValidationResult:
    """Container for validation results with severity levels"""

    def __init__(self):
        self.is_valid = True
        self.errors: List[Dict[str, Any]] = []
        self.warnings: List[Dict[str, Any]] = []
        self.info: List[Dict[str, Any]] = []

    def add_error(self, field: str, message: str, details: Any = None):
        self.is_valid = False
        self.errors.append({"field": field, "message": message, "severity": "error", "details": details})

    def add_warning(self, field: str, message: str, details: Any = None):
        self.warnings.append({"field": field, "message": message, "severity": "warning", "details": details})

    def add_info(self, field: str, message: str, details: Any = None):
        self.info.append({"field": field, "message": message, "severity": "info", "details": details})

    def add_critical(self, field: str, message: str, details: Any = None):
        self.is_valid = False
        self.errors.append({"field": field, "message": message, "severity": "critical", "details": details})

    def merge(self, other: "ValidationResult"):
        self.errors.extend(other.errors)
        self.warnings.extend(other.warnings)
        self.info.extend(other.info)
        if not other.is_valid:
            self.is_valid = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "error_count": len(self.errors),
            "warning_count": len(self.warnings),
            "errors": self.errors,
            "warnings": self.warnings,
            "info": self.info,
        }


# ==================== Vital Signs Validator ====================

VITAL_SIGN_RANGES = {
    VitalSignType.HEART_RATE: {
        "unit": "bpm",
        "normal": (60, 100),
        "warning_low": (40, 59),
        "warning_high": (101, 150),
        "critical_low": (0, 39),
        "critical_high": (151, 300),
        "absolute_min": 0,
        "absolute_max": 300,
    },
    VitalSignType.BLOOD_PRESSURE_SYSTOLIC: {
        "unit": "mmHg",
        "normal": (90, 120),
        "warning_low": (70, 89),
        "warning_high": (121, 140),
        "critical_low": (0, 69),
        "critical_high": (141, 250),
        "absolute_min": 0,
        "absolute_max": 300,
    },
    VitalSignType.BLOOD_PRESSURE_DIASTOLIC: {
        "unit": "mmHg",
        "normal": (60, 80),
        "warning_low": (40, 59),
        "warning_high": (81, 90),
        "critical_low": (0, 39),
        "critical_high": (91, 180),
        "absolute_min": 0,
        "absolute_max": 200,
    },
    VitalSignType.TEMPERATURE: {
        "unit": "°F",
        "normal": (97.0, 99.0),
        "warning_low": (95.0, 96.9),
        "warning_high": (99.1, 100.4),
        "critical_low": (85.0, 94.9),
        "critical_high": (100.5, 108.0),
        "absolute_min": 85.0,
        "absolute_max": 115.0,
    },
    VitalSignType.RESPIRATORY_RATE: {
        "unit": "breaths/min",
        "normal": (12, 20),
        "warning_low": (8, 11),
        "warning_high": (21, 30),
        "critical_low": (0, 7),
        "critical_high": (31, 60),
        "absolute_min": 0,
        "absolute_max": 80,
    },
    VitalSignType.OXYGEN_SATURATION: {
        "unit": "%",
        "normal": (95, 100),
        "warning_low": (90, 94),
        "warning_high": (101, 100),
        "critical_low": (0, 89),
        "critical_high": (101, 100),
        "absolute_min": 0,
        "absolute_max": 100,
    },
    VitalSignType.BLOOD_GLUCOSE: {
        "unit": "mg/dL",
        "normal": (70, 100),
        "warning_low": (54, 69),
        "warning_high": (101, 180),
        "critical_low": (0, 53),
        "critical_high": (181, 600),
        "absolute_min": 0,
        "absolute_max": 1000,
    },
    VitalSignType.PAIN_LEVEL: {
        "unit": "scale 0-10",
        "normal": (0, 3),
        "warning_low": (0, 0),
        "warning_high": (4, 6),
        "critical_low": (0, 0),
        "critical_high": (7, 10),
        "absolute_min": 0,
        "absolute_max": 10,
    },
}


def validate_vital_sign(vital_type: VitalSignType, value: float,
                        patient_age: Optional[int] = None) -> ValidationResult:
    """Validate a vital sign reading"""
    result = ValidationResult()
    ranges = VITAL_SIGN_RANGES.get(vital_type)

    if not ranges:
        result.add_warning("vital_type", f"No validation ranges defined for {vital_type.value}")
        return result

    if value < ranges["absolute_min"] or value > ranges["absolute_max"]:
        result.add_error(
            vital_type.value,
            f"Value {value} {ranges['unit']} is outside possible range "
            f"({ranges['absolute_min']}-{ranges['absolute_max']})",
        )
        return result

    normal = ranges["normal"]
    if normal[0] <= value <= normal[1]:
        result.add_info(vital_type.value, f"Normal: {value} {ranges['unit']}")
        return result

    critical_low = ranges["critical_low"]
    critical_high = ranges["critical_high"]
    if value <= critical_low[1] or value >= critical_high[0]:
        result.add_critical(
            vital_type.value,
            f"CRITICAL: {value} {ranges['unit']} is outside safe range",
            {"value": value, "range": "critical"},
        )
        return result

    warning_low = ranges["warning_low"]
    warning_high = ranges["warning_high"]
    if (warning_low[0] <= value <= warning_low[1]) or (warning_high[0] <= value <= warning_high[1]):
        result.add_warning(
            vital_type.value,
            f"Abnormal: {value} {ranges['unit']} is outside normal range",
            {"value": value, "range": "warning"},
        )

    return result


def validate_vitals_set(vitals: Dict[str, float], patient_age: Optional[int] = None) -> ValidationResult:
    """Validate a complete set of vital signs"""
    combined = ValidationResult()

    type_map = {v.value: v for v in VitalSignType}
    for vital_name, value in vitals.items():
        vital_type = type_map.get(vital_name)
        if vital_type:
            r = validate_vital_sign(vital_type, value, patient_age)
            combined.merge(r)

    # Cross-vital validation
    systolic = vitals.get("bp_systolic")
    diastolic = vitals.get("bp_diastolic")
    if systolic and diastolic:
        if diastolic >= systolic:
            combined.add_error("blood_pressure",
                               "Diastolic pressure cannot be >= systolic pressure")
        pulse_pressure = systolic - diastolic
        if pulse_pressure < 25:
            combined.add_warning("blood_pressure",
                                 f"Narrow pulse pressure ({pulse_pressure} mmHg)")
        elif pulse_pressure > 100:
            combined.add_warning("blood_pressure",
                                 f"Wide pulse pressure ({pulse_pressure} mmHg)")

    spo2 = vitals.get("oxygen_saturation")
    hr = vitals.get("heart_rate")
    rr = vitals.get("respiratory_rate")
    if spo2 and hr and rr:
        if spo2 < 92 and hr > 120 and rr > 24:
            combined.add_critical("respiratory_distress",
                                  "Pattern suggests possible respiratory distress")

    return combined


# ==================== Lab Results Validator ====================

LAB_REFERENCE_RANGES = {
    # CBC
    "wbc": {"unit": "×10³/µL", "normal": (4.5, 11.0), "critical_low": 2.0, "critical_high": 30.0},
    "rbc": {"unit": "×10⁶/µL", "normal_male": (4.7, 6.1), "normal_female": (4.2, 5.4)},
    "hemoglobin": {"unit": "g/dL", "normal_male": (14.0, 18.0), "normal_female": (12.0, 16.0),
                   "critical_low": 7.0, "critical_high": 20.0},
    "hematocrit": {"unit": "%", "normal_male": (42, 52), "normal_female": (37, 47)},
    "platelet_count": {"unit": "×10³/µL", "normal": (150, 400), "critical_low": 50, "critical_high": 1000},
    "mcv": {"unit": "fL", "normal": (80, 100)},
    "mch": {"unit": "pg", "normal": (27, 33)},
    "mchc": {"unit": "g/dL", "normal": (32, 36)},
    "rdw": {"unit": "%", "normal": (11.5, 14.5)},

    # BMP/CMP
    "sodium": {"unit": "mEq/L", "normal": (136, 145), "critical_low": 120, "critical_high": 160},
    "potassium": {"unit": "mEq/L", "normal": (3.5, 5.0), "critical_low": 2.5, "critical_high": 6.5},
    "chloride": {"unit": "mEq/L", "normal": (98, 106)},
    "bicarbonate": {"unit": "mEq/L", "normal": (22, 29)},
    "bun": {"unit": "mg/dL", "normal": (7, 20)},
    "creatinine": {"unit": "mg/dL", "normal_male": (0.7, 1.3), "normal_female": (0.6, 1.1)},
    "glucose_fasting": {"unit": "mg/dL", "normal": (70, 100), "critical_low": 40, "critical_high": 500},
    "calcium": {"unit": "mg/dL", "normal": (8.5, 10.5), "critical_low": 6.0, "critical_high": 13.0},
    "magnesium": {"unit": "mg/dL", "normal": (1.7, 2.2)},
    "phosphorus": {"unit": "mg/dL", "normal": (2.5, 4.5)},

    # Liver function
    "alt": {"unit": "U/L", "normal": (7, 56)},
    "ast": {"unit": "U/L", "normal": (10, 40)},
    "alp": {"unit": "U/L", "normal": (44, 147)},
    "total_bilirubin": {"unit": "mg/dL", "normal": (0.1, 1.2), "critical_high": 15.0},
    "direct_bilirubin": {"unit": "mg/dL", "normal": (0.0, 0.3)},
    "albumin": {"unit": "g/dL", "normal": (3.4, 5.4)},
    "total_protein": {"unit": "g/dL", "normal": (6.0, 8.3)},
    "ggt": {"unit": "U/L", "normal": (0, 51)},

    # Lipid panel
    "total_cholesterol": {"unit": "mg/dL", "normal": (0, 200), "warning_high": 239},
    "ldl": {"unit": "mg/dL", "normal": (0, 100), "warning_high": 159},
    "hdl": {"unit": "mg/dL", "normal": (40, 200)},
    "triglycerides": {"unit": "mg/dL", "normal": (0, 150), "warning_high": 199, "critical_high": 500},

    # Thyroid
    "tsh": {"unit": "mIU/L", "normal": (0.4, 4.0)},
    "free_t4": {"unit": "ng/dL", "normal": (0.8, 1.8)},
    "free_t3": {"unit": "pg/mL", "normal": (2.3, 4.2)},

    # Coagulation
    "pt": {"unit": "seconds", "normal": (11.0, 13.5)},
    "inr": {"unit": "ratio", "normal": (0.8, 1.1)},
    "ptt": {"unit": "seconds", "normal": (25, 35)},
    "fibrinogen": {"unit": "mg/dL", "normal": (200, 400)},
    "d_dimer": {"unit": "µg/mL", "normal": (0, 0.5)},

    # Tumor Markers
    "psa": {"unit": "ng/mL", "normal": (0, 4.0), "warning_high": 10.0},
    "cea": {"unit": "ng/mL", "normal": (0, 3.0), "warning_high": 10.0},
    "afp": {"unit": "ng/mL", "normal": (0, 10.0)},
    "ca_125": {"unit": "U/mL", "normal": (0, 35.0)},
    "ca_19_9": {"unit": "U/mL", "normal": (0, 37.0)},
    "ca_15_3": {"unit": "U/mL", "normal": (0, 30.0)},
    "her2": {"unit": "ng/mL", "normal": (0, 15.0)},
    "beta_hcg": {"unit": "mIU/mL", "normal": (0, 5.0)},
    "ldh": {"unit": "U/L", "normal": (140, 280)},

    # Iron Studies
    "serum_iron": {"unit": "µg/dL", "normal": (60, 170)},
    "tibc": {"unit": "µg/dL", "normal": (250, 400)},
    "ferritin": {"unit": "ng/mL", "normal_male": (20, 500), "normal_female": (20, 200)},
    "transferrin_saturation": {"unit": "%", "normal": (20, 50)},

    # HbA1c
    "hemoglobin_a1c": {"unit": "%", "normal": (4.0, 5.7), "warning_high": 6.4},

    # Inflammation
    "crp": {"unit": "mg/L", "normal": (0, 3.0), "warning_high": 10.0},
    "esr": {"unit": "mm/hr", "normal_male": (0, 15), "normal_female": (0, 20)},

    # Vitamins
    "vitamin_d": {"unit": "ng/mL", "normal": (30, 100)},
    "vitamin_b12": {"unit": "pg/mL", "normal": (200, 900)},
    "folate": {"unit": "ng/mL", "normal": (2.7, 17.0)},
}


def validate_lab_result(test_name: str, value: float,
                        gender: Optional[str] = None) -> ValidationResult:
    """Validate a single lab result"""
    result = ValidationResult()
    ref = LAB_REFERENCE_RANGES.get(test_name.lower())

    if not ref:
        result.add_info(test_name, f"No reference range available for {test_name}")
        return result

    unit = ref.get("unit", "")

    # Determine normal range based on gender
    if gender and f"normal_{gender.lower()}" in ref:
        normal = ref[f"normal_{gender.lower()}"]
    else:
        normal = ref.get("normal", (0, float("inf")))

    # Check critical values first
    critical_low = ref.get("critical_low")
    critical_high = ref.get("critical_high")

    if critical_low is not None and value < critical_low:
        result.add_critical(test_name,
                            f"CRITICAL LOW: {value} {unit} (critical threshold: {critical_low})")
        return result

    if critical_high is not None and value > critical_high:
        result.add_critical(test_name,
                            f"CRITICAL HIGH: {value} {unit} (critical threshold: {critical_high})")
        return result

    # Check warning ranges
    warning_high = ref.get("warning_high")
    if warning_high and value > normal[1] and value <= warning_high:
        result.add_warning(test_name,
                           f"Borderline high: {value} {unit} (normal: {normal[0]}-{normal[1]})")
        return result

    # Check normal range
    if value < normal[0]:
        result.add_warning(test_name,
                           f"Low: {value} {unit} (normal: {normal[0]}-{normal[1]})")
    elif value > normal[1]:
        result.add_warning(test_name,
                           f"High: {value} {unit} (normal: {normal[0]}-{normal[1]})")
    else:
        result.add_info(test_name, f"Normal: {value} {unit}")

    return result


def validate_lab_panel(panel_type: str, results: Dict[str, float],
                       gender: Optional[str] = None) -> ValidationResult:
    """Validate a complete lab panel"""
    combined = ValidationResult()

    for test_name, value in results.items():
        r = validate_lab_result(test_name, value, gender)
        combined.merge(r)

    # Cross-test validation

    # Anion gap
    sodium = results.get("sodium")
    chloride = results.get("chloride")
    bicarbonate = results.get("bicarbonate")
    if sodium and chloride and bicarbonate:
        anion_gap = sodium - (chloride + bicarbonate)
        if anion_gap > 16:
            combined.add_warning("anion_gap",
                                 f"High anion gap: {anion_gap} mEq/L (>16)")
        elif anion_gap < 8:
            combined.add_warning("anion_gap",
                                 f"Low anion gap: {anion_gap} mEq/L (<8)")

    # BUN/Creatinine ratio
    bun = results.get("bun")
    creatinine = results.get("creatinine")
    if bun and creatinine and creatinine > 0:
        ratio = bun / creatinine
        if ratio > 20:
            combined.add_warning("bun_creatinine_ratio",
                                 f"Elevated BUN/Creatinine ratio: {ratio:.1f} (may indicate prerenal azotemia)")

    # AST/ALT ratio (De Ritis ratio)
    ast = results.get("ast")
    alt = results.get("alt")
    if ast and alt and alt > 0:
        deritis = ast / alt
        if deritis > 2:
            combined.add_warning("deritis_ratio",
                                 f"AST/ALT ratio: {deritis:.1f} (>2 may suggest alcoholic liver disease)")

    # Lipid ratios
    total_chol = results.get("total_cholesterol")
    hdl = results.get("hdl")
    if total_chol and hdl and hdl > 0:
        ratio = total_chol / hdl
        if ratio > 5:
            combined.add_warning("cholesterol_hdl_ratio",
                                 f"Total cholesterol/HDL ratio: {ratio:.1f} (>5 is high risk)")

    return combined


# ==================== Medication Validator ====================

DRUG_INTERACTION_SEVERITY = {
    "major": "Potentially life-threatening or capable of causing permanent damage",
    "moderate": "May result in exacerbation of the patient's condition",
    "minor": "Minimal clinical effects; alternative may not be necessary",
}

# Common dangerous drug interactions (simplified for demo)
KNOWN_INTERACTIONS = [
    {
        "drug_a": "warfarin",
        "drug_b": "aspirin",
        "severity": "major",
        "description": "Increased risk of bleeding",
    },
    {
        "drug_a": "methotrexate",
        "drug_b": "nsaid",
        "severity": "major",
        "description": "Increased methotrexate toxicity",
    },
    {
        "drug_a": "ssri",
        "drug_b": "maoi",
        "severity": "major",
        "description": "Risk of serotonin syndrome",
    },
    {
        "drug_a": "statin",
        "drug_b": "fibrate",
        "severity": "moderate",
        "description": "Increased risk of rhabdomyolysis",
    },
    {
        "drug_a": "ace_inhibitor",
        "drug_b": "potassium_supplement",
        "severity": "moderate",
        "description": "Risk of hyperkalemia",
    },
    {
        "drug_a": "digoxin",
        "drug_b": "amiodarone",
        "severity": "major",
        "description": "Increased digoxin levels and toxicity",
    },
    {
        "drug_a": "ciprofloxacin",
        "drug_b": "theophylline",
        "severity": "major",
        "description": "Increased theophylline levels",
    },
    {
        "drug_a": "clarithromycin",
        "drug_b": "statin",
        "severity": "major",
        "description": "Increased risk of rhabdomyolysis",
    },
]


def check_drug_interactions(medications: List[str]) -> ValidationResult:
    """Check for known drug interactions"""
    result = ValidationResult()
    meds_lower = [m.lower() for m in medications]

    for interaction in KNOWN_INTERACTIONS:
        drug_a = interaction["drug_a"]
        drug_b = interaction["drug_b"]

        a_present = any(drug_a in m for m in meds_lower)
        b_present = any(drug_b in m for m in meds_lower)

        if a_present and b_present:
            severity = interaction["severity"]
            if severity == "major":
                result.add_critical(
                    "drug_interaction",
                    f"MAJOR interaction: {drug_a} + {drug_b} - {interaction['description']}",
                )
            elif severity == "moderate":
                result.add_warning(
                    "drug_interaction",
                    f"Moderate interaction: {drug_a} + {drug_b} - {interaction['description']}",
                )
            else:
                result.add_info(
                    "drug_interaction",
                    f"Minor interaction: {drug_a} + {drug_b} - {interaction['description']}",
                )

    if not result.errors and not result.warnings:
        result.add_info("drug_interaction", "No known interactions found")

    return result


def validate_dosage(medication: str, dosage: float, unit: str,
                    frequency: str, patient_weight_kg: Optional[float] = None) -> ValidationResult:
    """Validate medication dosage"""
    result = ValidationResult()

    if dosage <= 0:
        result.add_error("dosage", "Dosage must be positive")
        return result

    valid_units = {"mg", "mcg", "g", "mL", "units", "mg/kg", "IU"}
    if unit not in valid_units:
        result.add_warning("unit", f"Unusual dosage unit: {unit}")

    valid_frequencies = {
        "once_daily", "twice_daily", "three_times_daily", "four_times_daily",
        "every_4_hours", "every_6_hours", "every_8_hours", "every_12_hours",
        "once_weekly", "twice_weekly", "as_needed", "stat", "at_bedtime",
    }
    if frequency not in valid_frequencies:
        result.add_warning("frequency", f"Non-standard frequency: {frequency}")

    # Weight-based dosage check
    if patient_weight_kg and unit == "mg/kg":
        total_dose = dosage * patient_weight_kg
        if total_dose > 5000:
            result.add_warning("dosage",
                               f"High weight-based dose: {total_dose:.1f}mg total for {patient_weight_kg}kg patient")

    return result


# ==================== Patient Data Validator ====================

def validate_patient_demographics(data: Dict[str, Any]) -> ValidationResult:
    """Validate patient demographic data"""
    result = ValidationResult()

    # First name
    first_name = data.get("first_name", "").strip()
    if not first_name:
        result.add_error("first_name", "First name is required")
    elif len(first_name) < 2:
        result.add_error("first_name", "First name must be at least 2 characters")
    elif not re.match(r"^[a-zA-Z\s'-]+$", first_name):
        result.add_warning("first_name", "First name contains unusual characters")

    # Last name
    last_name = data.get("last_name", "").strip()
    if not last_name:
        result.add_error("last_name", "Last name is required")
    elif len(last_name) < 2:
        result.add_error("last_name", "Last name must be at least 2 characters")

    # Date of birth
    dob = data.get("date_of_birth")
    if not dob:
        result.add_error("date_of_birth", "Date of birth is required")
    else:
        from .helpers import validate_date_of_birth
        valid, error = validate_date_of_birth(dob)
        if not valid:
            result.add_error("date_of_birth", error)

    # Gender
    valid_genders = {"male", "female", "non_binary", "prefer_not_to_say", "other"}
    gender = data.get("gender", "").lower()
    if gender and gender not in valid_genders:
        result.add_warning("gender", f"Non-standard gender value: {gender}")

    # Email
    email = data.get("email", "")
    if email:
        from .helpers import validate_email
        if not validate_email(email):
            result.add_error("email", "Invalid email format")

    # Phone
    phone = data.get("phone", "")
    if phone:
        from .helpers import validate_phone
        if not validate_phone(phone):
            result.add_error("phone", "Invalid phone number format")

    # Blood type
    valid_blood_types = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
    blood_type = data.get("blood_type", "")
    if blood_type and blood_type not in valid_blood_types:
        result.add_error("blood_type", f"Invalid blood type: {blood_type}")

    # Emergency contact
    emergency_contact = data.get("emergency_contact")
    if not emergency_contact:
        result.add_warning("emergency_contact", "Emergency contact is recommended")

    return result


# ==================== Appointment Validator ====================

def validate_appointment(data: Dict[str, Any]) -> ValidationResult:
    """Validate appointment data"""
    result = ValidationResult()

    # Patient ID
    if not data.get("patient_id"):
        result.add_error("patient_id", "Patient ID is required")

    # Doctor ID
    if not data.get("doctor_id"):
        result.add_error("doctor_id", "Doctor ID is required")

    # Date/Time
    appointment_dt = data.get("appointment_datetime")
    if not appointment_dt:
        result.add_error("appointment_datetime", "Appointment date/time is required")
    else:
        if isinstance(appointment_dt, str):
            from .helpers import parse_datetime
            appointment_dt = parse_datetime(appointment_dt)
        if appointment_dt:
            now = datetime.utcnow()
            if appointment_dt < now:
                result.add_error("appointment_datetime",
                                 "Appointment cannot be in the past")
            if appointment_dt > now + __import__("datetime").timedelta(days=365):
                result.add_warning("appointment_datetime",
                                   "Appointment is more than a year in the future")
            if appointment_dt.hour < 6 or appointment_dt.hour > 22:
                result.add_warning("appointment_datetime",
                                   "Appointment is outside normal business hours (6 AM - 10 PM)")

    # Duration
    duration = data.get("duration_minutes", 30)
    if duration < 5:
        result.add_error("duration_minutes", "Appointment must be at least 5 minutes")
    elif duration > 480:
        result.add_error("duration_minutes", "Appointment cannot exceed 8 hours")

    # Type
    valid_types = {
        "consultation", "follow_up", "procedure", "surgery", "screening",
        "emergency", "telemedicine", "lab_visit", "imaging", "therapy",
    }
    appt_type = data.get("appointment_type", "")
    if appt_type and appt_type not in valid_types:
        result.add_warning("appointment_type", f"Non-standard appointment type: {appt_type}")

    return result


# ==================== Image Validation ====================

def validate_medical_image(filename: str, file_size: int,
                           modality: Optional[str] = None) -> ValidationResult:
    """Validate medical image file"""
    result = ValidationResult()

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    valid_extensions = {"dcm", "dicom", "nii", "gz", "jpg", "jpeg", "png",
                        "tiff", "bmp", "mha", "mhd", "nrrd"}

    if ext not in valid_extensions:
        result.add_error("file_type", f"Unsupported image format: .{ext}")

    # Size validation (medical images can be large)
    max_size = 500 * 1024 * 1024  # 500MB
    if file_size > max_size:
        result.add_error("file_size",
                         f"File size ({file_size / (1024*1024):.1f}MB) exceeds maximum (500MB)")
    elif file_size > 200 * 1024 * 1024:
        result.add_warning("file_size",
                           f"Large file ({file_size / (1024*1024):.1f}MB) may take longer to process")
    elif file_size < 1024:
        result.add_warning("file_size", "File seems unusually small, may be corrupted")

    # Modality validation
    valid_modalities = {
        "CT", "MRI", "PET", "XRAY", "ULTRASOUND", "MAMMOGRAPHY",
        "DERMOSCOPY", "PATHOLOGY", "FLUOROSCOPY", "ANGIOGRAPHY",
    }
    if modality and modality.upper() not in valid_modalities:
        result.add_warning("modality", f"Non-standard imaging modality: {modality}")

    return result


# ==================== Genomic Data Validator ====================

def validate_genomic_data(data: Dict[str, Any]) -> ValidationResult:
    """Validate genomic/genetic test data"""
    result = ValidationResult()

    # Validate gene name
    gene = data.get("gene_name", "")
    if gene and not re.match(r'^[A-Z][A-Z0-9]{1,20}$', gene.upper()):
        result.add_warning("gene_name", f"Non-standard gene name format: {gene}")

    # Validate variant notation (HGVS-like)
    variant = data.get("variant", "")
    if variant:
        hgvs_pattern = r'^[cnpgmr]\.\d+.*$'
        if not re.match(hgvs_pattern, variant):
            result.add_warning("variant", f"Non-standard variant notation: {variant}")

    # Variant classification
    valid_classifications = {
        "pathogenic", "likely_pathogenic", "uncertain_significance",
        "likely_benign", "benign",
    }
    classification = data.get("classification", "")
    if classification and classification not in valid_classifications:
        result.add_warning("classification",
                           f"Non-standard variant classification: {classification}")

    # Zygosity
    valid_zygosity = {"heterozygous", "homozygous", "hemizygous", "compound_heterozygous"}
    zygosity = data.get("zygosity", "")
    if zygosity and zygosity not in valid_zygosity:
        result.add_warning("zygosity", f"Non-standard zygosity: {zygosity}")

    # Required for cancer genomics
    if data.get("cancer_type") and not data.get("sample_type"):
        result.add_warning("sample_type",
                           "Sample type (tumor/normal) should be specified for cancer genomic tests")

    return result


# ==================== Billing Validator ====================

def validate_billing_data(data: Dict[str, Any]) -> ValidationResult:
    """Validate billing/insurance data"""
    result = ValidationResult()

    # CPT code
    cpt_code = data.get("cpt_code", "")
    if cpt_code:
        if not re.match(r'^\d{5}$', cpt_code):
            result.add_error("cpt_code", f"Invalid CPT code format: {cpt_code}")

    # ICD-10 diagnosis codes
    diagnosis_codes = data.get("diagnosis_codes", [])
    for code in diagnosis_codes:
        from .helpers import validate_icd10_code
        valid, error = validate_icd10_code(code)
        if not valid:
            result.add_error("diagnosis_code", f"Invalid ICD-10 code '{code}': {error}")

    # Amount
    amount = data.get("amount")
    if amount is not None:
        try:
            amount = float(amount)
            if amount < 0:
                result.add_error("amount", "Amount cannot be negative")
            if amount > 1000000:
                result.add_warning("amount",
                                   f"Unusually high amount: ${amount:,.2f}")
        except (ValueError, TypeError):
            result.add_error("amount", "Invalid amount format")

    # Insurance
    insurance_id = data.get("insurance_id", "")
    if insurance_id and len(insurance_id) < 5:
        result.add_warning("insurance_id", "Insurance ID seems too short")

    return result


# ==================== Exports ====================

__all__ = [
    # Enums
    "VitalSignType", "LabTestType", "ValidationSeverity",
    # Classes
    "ValidationResult",
    # Vital signs
    "validate_vital_sign", "validate_vitals_set", "VITAL_SIGN_RANGES",
    # Lab results
    "validate_lab_result", "validate_lab_panel", "LAB_REFERENCE_RANGES",
    # Medications
    "check_drug_interactions", "validate_dosage",
    # Patient data
    "validate_patient_demographics",
    # Appointments
    "validate_appointment",
    # Images
    "validate_medical_image",
    # Genomics
    "validate_genomic_data",
    # Billing
    "validate_billing_data",
]
