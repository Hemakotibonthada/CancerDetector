"""Isolated SQLite for API tests. Must run before the application is imported."""
import os
import tempfile
from pathlib import Path

_tmp = tempfile.mkdtemp(prefix="cancerguard-test-")
os.environ["DB_USE_SQLITE"] = "true"
os.environ["DB_SQLITE_PATH"] = str(Path(_tmp) / "test.db")
os.environ.pop("DATABASE_URL", None)
os.environ["ENVIRONMENT"] = "testing"
os.environ["AUTH_SECRET_KEY"] = "test-secret-key-for-unit-tests"
os.environ.pop("SEED_DEMO_DATA", None)

from app.config import reset_settings

reset_settings()
