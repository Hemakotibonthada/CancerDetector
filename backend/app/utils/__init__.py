"""
Backend Utilities - Comprehensive utility functions for the CancerGuard AI platform.
Includes encryption, validation, formatting, caching, file handling, and more.
"""

import asyncio
import base64
import hashlib
import hmac
import json
import logging
import math
import os
import re
import secrets
import string
import time
import uuid
from collections import OrderedDict, defaultdict
from datetime import datetime, timedelta, date
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Type, Union
from dataclasses import dataclass, field
from functools import wraps

logger = logging.getLogger(__name__)


# ============================================================================
# Encryption & Hashing Utilities
# ============================================================================

class EncryptionUtils:
    """Encryption and hashing utilities for sensitive data."""

    SALT_LENGTH = 32
    KEY_LENGTH = 32
    ITERATIONS = 100000

    @staticmethod
    def generate_salt() -> str:
        return secrets.token_hex(EncryptionUtils.SALT_LENGTH)

    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
        if salt is None:
            salt = EncryptionUtils.generate_salt()
        key = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), salt.encode(),
            EncryptionUtils.ITERATIONS, dklen=EncryptionUtils.KEY_LENGTH,
        )
        return key.hex(), salt

    @staticmethod
    def verify_password(password: str, hash_value: str, salt: str) -> bool:
        computed_hash, _ = EncryptionUtils.hash_password(password, salt)
        return hmac.compare_digest(computed_hash, hash_value)

    @staticmethod
    def hash_data(data: str, algorithm: str = "sha256") -> str:
        h = hashlib.new(algorithm)
        h.update(data.encode())
        return h.hexdigest()

    @staticmethod
    def generate_token(length: int = 32) -> str:
        return secrets.token_urlsafe(length)

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        return "".join(secrets.choice(string.digits) for _ in range(length))

    @staticmethod
    def mask_sensitive(data: str, visible_chars: int = 4, mask_char: str = "*") -> str:
        if len(data) <= visible_chars:
            return mask_char * len(data)
        return mask_char * (len(data) - visible_chars) + data[-visible_chars:]

    @staticmethod
    def mask_email(email: str) -> str:
        parts = email.split("@")
        if len(parts) != 2:
            return "***@***"
        username = parts[0]
        domain = parts[1]
        if len(username) <= 2:
            masked_user = "*" * len(username)
        else:
            masked_user = username[0] + "*" * (len(username) - 2) + username[-1]
        return f"{masked_user}@{domain}"

    @staticmethod
    def mask_phone(phone: str) -> str:
        digits = re.sub(r'\D', '', phone)
        if len(digits) < 4:
            return "***"
        return "*" * (len(digits) - 4) + digits[-4:]

    @staticmethod
    def mask_ssn(ssn: str) -> str:
        digits = re.sub(r'\D', '', ssn)
        if len(digits) < 4:
            return "***-**-****"
        return f"***-**-{digits[-4:]}"

    @staticmethod
    def encode_base64(data: str) -> str:
        return base64.b64encode(data.encode()).decode()

    @staticmethod
    def decode_base64(encoded: str) -> str:
        return base64.b64decode(encoded.encode()).decode()

    @staticmethod
    def generate_api_key() -> str:
        return f"cgai_{secrets.token_urlsafe(32)}"

    @staticmethod
    def checksum_file(filepath: str, algorithm: str = "sha256", chunk_size: int = 8192) -> str:
        h = hashlib.new(algorithm)
        with open(filepath, "rb") as f:
            while chunk := f.read(chunk_size):
                h.update(chunk)
        return h.hexdigest()


# ============================================================================
# Validation Utilities
# ============================================================================

class ValidationUtils:
    """Comprehensive input validation utilities."""

    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    PHONE_PATTERN = re.compile(r'^\+?1?\d{10,15}$')
    SSN_PATTERN = re.compile(r'^\d{3}-?\d{2}-?\d{4}$')
    ZIP_PATTERN = re.compile(r'^\d{5}(-\d{4})?$')
    MRN_PATTERN = re.compile(r'^MRN-\d{6,10}$')
    ICD10_PATTERN = re.compile(r'^[A-Z]\d{2}(\.\d{1,4})?$')
    CPT_PATTERN = re.compile(r'^\d{5}$')
    NPI_PATTERN = re.compile(r'^\d{10}$')
    DEA_PATTERN = re.compile(r'^[A-Z]{2}\d{7}$')
    DATE_PATTERN = re.compile(r'^\d{4}-\d{2}-\d{2}$')

    @classmethod
    def validate_email(cls, email: str) -> Tuple[bool, str]:
        if not email:
            return False, "Email is required"
        if len(email) > 254:
            return False, "Email too long"
        if not cls.EMAIL_PATTERN.match(email):
            return False, "Invalid email format"
        return True, ""

    @classmethod
    def validate_phone(cls, phone: str) -> Tuple[bool, str]:
        cleaned = re.sub(r'[\s\-\(\)]', '', phone)
        if not cls.PHONE_PATTERN.match(cleaned):
            return False, "Invalid phone number"
        return True, ""

    @classmethod
    def validate_password(cls, password: str) -> Tuple[bool, List[str]]:
        errors = []
        if len(password) < 8:
            errors.append("Must be at least 8 characters")
        if len(password) > 128:
            errors.append("Must be less than 128 characters")
        if not re.search(r'[A-Z]', password):
            errors.append("Must contain an uppercase letter")
        if not re.search(r'[a-z]', password):
            errors.append("Must contain a lowercase letter")
        if not re.search(r'\d', password):
            errors.append("Must contain a digit")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Must contain a special character")
        return len(errors) == 0, errors

    @classmethod
    def validate_date(cls, date_str: str) -> Tuple[bool, str]:
        if not cls.DATE_PATTERN.match(date_str):
            return False, "Invalid date format (YYYY-MM-DD)"
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
            return True, ""
        except ValueError:
            return False, "Invalid date"

    @classmethod
    def validate_date_range(cls, start: str, end: str, max_days: int = 365) -> Tuple[bool, str]:
        valid_start, err = cls.validate_date(start)
        if not valid_start:
            return False, f"Start date: {err}"
        valid_end, err = cls.validate_date(end)
        if not valid_end:
            return False, f"End date: {err}"

        start_dt = datetime.strptime(start, "%Y-%m-%d")
        end_dt = datetime.strptime(end, "%Y-%m-%d")

        if start_dt > end_dt:
            return False, "Start date must be before end date"
        if (end_dt - start_dt).days > max_days:
            return False, f"Date range exceeds {max_days} days"
        return True, ""

    @classmethod
    def validate_ssn(cls, ssn: str) -> Tuple[bool, str]:
        if not cls.SSN_PATTERN.match(ssn):
            return False, "Invalid SSN format"
        return True, ""

    @classmethod
    def validate_mrn(cls, mrn: str) -> Tuple[bool, str]:
        if not cls.MRN_PATTERN.match(mrn):
            return False, "Invalid MRN format (MRN-XXXXXX)"
        return True, ""

    @classmethod
    def validate_icd10(cls, code: str) -> Tuple[bool, str]:
        if not cls.ICD10_PATTERN.match(code):
            return False, "Invalid ICD-10 code format"
        return True, ""

    @classmethod
    def validate_npi(cls, npi: str) -> Tuple[bool, str]:
        if not cls.NPI_PATTERN.match(npi):
            return False, "Invalid NPI format (10 digits)"
        # Luhn algorithm check
        digits = [int(d) for d in npi]
        checksum = 0
        for i, d in enumerate(reversed(digits)):
            if i % 2 == 1:
                d *= 2
                if d > 9:
                    d -= 9
            checksum += d
        if checksum % 10 != 0:
            return False, "Invalid NPI checksum"
        return True, ""

    @classmethod
    def validate_blood_type(cls, blood_type: str) -> Tuple[bool, str]:
        valid_types = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
        if blood_type not in valid_types:
            return False, f"Invalid blood type. Must be one of: {', '.join(sorted(valid_types))}"
        return True, ""

    @classmethod
    def validate_age(cls, age: int) -> Tuple[bool, str]:
        if not isinstance(age, int) or age < 0 or age > 150:
            return False, "Age must be between 0 and 150"
        return True, ""

    @classmethod
    def validate_bmi(cls, weight_kg: float, height_m: float) -> Tuple[bool, str, float]:
        if weight_kg <= 0 or weight_kg > 500:
            return False, "Invalid weight", 0
        if height_m <= 0 or height_m > 3:
            return False, "Invalid height", 0
        bmi = weight_kg / (height_m ** 2)
        return True, "", round(bmi, 1)

    @classmethod
    def sanitize_html(cls, text: str) -> str:
        """Remove HTML tags from text."""
        return re.sub(r'<[^>]+>', '', text)

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Sanitize a filename to prevent path traversal."""
        # Remove path separators and null bytes
        filename = re.sub(r'[/\\:\0]', '', filename)
        # Remove leading dots
        filename = filename.lstrip('.')
        # Limit length
        name, ext = os.path.splitext(filename)
        if len(name) > 200:
            name = name[:200]
        return name + ext


# ============================================================================
# Formatting Utilities
# ============================================================================

class FormatUtils:
    """Formatting utilities for medical and general data."""

    @staticmethod
    def format_date(dt: Union[datetime, date, str], format_str: str = "%B %d, %Y") -> str:
        if isinstance(dt, str):
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        return dt.strftime(format_str)

    @staticmethod
    def format_datetime(dt: Union[datetime, str], format_str: str = "%B %d, %Y at %I:%M %p") -> str:
        if isinstance(dt, str):
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        return dt.strftime(format_str)

    @staticmethod
    def format_relative_time(dt: Union[datetime, str]) -> str:
        if isinstance(dt, str):
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))

        now = datetime.utcnow()
        diff = now - dt

        if diff.total_seconds() < 60:
            return "just now"
        if diff.total_seconds() < 3600:
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        if diff.total_seconds() < 86400:
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        if diff.days < 30:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        if diff.days < 365:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        years = diff.days // 365
        return f"{years} year{'s' if years > 1 else ''} ago"

    @staticmethod
    def format_age(dob: Union[datetime, date, str]) -> str:
        if isinstance(dob, str):
            dob = datetime.strptime(dob, "%Y-%m-%d").date()
        if isinstance(dob, datetime):
            dob = dob.date()

        today = date.today()
        years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return f"{years} years"

    @staticmethod
    def calculate_age(dob: Union[datetime, date, str]) -> int:
        if isinstance(dob, str):
            dob = datetime.strptime(dob, "%Y-%m-%d").date()
        if isinstance(dob, datetime):
            dob = dob.date()
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    @staticmethod
    def format_name(first: str, last: str, middle: str = "", title: str = "", suffix: str = "") -> str:
        parts = []
        if title:
            parts.append(title)
        parts.append(first)
        if middle:
            parts.append(middle[0] + ".")
        parts.append(last)
        if suffix:
            parts.append(suffix)
        return " ".join(parts)

    @staticmethod
    def format_currency(amount: float, currency: str = "USD") -> str:
        symbols = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹"}
        symbol = symbols.get(currency, currency + " ")
        return f"{symbol}{amount:,.2f}"

    @staticmethod
    def format_percentage(value: float, decimals: int = 1) -> str:
        return f"{value * 100:.{decimals}f}%" if value <= 1 else f"{value:.{decimals}f}%"

    @staticmethod
    def format_file_size(bytes_count: int) -> str:
        if bytes_count == 0:
            return "0 B"
        units = ["B", "KB", "MB", "GB", "TB"]
        i = int(math.floor(math.log(bytes_count, 1024)))
        size = round(bytes_count / (1024 ** i), 2)
        return f"{size} {units[i]}"

    @staticmethod
    def format_blood_pressure(systolic: int, diastolic: int) -> str:
        return f"{systolic}/{diastolic} mmHg"

    @staticmethod
    def format_temperature(value: float, unit: str = "F") -> str:
        if unit == "C":
            return f"{value:.1f}°C"
        return f"{value:.1f}°F"

    @staticmethod
    def format_weight(value: float, unit: str = "lbs") -> str:
        if unit == "kg":
            return f"{value:.1f} kg"
        return f"{value:.1f} lbs"

    @staticmethod
    def format_height(inches: int) -> str:
        feet = inches // 12
        remaining = inches % 12
        return f"{feet}'{remaining}\""

    @staticmethod
    def format_bmi(bmi: float) -> Tuple[str, str]:
        if bmi < 18.5:
            return f"{bmi:.1f}", "Underweight"
        elif bmi < 25:
            return f"{bmi:.1f}", "Normal"
        elif bmi < 30:
            return f"{bmi:.1f}", "Overweight"
        elif bmi < 35:
            return f"{bmi:.1f}", "Obese Class I"
        elif bmi < 40:
            return f"{bmi:.1f}", "Obese Class II"
        else:
            return f"{bmi:.1f}", "Obese Class III"

    @staticmethod
    def format_phone(phone: str) -> str:
        digits = re.sub(r'\D', '', phone)
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11 and digits[0] == "1":
            return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
        return phone

    @staticmethod
    def format_mrn(patient_id: int) -> str:
        return f"MRN-{patient_id:06d}"

    @staticmethod
    def format_duration(minutes: int) -> str:
        if minutes < 60:
            return f"{minutes}min"
        hours = minutes // 60
        mins = minutes % 60
        if mins == 0:
            return f"{hours}h"
        return f"{hours}h {mins}min"


# ============================================================================
# Caching Utilities
# ============================================================================

class LRUCache:
    """Thread-safe LRU cache implementation."""

    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self._cache: OrderedDict = OrderedDict()
        self._max_size = max_size
        self._default_ttl = default_ttl
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            self._misses += 1
            return None

        value, expires_at = self._cache[key]
        if expires_at and time.time() > expires_at:
            del self._cache[key]
            self._misses += 1
            return None

        # Move to end (most recently used)
        self._cache.move_to_end(key)
        self._hits += 1
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        if key in self._cache:
            del self._cache[key]

        ttl = ttl or self._default_ttl
        expires_at = time.time() + ttl if ttl > 0 else None
        self._cache[key] = (value, expires_at)

        # Evict if over capacity
        while len(self._cache) > self._max_size:
            self._cache.popitem(last=False)

    def delete(self, key: str) -> bool:
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clear(self):
        self._cache.clear()
        self._hits = 0
        self._misses = 0

    def get_stats(self) -> Dict[str, Any]:
        total = self._hits + self._misses
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / max(total, 1) * 100, 1),
        }


def cached(cache: LRUCache, key_fn: Optional[Callable] = None, ttl: int = 300):
    """Decorator for caching function results."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            if key_fn:
                cache_key = key_fn(*args, **kwargs)
            else:
                cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            result = cache.get(cache_key)
            if result is not None:
                return result

            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)

            cache.set(cache_key, result, ttl)
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            if key_fn:
                cache_key = key_fn(*args, **kwargs)
            else:
                cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            result = cache.get(cache_key)
            if result is not None:
                return result

            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator


# ============================================================================
# File Handling Utilities
# ============================================================================

class FileUtils:
    """File handling utilities."""

    ALLOWED_IMAGE_TYPES = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp", ".dcm"}
    ALLOWED_DOCUMENT_TYPES = {".pdf", ".doc", ".docx", ".txt", ".csv", ".xlsx", ".xls"}
    ALLOWED_MEDICAL_TYPES = {".dcm", ".nii", ".nii.gz", ".mha", ".mhd"}
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

    @classmethod
    def validate_file(cls, filename: str, size_bytes: int, allowed_types: Optional[Set[str]] = None) -> Tuple[bool, str]:
        if size_bytes > cls.MAX_FILE_SIZE:
            return False, f"File too large. Maximum size is {FormatUtils.format_file_size(cls.MAX_FILE_SIZE)}"

        ext = os.path.splitext(filename)[1].lower()
        allowed = allowed_types or (cls.ALLOWED_IMAGE_TYPES | cls.ALLOWED_DOCUMENT_TYPES)
        if ext not in allowed:
            return False, f"File type {ext} not allowed"

        return True, ""

    @classmethod
    def get_content_type(cls, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower()
        content_types = {
            ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
            ".gif": "image/gif", ".bmp": "image/bmp", ".tiff": "image/tiff",
            ".webp": "image/webp", ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".csv": "text/csv", ".txt": "text/plain",
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".json": "application/json", ".dcm": "application/dicom",
        }
        return content_types.get(ext, "application/octet-stream")

    @staticmethod
    def generate_unique_filename(original: str) -> str:
        ext = os.path.splitext(original)[1]
        unique_id = uuid.uuid4().hex[:12]
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', os.path.splitext(original)[0])[:50]
        return f"{safe_name}_{timestamp}_{unique_id}{ext}"

    @staticmethod
    def ensure_directory(path: str):
        os.makedirs(path, exist_ok=True)

    @staticmethod
    def get_upload_path(category: str, filename: str) -> str:
        date_path = datetime.utcnow().strftime("%Y/%m")
        return os.path.join("uploads", category, date_path, filename)


# ============================================================================
# Pagination Utilities
# ============================================================================

@dataclass
class PaginationParams:
    """Pagination parameters."""
    page: int = 1
    page_size: int = 20
    sort_by: str = "created_at"
    sort_order: str = "desc"

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size

    def validate(self, max_page_size: int = 100) -> "PaginationParams":
        self.page = max(1, self.page)
        self.page_size = max(1, min(self.page_size, max_page_size))
        self.sort_order = "asc" if self.sort_order.lower() == "asc" else "desc"
        return self


@dataclass
class PaginatedResponse:
    """Paginated response."""
    items: List[Any]
    total: int
    page: int
    page_size: int

    @property
    def total_pages(self) -> int:
        return math.ceil(self.total / max(self.page_size, 1))

    @property
    def has_next(self) -> bool:
        return self.page < self.total_pages

    @property
    def has_previous(self) -> bool:
        return self.page > 1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "items": self.items,
            "pagination": {
                "total": self.total,
                "page": self.page,
                "page_size": self.page_size,
                "total_pages": self.total_pages,
                "has_next": self.has_next,
                "has_previous": self.has_previous,
            },
        }


# ============================================================================
# Medical-Specific Utilities
# ============================================================================

class MedicalUtils:
    """Medical-specific utility functions."""

    # BMI Calculator
    @staticmethod
    def calculate_bmi(weight_kg: float, height_m: float) -> float:
        if height_m <= 0:
            return 0
        return round(weight_kg / (height_m ** 2), 1)

    @staticmethod
    def bmi_category(bmi: float) -> str:
        if bmi < 18.5:
            return "Underweight"
        elif bmi < 25:
            return "Normal"
        elif bmi < 30:
            return "Overweight"
        elif bmi < 35:
            return "Obese I"
        elif bmi < 40:
            return "Obese II"
        return "Obese III"

    # BSA (Body Surface Area) - Mosteller formula
    @staticmethod
    def calculate_bsa(weight_kg: float, height_cm: float) -> float:
        return round(math.sqrt((weight_kg * height_cm) / 3600), 2)

    # eGFR (Estimated Glomerular Filtration Rate) - CKD-EPI
    @staticmethod
    def calculate_egfr(creatinine: float, age: int, is_female: bool, is_black: bool = False) -> float:
        if is_female:
            if creatinine <= 0.7:
                egfr = 144 * (creatinine / 0.7) ** -0.329 * 0.993 ** age
            else:
                egfr = 144 * (creatinine / 0.7) ** -1.209 * 0.993 ** age
        else:
            if creatinine <= 0.9:
                egfr = 141 * (creatinine / 0.9) ** -0.411 * 0.993 ** age
            else:
                egfr = 141 * (creatinine / 0.9) ** -1.209 * 0.993 ** age

        if is_black:
            egfr *= 1.159

        return round(egfr, 1)

    @staticmethod
    def egfr_stage(egfr: float) -> Tuple[str, str]:
        stages = [
            (90, "G1", "Normal or high"),
            (60, "G2", "Mildly decreased"),
            (45, "G3a", "Mildly to moderately decreased"),
            (30, "G3b", "Moderately to severely decreased"),
            (15, "G4", "Severely decreased"),
            (0, "G5", "Kidney failure"),
        ]
        for threshold, stage, desc in stages:
            if egfr >= threshold:
                return stage, desc
        return "G5", "Kidney failure"

    # MAP (Mean Arterial Pressure)
    @staticmethod
    def calculate_map(systolic: int, diastolic: int) -> float:
        return round(diastolic + (systolic - diastolic) / 3, 1)

    # Blood pressure classification
    @staticmethod
    def classify_blood_pressure(systolic: int, diastolic: int) -> str:
        if systolic < 120 and diastolic < 80:
            return "Normal"
        elif systolic < 130 and diastolic < 80:
            return "Elevated"
        elif systolic < 140 or diastolic < 90:
            return "Stage 1 Hypertension"
        elif systolic >= 140 or diastolic >= 90:
            return "Stage 2 Hypertension"
        if systolic > 180 or diastolic > 120:
            return "Hypertensive Crisis"
        return "Unknown"

    # NEWS2 Score (National Early Warning Score)
    @staticmethod
    def calculate_news2(
        respiratory_rate: int,
        oxygen_saturation: int,
        supplemental_oxygen: bool,
        temperature: float,
        systolic_bp: int,
        heart_rate: int,
        consciousness: str = "alert",
    ) -> int:
        score = 0

        # Respiratory rate
        if respiratory_rate <= 8:
            score += 3
        elif respiratory_rate <= 11:
            score += 1
        elif respiratory_rate <= 20:
            score += 0
        elif respiratory_rate <= 24:
            score += 2
        else:
            score += 3

        # SpO2
        if oxygen_saturation <= 91:
            score += 3
        elif oxygen_saturation <= 93:
            score += 2
        elif oxygen_saturation <= 95:
            score += 1

        # Supplemental oxygen
        if supplemental_oxygen:
            score += 2

        # Temperature (Celsius)
        if temperature <= 35.0:
            score += 3
        elif temperature <= 36.0:
            score += 1
        elif temperature <= 38.0:
            score += 0
        elif temperature <= 39.0:
            score += 1
        else:
            score += 2

        # Systolic BP
        if systolic_bp <= 90:
            score += 3
        elif systolic_bp <= 100:
            score += 2
        elif systolic_bp <= 110:
            score += 1
        elif systolic_bp <= 219:
            score += 0
        else:
            score += 3

        # Heart rate
        if heart_rate <= 40:
            score += 3
        elif heart_rate <= 50:
            score += 1
        elif heart_rate <= 90:
            score += 0
        elif heart_rate <= 110:
            score += 1
        elif heart_rate <= 130:
            score += 2
        else:
            score += 3

        # Consciousness
        if consciousness.lower() != "alert":
            score += 3

        return score

    @staticmethod
    def news2_risk(score: int) -> Tuple[str, str]:
        if score <= 4:
            return "Low", "Continue routine monitoring"
        elif score <= 6:
            return "Medium", "Increase monitoring frequency, inform medical team"
        else:
            return "High", "Continuous monitoring, urgent clinical review required"

    # Corrected calcium
    @staticmethod
    def corrected_calcium(calcium: float, albumin: float) -> float:
        return round(calcium + 0.8 * (4.0 - albumin), 1)

    # Anion gap
    @staticmethod
    def calculate_anion_gap(sodium: float, chloride: float, bicarbonate: float) -> float:
        return round(sodium - (chloride + bicarbonate), 1)

    # Framingham Risk Score (simplified)
    @staticmethod
    def framingham_risk_score(
        age: int, total_cholesterol: int, hdl: int,
        systolic_bp: int, is_smoker: bool, is_diabetic: bool,
        is_male: bool, on_bp_treatment: bool = False,
    ) -> float:
        score = 0
        if is_male:
            if age >= 70:
                score += 13
            elif age >= 60:
                score += 11
            elif age >= 55:
                score += 10
            elif age >= 50:
                score += 8
            elif age >= 45:
                score += 6
            elif age >= 40:
                score += 3
            else:
                score += 0
        else:
            if age >= 70:
                score += 16
            elif age >= 60:
                score += 13
            elif age >= 55:
                score += 11
            elif age >= 50:
                score += 8
            elif age >= 45:
                score += 5
            elif age >= 40:
                score += 3
            else:
                score += 0

        if total_cholesterol >= 280:
            score += 3
        elif total_cholesterol >= 240:
            score += 2
        elif total_cholesterol >= 200:
            score += 1

        if hdl < 35:
            score += 2
        elif hdl < 45:
            score += 1
        elif hdl >= 60:
            score -= 1

        if on_bp_treatment:
            if systolic_bp >= 160:
                score += 3
            elif systolic_bp >= 140:
                score += 2
            elif systolic_bp >= 130:
                score += 1
        else:
            if systolic_bp >= 160:
                score += 2
            elif systolic_bp >= 140:
                score += 1

        if is_smoker:
            score += 2
        if is_diabetic:
            score += 2 if is_male else 3

        # Convert score to estimated 10-year risk
        risk = max(0, min(score * 1.5, 30))
        return round(risk, 1)


# ============================================================================
# ID Generation Utilities
# ============================================================================

class IDGenerator:
    """Various ID generation utilities."""

    @staticmethod
    def uuid4() -> str:
        return str(uuid.uuid4())

    @staticmethod
    def short_id(length: int = 8) -> str:
        return secrets.token_urlsafe(length)[:length]

    @staticmethod
    def sequential_id(prefix: str, counter: int, padding: int = 6) -> str:
        return f"{prefix}-{counter:0{padding}d}"

    @staticmethod
    def patient_mrn(patient_id: int) -> str:
        return f"MRN-{patient_id:06d}"

    @staticmethod
    def encounter_id() -> str:
        date_str = datetime.utcnow().strftime("%Y%m%d")
        random_part = secrets.token_hex(4).upper()
        return f"ENC-{date_str}-{random_part}"

    @staticmethod
    def order_id(order_type: str = "LAB") -> str:
        date_str = datetime.utcnow().strftime("%Y%m%d%H%M")
        random_part = secrets.token_hex(3).upper()
        return f"{order_type}-{date_str}-{random_part}"

    @staticmethod
    def invoice_id() -> str:
        date_str = datetime.utcnow().strftime("%Y%m")
        random_part = secrets.token_hex(4).upper()
        return f"INV-{date_str}-{random_part}"


# ============================================================================
# Global instances
# ============================================================================

encryption = EncryptionUtils()
validation = ValidationUtils()
formatting = FormatUtils()
medical = MedicalUtils()
file_utils = FileUtils()
id_generator = IDGenerator()
app_cache = LRUCache(max_size=5000, default_ttl=600)
