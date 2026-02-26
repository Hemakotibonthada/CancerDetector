"""
Backend Utilities Package
Comprehensive utility functions for the Cancer Detection Platform.
Includes data validation, encryption, file handling, pagination, response formatting,
date/time helpers, medical code validation, and more.
"""

import base64
import hashlib
import hmac
import io
import json
import logging
import math
import mimetypes
import os
import re
import secrets
import string
import unicodedata
import uuid
from datetime import datetime, timedelta, date, timezone
from decimal import Decimal
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple, TypeVar, Union
from urllib.parse import quote, unquote, urlencode, urlparse

logger = logging.getLogger(__name__)

T = TypeVar("T")


# ==================== Constants ====================

MEDICAL_FILE_EXTENSIONS = {
    ".dcm": "application/dicom",
    ".nii": "application/x-nifti",
    ".nii.gz": "application/x-nifti",
    ".mha": "application/x-mha",
    ".mhd": "application/x-mhd",
    ".nrrd": "application/x-nrrd",
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp", ".svg"}
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".csv", ".xlsx", ".xls"}
ALLOWED_UPLOAD_EXTENSIONS = IMAGE_EXTENSIONS | DOCUMENT_EXTENSIONS | set(MEDICAL_FILE_EXTENSIONS.keys())

MAX_FILE_SIZE_MB = 100
MAX_IMAGE_SIZE_MB = 50
MAX_DOCUMENT_SIZE_MB = 25

# ICD-10 Cancer Code Ranges
ICD10_CANCER_RANGES = [
    ("C00", "C96"),   # Malignant neoplasms
    ("D00", "D09"),   # In situ neoplasms
    ("D10", "D36"),   # Benign neoplasms
    ("D37", "D48"),   # Neoplasms of uncertain behavior
    ("D49", "D49"),   # Neoplasms of unspecified behavior
]


# ==================== String Utilities ====================

def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix"""
    uid = str(uuid.uuid4()).replace("-", "")
    return f"{prefix}_{uid}" if prefix else uid


def generate_short_id(length: int = 8) -> str:
    """Generate a short alphanumeric ID"""
    chars = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


def generate_medical_record_number() -> str:
    """Generate a Medical Record Number"""
    return f"MRN-{generate_short_id(10)}"


def generate_case_number() -> str:
    """Generate a case number"""
    date_part = datetime.utcnow().strftime("%Y%m%d")
    random_part = generate_short_id(6)
    return f"CASE-{date_part}-{random_part}"


def slugify(text: str) -> str:
    """Convert text to URL-safe slug"""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-_")
    return text


def truncate(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to max length with suffix"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def mask_sensitive(value: str, visible_chars: int = 4, mask_char: str = "*") -> str:
    """Mask sensitive data showing only last N characters"""
    if len(value) <= visible_chars:
        return mask_char * len(value)
    masked = mask_char * (len(value) - visible_chars) + value[-visible_chars:]
    return masked


def sanitize_filename(filename: str) -> str:
    """Sanitize a filename for safe storage"""
    filename = unicodedata.normalize("NFKD", filename)
    filename = filename.encode("ascii", "ignore").decode("ascii")
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', filename)
    filename = filename.strip(". ")
    if not filename:
        filename = "unnamed_file"
    name, ext = os.path.splitext(filename)
    name = name[:200]
    return f"{name}{ext}"


def normalize_phone(phone: str) -> str:
    """Normalize phone number to E.164 format"""
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return f"+1{digits}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    return f"+{digits}"


def normalize_email(email: str) -> str:
    """Normalize email address"""
    email = email.strip().lower()
    local, domain = email.rsplit("@", 1)
    return f"{local}@{domain}"


# ==================== Validation Utilities ====================

def validate_email(email: str) -> bool:
    """Validate email address format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Validate phone number"""
    digits = re.sub(r'\D', '', phone)
    return 10 <= len(digits) <= 15


def validate_ssn(ssn: str) -> bool:
    """Validate Social Security Number format"""
    pattern = r'^\d{3}-\d{2}-\d{4}$'
    return bool(re.match(pattern, ssn))


def validate_date_of_birth(dob: Union[str, date, datetime]) -> Tuple[bool, Optional[str]]:
    """Validate date of birth"""
    try:
        if isinstance(dob, str):
            parsed = datetime.strptime(dob, "%Y-%m-%d").date()
        elif isinstance(dob, datetime):
            parsed = dob.date()
        else:
            parsed = dob

        today = date.today()
        if parsed > today:
            return False, "Date of birth cannot be in the future"
        if (today - parsed).days > 150 * 365:
            return False, "Date of birth seems unrealistic (>150 years old)"
        return True, None
    except (ValueError, TypeError) as e:
        return False, str(e)


def validate_icd10_code(code: str) -> Tuple[bool, Optional[str]]:
    """Validate ICD-10 diagnosis code"""
    pattern = r'^[A-Z]\d{2}(\.\d{1,4})?$'
    if not re.match(pattern, code.upper()):
        return False, "Invalid ICD-10 code format"
    return True, None


def validate_icd10_cancer_code(code: str) -> bool:
    """Check if ICD-10 code is a cancer/neoplasm code"""
    code_upper = code.upper().split('.')[0]
    for start, end in ICD10_CANCER_RANGES:
        if start <= code_upper <= end:
            return True
    return False


def validate_npi(npi: str) -> bool:
    """Validate National Provider Identifier (NPI)"""
    if not re.match(r'^\d{10}$', npi):
        return False
    # Luhn algorithm check
    digits = [int(d) for d in npi]
    check_sum = 24  # prefix for health industry
    for i, d in enumerate(digits[:-1]):
        if i % 2 == 0:
            doubled = d * 2
            check_sum += doubled - 9 if doubled > 9 else doubled
        else:
            check_sum += d
    check_digit = (10 - (check_sum % 10)) % 10
    return check_digit == digits[-1]


def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
    """Validate password strength requirements"""
    issues = []
    if len(password) < 12:
        issues.append("Password must be at least 12 characters long")
    if not re.search(r'[A-Z]', password):
        issues.append("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        issues.append("Password must contain at least one lowercase letter")
    if not re.search(r'\d', password):
        issues.append("Password must contain at least one digit")
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
        issues.append("Password must contain at least one special character")
    if re.search(r'(.)\1{2,}', password):
        issues.append("Password must not contain 3 or more consecutive identical characters")

    return len(issues) == 0, issues


def validate_file_upload(filename: str, file_size: int,
                         allowed_extensions: Optional[Set[str]] = None) -> Tuple[bool, Optional[str]]:
    """Validate file upload"""
    if not filename:
        return False, "Filename is required"

    ext = os.path.splitext(filename)[1].lower()
    allowed = allowed_extensions or ALLOWED_UPLOAD_EXTENSIONS
    if ext not in allowed:
        return False, f"File type '{ext}' is not allowed"

    max_size = MAX_FILE_SIZE_MB * 1024 * 1024
    if ext in IMAGE_EXTENSIONS:
        max_size = MAX_IMAGE_SIZE_MB * 1024 * 1024
    elif ext in DOCUMENT_EXTENSIONS:
        max_size = MAX_DOCUMENT_SIZE_MB * 1024 * 1024

    if file_size > max_size:
        return False, f"File size exceeds maximum allowed ({max_size // (1024*1024)}MB)"

    return True, None


# ==================== Encryption Utilities ====================

def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hash a password with salt using PBKDF2"""
    if salt is None:
        salt = secrets.token_hex(32)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return base64.b64encode(hashed).decode(), salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verify a password against its hash"""
    new_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(new_hash, hashed)


def generate_token(length: int = 64) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP"""
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


def encrypt_field(value: str, key: Optional[str] = None) -> str:
    """Simple field encryption using XOR (for demo; use Fernet in production)"""
    if not key:
        key = os.environ.get("ENCRYPTION_KEY", "default-encryption-key-change-me")
    key_bytes = hashlib.sha256(key.encode()).digest()
    encrypted = bytes([b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(value.encode())])
    return base64.b64encode(encrypted).decode()


def decrypt_field(encrypted_value: str, key: Optional[str] = None) -> str:
    """Simple field decryption (reverse of encrypt_field)"""
    if not key:
        key = os.environ.get("ENCRYPTION_KEY", "default-encryption-key-change-me")
    key_bytes = hashlib.sha256(key.encode()).digest()
    decoded = base64.b64decode(encrypted_value)
    decrypted = bytes([b ^ key_bytes[i % len(key_bytes)] for i, b in enumerate(decoded)])
    return decrypted.decode()


def compute_file_hash(file_content: bytes, algorithm: str = "sha256") -> str:
    """Compute hash of file content"""
    hasher = hashlib.new(algorithm)
    hasher.update(file_content)
    return hasher.hexdigest()


# ==================== Date/Time Utilities ====================

def utcnow() -> datetime:
    """Get current UTC datetime"""
    return datetime.now(timezone.utc)


def format_datetime(dt: Optional[datetime], fmt: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Format datetime to string"""
    if dt is None:
        return ""
    return dt.strftime(fmt)


def parse_datetime(dt_str: str, fmt: Optional[str] = None) -> Optional[datetime]:
    """Parse datetime from string"""
    formats = [fmt] if fmt else [
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
    ]
    for f in formats:
        try:
            return datetime.strptime(dt_str, f)
        except ValueError:
            continue
    return None


def calculate_age(birth_date: Union[date, datetime]) -> int:
    """Calculate age from birth date"""
    today = date.today()
    if isinstance(birth_date, datetime):
        birth_date = birth_date.date()
    age = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age


def time_ago(dt: datetime) -> str:
    """Get human-readable time difference"""
    now = datetime.utcnow()
    diff = now - dt

    seconds = diff.total_seconds()
    if seconds < 60:
        return "just now"
    if seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    if seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    if seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days > 1 else ''} ago"
    if seconds < 2592000:
        weeks = int(seconds / 604800)
        return f"{weeks} week{'s' if weeks > 1 else ''} ago"
    if seconds < 31536000:
        months = int(seconds / 2592000)
        return f"{months} month{'s' if months > 1 else ''} ago"
    years = int(seconds / 31536000)
    return f"{years} year{'s' if years > 1 else ''} ago"


def get_date_range(period: str) -> Tuple[datetime, datetime]:
    """Get date range for common periods"""
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    periods = {
        "today": (today, now),
        "yesterday": (today - timedelta(days=1), today),
        "this_week": (today - timedelta(days=today.weekday()), now),
        "last_week": (today - timedelta(days=today.weekday() + 7),
                      today - timedelta(days=today.weekday())),
        "this_month": (today.replace(day=1), now),
        "last_month": ((today.replace(day=1) - timedelta(days=1)).replace(day=1),
                       today.replace(day=1)),
        "this_quarter": (today.replace(month=((today.month - 1) // 3) * 3 + 1, day=1), now),
        "this_year": (today.replace(month=1, day=1), now),
        "last_7_days": (today - timedelta(days=7), now),
        "last_30_days": (today - timedelta(days=30), now),
        "last_90_days": (today - timedelta(days=90), now),
        "last_365_days": (today - timedelta(days=365), now),
    }

    return periods.get(period, (today - timedelta(days=30), now))


# ==================== Pagination Utilities ====================

class PaginationParams:
    """Pagination parameters"""
    def __init__(self, page: int = 1, page_size: int = 20,
                 sort_by: str = "created_at", sort_order: str = "desc"):
        self.page = max(1, page)
        self.page_size = min(max(1, page_size), 100)  # Max 100 per page
        self.sort_by = sort_by
        self.sort_order = sort_order.lower()
        self.offset = (self.page - 1) * self.page_size


def paginate(items: List[T], page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    """Paginate a list of items"""
    total = len(items)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    page = max(1, min(page, total_pages))
    offset = (page - 1) * page_size

    return {
        "items": items[offset:offset + page_size],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        },
    }


# ==================== Response Formatting ====================

def success_response(data: Any = None, message: str = "Success",
                     meta: Optional[Dict] = None) -> Dict[str, Any]:
    """Create standardized success response"""
    response = {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    if meta:
        response["meta"] = meta
    return response


def error_response(message: str, code: int = 400,
                   details: Optional[Any] = None) -> Dict[str, Any]:
    """Create standardized error response"""
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


def list_response(items: List[Any], total: int, page: int = 1,
                  page_size: int = 20) -> Dict[str, Any]:
    """Create standardized list response with pagination"""
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return {
        "success": True,
        "data": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


# ==================== Medical Utilities ====================

def calculate_bmi(weight_kg: float, height_cm: float) -> Tuple[float, str]:
    """Calculate BMI and category"""
    if height_cm <= 0 or weight_kg <= 0:
        return 0.0, "invalid"
    height_m = height_cm / 100
    bmi = round(weight_kg / (height_m ** 2), 1)
    if bmi < 18.5:
        category = "underweight"
    elif bmi < 25:
        category = "normal"
    elif bmi < 30:
        category = "overweight"
    elif bmi < 35:
        category = "obese_class_1"
    elif bmi < 40:
        category = "obese_class_2"
    else:
        category = "obese_class_3"
    return bmi, category


def calculate_bsa(weight_kg: float, height_cm: float) -> float:
    """Calculate Body Surface Area using Mosteller formula (m²)"""
    if weight_kg <= 0 or height_cm <= 0:
        return 0.0
    return round(math.sqrt((weight_kg * height_cm) / 3600), 2)


def calculate_egfr(creatinine: float, age: int, is_female: bool,
                   is_african_american: bool = False) -> float:
    """Calculate estimated GFR using CKD-EPI equation"""
    if creatinine <= 0 or age <= 0:
        return 0.0

    kappa = 0.7 if is_female else 0.9
    alpha = -0.329 if is_female else -0.411

    min_ratio = min(creatinine / kappa, 1.0)
    max_ratio = max(creatinine / kappa, 1.0)

    egfr = 141 * (min_ratio ** alpha) * (max_ratio ** -1.209) * (0.993 ** age)

    if is_female:
        egfr *= 1.018
    if is_african_american:
        egfr *= 1.159

    return round(egfr, 1)


def cancer_stage_to_numeric(stage: str) -> int:
    """Convert cancer stage string to numeric value"""
    stage_map = {
        "0": 0, "I": 1, "IA": 1, "IB": 1, "IC": 1,
        "II": 2, "IIA": 2, "IIB": 2, "IIC": 2,
        "III": 3, "IIIA": 3, "IIIB": 3, "IIIC": 3,
        "IV": 4, "IVA": 4, "IVB": 4, "IVC": 4,
    }
    return stage_map.get(stage.upper(), -1)


def tnm_stage(t: str, n: str, m: str) -> str:
    """Determine overall cancer stage from TNM classification"""
    if m.upper() == "M1":
        return "IV"

    stage_rules = {
        ("Tis", "N0"): "0",
        ("T1", "N0"): "I", ("T2", "N0"): "I",
        ("T1", "N1"): "II", ("T2", "N1"): "II", ("T3", "N0"): "II",
        ("T3", "N1"): "III", ("T4", "N0"): "III",
        ("T4", "N1"): "III", ("T4", "N2"): "III",
    }

    t_base = t.upper().rstrip("ABC")
    n_base = n.upper().rstrip("ABC")
    key = (t_base, n_base)

    return stage_rules.get(key, "Unknown")


def ecog_performance_status(score: int) -> str:
    """Get ECOG performance status description"""
    descriptions = {
        0: "Fully active, able to carry on all pre-disease performance without restriction",
        1: "Restricted in physically strenuous activity but ambulatory and able to carry out work of a light or sedentary nature",
        2: "Ambulatory and capable of all selfcare but unable to carry out any work activities. Up and about more than 50% of waking hours",
        3: "Capable of only limited selfcare, confined to bed or chair more than 50% of waking hours",
        4: "Completely disabled. Cannot carry on any selfcare. Totally confined to bed or chair",
        5: "Dead",
    }
    return descriptions.get(score, "Unknown")


def blood_type_compatibility(donor_type: str, recipient_type: str) -> bool:
    """Check blood type compatibility"""
    compatibility = {
        "O-": {"O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"},
        "O+": {"O+", "A+", "B+", "AB+"},
        "A-": {"A-", "A+", "AB-", "AB+"},
        "A+": {"A+", "AB+"},
        "B-": {"B-", "B+", "AB-", "AB+"},
        "B+": {"B+", "AB+"},
        "AB-": {"AB-", "AB+"},
        "AB+": {"AB+"},
    }
    return recipient_type in compatibility.get(donor_type, set())


# ==================== File Utilities ====================

def get_upload_path(category: str, filename: str, user_id: Optional[str] = None) -> str:
    """Generate organized upload path"""
    date_prefix = datetime.utcnow().strftime("%Y/%m/%d")
    safe_filename = sanitize_filename(filename)
    unique_name = f"{uuid.uuid4().hex[:8]}_{safe_filename}"

    parts = ["uploads", category]
    if user_id:
        parts.append(user_id[:8])
    parts.extend([date_prefix, unique_name])

    return "/".join(parts)


def get_mime_type(filename: str) -> str:
    """Get MIME type of a file"""
    ext = os.path.splitext(filename)[1].lower()
    if ext in MEDICAL_FILE_EXTENSIONS:
        return MEDICAL_FILE_EXTENSIONS[ext]
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "application/octet-stream"


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable form"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 ** 2:
        return f"{size_bytes / 1024:.1f} KB"
    if size_bytes < 1024 ** 3:
        return f"{size_bytes / (1024 ** 2):.1f} MB"
    return f"{size_bytes / (1024 ** 3):.2f} GB"


# ==================== Collection Utilities ====================

def chunk_list(items: List[T], chunk_size: int) -> List[List[T]]:
    """Split a list into chunks"""
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]


def flatten(nested_list: List[List[T]]) -> List[T]:
    """Flatten a nested list"""
    return [item for sublist in nested_list for item in sublist]


def unique_by_key(items: List[Dict], key: str) -> List[Dict]:
    """Get unique items by key"""
    seen = set()
    result = []
    for item in items:
        val = item.get(key)
        if val not in seen:
            seen.add(val)
            result.append(item)
    return result


def group_by(items: List[Dict], key: str) -> Dict[str, List[Dict]]:
    """Group items by a key"""
    groups: Dict[str, List[Dict]] = {}
    for item in items:
        group_key = str(item.get(key, "unknown"))
        if group_key not in groups:
            groups[group_key] = []
        groups[group_key].append(item)
    return groups


def deep_merge(base: Dict, override: Dict) -> Dict:
    """Deep merge two dictionaries"""
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result


# ==================== JSON Utilities ====================

class EnhancedJSONEncoder(json.JSONEncoder):
    """JSON encoder with support for additional types"""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, set):
            return list(obj)
        if isinstance(obj, Enum):
            return obj.value
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, bytes):
            return base64.b64encode(obj).decode()
        if hasattr(obj, '__dict__'):
            return obj.__dict__
        return super().default(obj)


def to_json(data: Any, pretty: bool = False) -> str:
    """Serialize data to JSON"""
    kwargs = {"cls": EnhancedJSONEncoder, "default": str}
    if pretty:
        kwargs["indent"] = 2
    return json.dumps(data, **kwargs)


def from_json(json_str: str) -> Any:
    """Parse JSON string safely"""
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return None


# ==================== Statistics Utilities ====================

def calculate_statistics(values: List[float]) -> Dict[str, float]:
    """Calculate basic statistics for a list of values"""
    if not values:
        return {"count": 0, "mean": 0, "median": 0, "std_dev": 0, "min": 0, "max": 0}

    n = len(values)
    mean = sum(values) / n
    sorted_vals = sorted(values)
    median = sorted_vals[n // 2] if n % 2 else (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2
    variance = sum((x - mean) ** 2 for x in values) / n
    std_dev = math.sqrt(variance)

    return {
        "count": n,
        "mean": round(mean, 4),
        "median": round(median, 4),
        "std_dev": round(std_dev, 4),
        "min": round(min(values), 4),
        "max": round(max(values), 4),
        "sum": round(sum(values), 4),
        "range": round(max(values) - min(values), 4),
    }


def percentile(values: List[float], p: float) -> float:
    """Calculate percentile"""
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    idx = p / 100 * (len(sorted_vals) - 1)
    lower = int(math.floor(idx))
    upper = int(math.ceil(idx))
    if lower == upper:
        return sorted_vals[lower]
    fraction = idx - lower
    return sorted_vals[lower] + (sorted_vals[upper] - sorted_vals[lower]) * fraction


# ==================== Export Utilities ====================

def dict_to_csv_row(data: Dict[str, Any], columns: List[str]) -> str:
    """Convert dict to CSV row"""
    values = []
    for col in columns:
        val = str(data.get(col, ""))
        if "," in val or '"' in val or "\n" in val:
            val = f'"{val.replace(chr(34), chr(34)+chr(34))}"'
        values.append(val)
    return ",".join(values)


def dicts_to_csv(data: List[Dict[str, Any]], columns: Optional[List[str]] = None) -> str:
    """Convert list of dicts to CSV string"""
    if not data:
        return ""
    if not columns:
        columns = list(data[0].keys())
    header = ",".join(columns)
    rows = [dict_to_csv_row(item, columns) for item in data]
    return "\n".join([header] + rows)


# ==================== Exports ====================

__all__ = [
    # String utilities
    "generate_id", "generate_short_id", "generate_medical_record_number",
    "generate_case_number", "slugify", "truncate", "mask_sensitive",
    "sanitize_filename", "normalize_phone", "normalize_email",
    # Validation
    "validate_email", "validate_phone", "validate_ssn",
    "validate_date_of_birth", "validate_icd10_code", "validate_icd10_cancer_code",
    "validate_npi", "validate_password_strength", "validate_file_upload",
    # Encryption
    "hash_password", "verify_password", "generate_token", "generate_otp",
    "encrypt_field", "decrypt_field", "compute_file_hash",
    # Date/Time
    "utcnow", "format_datetime", "parse_datetime", "calculate_age",
    "time_ago", "get_date_range",
    # Pagination
    "PaginationParams", "paginate",
    # Response
    "success_response", "error_response", "list_response",
    # Medical
    "calculate_bmi", "calculate_bsa", "calculate_egfr",
    "cancer_stage_to_numeric", "tnm_stage", "ecog_performance_status",
    "blood_type_compatibility",
    # File
    "get_upload_path", "get_mime_type", "format_file_size",
    # Collection
    "chunk_list", "flatten", "unique_by_key", "group_by", "deep_merge",
    # JSON
    "EnhancedJSONEncoder", "to_json", "from_json",
    # Statistics
    "calculate_statistics", "percentile",
    # Export
    "dict_to_csv_row", "dicts_to_csv",
]
