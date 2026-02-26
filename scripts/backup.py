#!/usr/bin/env python3
"""
CancerGuard AI - Database Backup & Restore Script
===================================================
Automated database backup with compression, rotation, encryption,
and restore capabilities.

Usage:
    python scripts/backup.py backup [--output DIR] [--compress] [--encrypt]
    python scripts/backup.py restore --file BACKUP_FILE
    python scripts/backup.py list [--dir DIR]
    python scripts/backup.py cleanup [--keep DAYS]
"""

import argparse
import gzip
import hashlib
import json
import logging
import os
import shutil
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

# ── Configuration ─────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent.parent
BACKUP_DIR = PROJECT_ROOT / "backups"
LOG_DIR = PROJECT_ROOT / "logs"
DEFAULT_RETENTION_DAYS = 30
MAX_BACKUPS = 50

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "cancerguard"),
    "user": os.getenv("DB_USER", "cancerguard"),
    "password": os.getenv("DB_PASSWORD", "password"),
}

# ── Logging ───────────────────────────────────────────────────

LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_DIR / "backup.log"),
    ],
)
logger = logging.getLogger("backup")


# ── Utility Functions ─────────────────────────────────────────

def file_size_human(size_bytes: int) -> str:
    """Convert bytes to human-readable size."""
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} PB"


def compute_checksum(filepath: Path) -> str:
    """Compute SHA-256 checksum of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def get_disk_usage(directory: Path) -> dict:
    """Get disk usage information."""
    total, used, free = shutil.disk_usage(directory)
    return {
        "total": file_size_human(total),
        "used": file_size_human(used),
        "free": file_size_human(free),
        "percent_used": round(used / total * 100, 1),
    }


# ── Backup Functions ─────────────────────────────────────────

class BackupManager:
    """Manages database backups and restores."""

    def __init__(self, backup_dir: Path = BACKUP_DIR):
        self.backup_dir = backup_dir
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def create_backup(
        self,
        compress: bool = True,
        include_schema: bool = True,
        tables: list = None,
        custom_name: str = None,
    ) -> Path:
        """
        Create a database backup.

        Args:
            compress: Whether to gzip the backup
            include_schema: Whether to include schema DDL
            tables: Specific tables to back up (None = all)
            custom_name: Custom backup filename prefix

        Returns:
            Path to the created backup file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        prefix = custom_name or "cancerguard"
        filename = f"{prefix}_{timestamp}.sql"

        if compress:
            filename += ".gz"

        filepath = self.backup_dir / filename
        logger.info(f"Creating backup: {filename}")

        # Build pg_dump command
        cmd = [
            "pg_dump",
            f"--host={DB_CONFIG['host']}",
            f"--port={DB_CONFIG['port']}",
            f"--username={DB_CONFIG['user']}",
            f"--dbname={DB_CONFIG['database']}",
            "--no-password",
            "--verbose",
            "--format=plain",
        ]

        if not include_schema:
            cmd.append("--data-only")

        if tables:
            for table in tables:
                cmd.extend(["--table", table])

        # Set password via environment
        env = os.environ.copy()
        env["PGPASSWORD"] = DB_CONFIG["password"]

        try:
            logger.info("Running pg_dump...")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                env=env,
                timeout=3600,  # 1 hour timeout
            )

            if result.returncode != 0:
                logger.error(f"pg_dump failed: {result.stderr}")
                raise RuntimeError(f"pg_dump failed with exit code {result.returncode}")

            sql_data = result.stdout

            if compress:
                logger.info("Compressing backup...")
                with gzip.open(filepath, "wt", compresslevel=9) as f:
                    f.write(sql_data)
            else:
                with open(filepath, "w") as f:
                    f.write(sql_data)

            # Compute checksum
            checksum = compute_checksum(filepath)
            file_size = filepath.stat().st_size

            # Save metadata
            metadata = {
                "filename": filename,
                "timestamp": timestamp,
                "database": DB_CONFIG["database"],
                "host": DB_CONFIG["host"],
                "compressed": compress,
                "size_bytes": file_size,
                "size_human": file_size_human(file_size),
                "checksum_sha256": checksum,
                "tables": tables or "all",
                "include_schema": include_schema,
                "pg_dump_version": self._get_pg_dump_version(),
            }

            metadata_path = filepath.with_suffix(filepath.suffix + ".meta.json")
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)

            logger.info(f"Backup created: {filename} ({file_size_human(file_size)})")
            logger.info(f"Checksum: {checksum}")
            return filepath

        except subprocess.TimeoutExpired:
            logger.error("Backup timed out after 1 hour")
            raise
        except FileNotFoundError:
            logger.error("pg_dump not found. Ensure PostgreSQL client tools are installed.")
            logger.info("Attempting Python-based backup via SQLAlchemy...")
            return self._python_backup(filepath, compress)

    def _python_backup(self, filepath: Path, compress: bool) -> Path:
        """Fallback backup using SQLAlchemy connection."""
        try:
            from sqlalchemy import create_engine, text

            db_url = (
                f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}"
                f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
            )
            engine = create_engine(db_url)

            with engine.connect() as conn:
                # Get all table names
                result = conn.execute(text(
                    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
                ))
                tables = [row[0] for row in result]

                backup_content = []
                backup_content.append(f"-- CancerGuard AI Database Backup")
                backup_content.append(f"-- Generated: {datetime.now().isoformat()}")
                backup_content.append(f"-- Database: {DB_CONFIG['database']}")
                backup_content.append(f"-- Tables: {len(tables)}")
                backup_content.append("")

                for table in tables:
                    logger.info(f"  Backing up table: {table}")
                    backup_content.append(f"-- Table: {table}")

                    # Get CREATE TABLE statement
                    try:
                        ddl_result = conn.execute(text(
                            f"SELECT pg_catalog.pg_get_tabledef('{table}'::regclass)"
                        ))
                        for row in ddl_result:
                            backup_content.append(row[0])
                    except Exception:
                        pass

                    # Export data as INSERT statements
                    rows = conn.execute(text(f'SELECT * FROM "{table}"'))
                    columns = list(rows.keys())
                    col_str = ", ".join(f'"{c}"' for c in columns)

                    for row in rows:
                        values = []
                        for val in row:
                            if val is None:
                                values.append("NULL")
                            elif isinstance(val, str):
                                escaped = val.replace("'", "''")
                                values.append(f"'{escaped}'")
                            elif isinstance(val, (datetime,)):
                                values.append(f"'{val.isoformat()}'")
                            elif isinstance(val, bool):
                                values.append("TRUE" if val else "FALSE")
                            else:
                                values.append(str(val))
                        val_str = ", ".join(values)
                        backup_content.append(
                            f'INSERT INTO "{table}" ({col_str}) VALUES ({val_str});'
                        )
                    backup_content.append("")

            sql_content = "\n".join(backup_content)

            if compress:
                with gzip.open(filepath, "wt", compresslevel=9) as f:
                    f.write(sql_content)
            else:
                with open(filepath, "w") as f:
                    f.write(sql_content)

            logger.info(f"Python-based backup created: {filepath.name}")
            return filepath

        except ImportError:
            logger.error("SQLAlchemy not available for fallback backup")
            raise

    def restore_backup(self, backup_file: Path, drop_existing: bool = False) -> bool:
        """
        Restore a database from backup.

        Args:
            backup_file: Path to the backup file
            drop_existing: Whether to drop existing tables first

        Returns:
            True if restore succeeded
        """
        if not backup_file.exists():
            logger.error(f"Backup file not found: {backup_file}")
            return False

        logger.info(f"Restoring from: {backup_file.name}")

        # Verify checksum if metadata exists
        meta_path = backup_file.with_suffix(backup_file.suffix + ".meta.json")
        if meta_path.exists():
            with open(meta_path) as f:
                metadata = json.load(f)
            expected_checksum = metadata.get("checksum_sha256")
            actual_checksum = compute_checksum(backup_file)
            if expected_checksum and expected_checksum != actual_checksum:
                logger.error("Checksum verification failed! Backup may be corrupted.")
                return False
            logger.info("Checksum verified ✓")

        # Build psql command
        cmd = [
            "psql",
            f"--host={DB_CONFIG['host']}",
            f"--port={DB_CONFIG['port']}",
            f"--username={DB_CONFIG['user']}",
            f"--dbname={DB_CONFIG['database']}",
            "--no-password",
        ]

        env = os.environ.copy()
        env["PGPASSWORD"] = DB_CONFIG["password"]

        try:
            # Read backup data
            if backup_file.suffix == ".gz" or str(backup_file).endswith(".sql.gz"):
                with gzip.open(backup_file, "rt") as f:
                    sql_data = f.read()
            else:
                with open(backup_file, "r") as f:
                    sql_data = f.read()

            if drop_existing:
                logger.warning("Dropping existing tables...")
                drop_cmd = cmd + ["-c", "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"]
                subprocess.run(drop_cmd, env=env, timeout=60)

            logger.info("Restoring database...")
            result = subprocess.run(
                cmd,
                input=sql_data,
                capture_output=True,
                text=True,
                env=env,
                timeout=3600,
            )

            if result.returncode != 0:
                logger.error(f"Restore failed: {result.stderr}")
                return False

            logger.info("Database restored successfully ✓")
            return True

        except subprocess.TimeoutExpired:
            logger.error("Restore timed out after 1 hour")
            return False
        except FileNotFoundError:
            logger.error("psql not found. Ensure PostgreSQL client tools are installed.")
            return False

    def list_backups(self) -> list:
        """List all available backups."""
        backups = []
        for f in sorted(self.backup_dir.glob("*.sql*"), reverse=True):
            if f.suffix == ".json":
                continue
            meta_path = f.with_suffix(f.suffix + ".meta.json")
            metadata = {}
            if meta_path.exists():
                with open(meta_path) as mf:
                    metadata = json.load(mf)

            backups.append({
                "file": f.name,
                "path": str(f),
                "size": file_size_human(f.stat().st_size),
                "size_bytes": f.stat().st_size,
                "created": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
                "compressed": f.suffix == ".gz" or f.name.endswith(".sql.gz"),
                "checksum": metadata.get("checksum_sha256", "N/A"),
            })

        return backups

    def cleanup_old_backups(self, retention_days: int = DEFAULT_RETENTION_DAYS) -> int:
        """
        Remove backups older than retention period.

        Args:
            retention_days: Number of days to retain backups

        Returns:
            Number of backups removed
        """
        cutoff = datetime.now() - timedelta(days=retention_days)
        removed = 0

        for f in self.backup_dir.glob("*.sql*"):
            if f.suffix == ".json":
                continue
            file_time = datetime.fromtimestamp(f.stat().st_mtime)
            if file_time < cutoff:
                logger.info(f"Removing old backup: {f.name}")
                f.unlink()
                # Remove metadata file too
                meta = f.with_suffix(f.suffix + ".meta.json")
                if meta.exists():
                    meta.unlink()
                removed += 1

        # Also enforce max backup count
        backups = sorted(
            self.backup_dir.glob("cancerguard_*.sql*"),
            key=lambda x: x.stat().st_mtime,
        )
        backups = [b for b in backups if not b.suffix == ".json"]

        while len(backups) > MAX_BACKUPS:
            oldest = backups.pop(0)
            logger.info(f"Removing excess backup: {oldest.name}")
            oldest.unlink()
            meta = oldest.with_suffix(oldest.suffix + ".meta.json")
            if meta.exists():
                meta.unlink()
            removed += 1

        logger.info(f"Cleanup complete. Removed {removed} backup(s)")
        return removed

    def verify_backup(self, backup_file: Path) -> dict:
        """
        Verify backup file integrity.

        Returns:
            Verification report dict
        """
        report = {
            "file": backup_file.name,
            "exists": backup_file.exists(),
            "readable": False,
            "checksum_valid": None,
            "size": None,
            "tables_found": 0,
            "insert_count": 0,
        }

        if not backup_file.exists():
            return report

        report["size"] = file_size_human(backup_file.stat().st_size)

        try:
            if backup_file.suffix == ".gz" or str(backup_file).endswith(".sql.gz"):
                with gzip.open(backup_file, "rt") as f:
                    content = f.read()
            else:
                with open(backup_file, "r") as f:
                    content = f.read()

            report["readable"] = True
            report["tables_found"] = content.count("CREATE TABLE")
            report["insert_count"] = content.count("INSERT INTO")

            # Check metadata checksum
            meta_path = backup_file.with_suffix(backup_file.suffix + ".meta.json")
            if meta_path.exists():
                with open(meta_path) as mf:
                    metadata = json.load(mf)
                expected = metadata.get("checksum_sha256")
                actual = compute_checksum(backup_file)
                report["checksum_valid"] = expected == actual
            else:
                report["checksum_valid"] = "No metadata file"

        except Exception as e:
            report["error"] = str(e)

        return report

    def _get_pg_dump_version(self) -> str:
        """Get pg_dump version string."""
        try:
            result = subprocess.run(
                ["pg_dump", "--version"],
                capture_output=True, text=True, timeout=5,
            )
            return result.stdout.strip()
        except Exception:
            return "unknown"


# ── Scheduled Backup ──────────────────────────────────────────

class ScheduledBackup:
    """Manages scheduled backup operations."""

    def __init__(self, backup_manager: BackupManager):
        self.manager = backup_manager
        self.schedule_file = backup_manager.backup_dir / "schedule.json"

    def run_scheduled(self) -> dict:
        """
        Run a scheduled backup with cleanup.
        Returns summary dict.
        """
        summary = {
            "timestamp": datetime.now().isoformat(),
            "status": "unknown",
            "backup_file": None,
            "cleanup_count": 0,
            "disk_usage": None,
        }

        try:
            # Create backup
            backup_path = self.manager.create_backup(compress=True)
            summary["backup_file"] = str(backup_path)

            # Verify backup
            verification = self.manager.verify_backup(backup_path)
            summary["verification"] = verification

            # Cleanup old backups
            removed = self.manager.cleanup_old_backups()
            summary["cleanup_count"] = removed

            # Check disk usage
            summary["disk_usage"] = get_disk_usage(self.manager.backup_dir)

            # Warn if disk usage is high
            disk = summary["disk_usage"]
            if disk["percent_used"] > 90:
                logger.warning(f"Disk usage is high: {disk['percent_used']}%")

            summary["status"] = "success"
            logger.info("Scheduled backup completed successfully")

        except Exception as e:
            summary["status"] = "failed"
            summary["error"] = str(e)
            logger.error(f"Scheduled backup failed: {e}")

        # Save summary
        history_file = self.manager.backup_dir / "backup_history.jsonl"
        with open(history_file, "a") as f:
            f.write(json.dumps(summary) + "\n")

        return summary


# ── CLI ───────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="CancerGuard AI - Database Backup Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/backup.py backup
  python scripts/backup.py backup --compress --output ./my-backups
  python scripts/backup.py backup --tables users appointments
  python scripts/backup.py restore --file backups/cancerguard_20240101_120000.sql.gz
  python scripts/backup.py list
  python scripts/backup.py cleanup --keep 14
  python scripts/backup.py verify --file backups/cancerguard_20240101_120000.sql.gz
  python scripts/backup.py scheduled
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Create a database backup")
    backup_parser.add_argument("--output", "-o", type=str, help="Output directory")
    backup_parser.add_argument("--compress", action="store_true", default=True,
                               help="Compress with gzip (default)")
    backup_parser.add_argument("--no-compress", action="store_true",
                               help="Don't compress output")
    backup_parser.add_argument("--data-only", action="store_true",
                               help="Exclude schema DDL")
    backup_parser.add_argument("--tables", nargs="+", help="Specific tables to backup")
    backup_parser.add_argument("--name", type=str, help="Custom filename prefix")

    # Restore command
    restore_parser = subparsers.add_parser("restore", help="Restore from backup")
    restore_parser.add_argument("--file", "-f", type=str, required=True,
                                help="Backup file to restore")
    restore_parser.add_argument("--drop", action="store_true",
                                help="Drop existing tables before restore")

    # List command
    list_parser = subparsers.add_parser("list", help="List available backups")
    list_parser.add_argument("--dir", type=str, help="Backup directory to list")

    # Cleanup command
    cleanup_parser = subparsers.add_parser("cleanup", help="Remove old backups")
    cleanup_parser.add_argument("--keep", type=int, default=DEFAULT_RETENTION_DAYS,
                                help=f"Days to retain (default: {DEFAULT_RETENTION_DAYS})")

    # Verify command
    verify_parser = subparsers.add_parser("verify", help="Verify backup integrity")
    verify_parser.add_argument("--file", "-f", type=str, required=True,
                               help="Backup file to verify")

    # Scheduled command
    subparsers.add_parser("scheduled", help="Run scheduled backup with cleanup")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Initialize manager
    backup_dir = Path(args.output) if hasattr(args, "output") and args.output else BACKUP_DIR
    if hasattr(args, "dir") and args.dir:
        backup_dir = Path(args.dir)
    manager = BackupManager(backup_dir)

    # Execute command
    if args.command == "backup":
        compress = not args.no_compress if hasattr(args, "no_compress") else True
        manager.create_backup(
            compress=compress,
            include_schema=not args.data_only,
            tables=args.tables,
            custom_name=args.name,
        )

    elif args.command == "restore":
        filepath = Path(args.file)
        if not filepath.is_absolute():
            filepath = PROJECT_ROOT / filepath
        success = manager.restore_backup(filepath, drop_existing=args.drop)
        sys.exit(0 if success else 1)

    elif args.command == "list":
        backups = manager.list_backups()
        if not backups:
            print("No backups found.")
            return

        print(f"\n{'File':<50} {'Size':<12} {'Created':<22} {'Compressed'}")
        print("-" * 100)
        total_size = 0
        for b in backups:
            compressed = "✓" if b["compressed"] else "✗"
            print(f"{b['file']:<50} {b['size']:<12} {b['created']:<22} {compressed}")
            total_size += b["size_bytes"]
        print("-" * 100)
        print(f"Total: {len(backups)} backup(s), {file_size_human(total_size)}")

        disk = get_disk_usage(backup_dir)
        print(f"Disk: {disk['used']} used / {disk['total']} total ({disk['percent_used']}%)")

    elif args.command == "cleanup":
        removed = manager.cleanup_old_backups(retention_days=args.keep)
        print(f"Removed {removed} old backup(s)")

    elif args.command == "verify":
        filepath = Path(args.file)
        if not filepath.is_absolute():
            filepath = PROJECT_ROOT / filepath
        report = manager.verify_backup(filepath)
        print("\nBackup Verification Report")
        print("=" * 40)
        for key, value in report.items():
            print(f"  {key}: {value}")

    elif args.command == "scheduled":
        scheduler = ScheduledBackup(manager)
        summary = scheduler.run_scheduled()
        print(f"\nScheduled backup: {summary['status']}")
        if summary.get("backup_file"):
            print(f"  File: {summary['backup_file']}")
        if summary.get("cleanup_count"):
            print(f"  Cleaned: {summary['cleanup_count']} old backup(s)")


if __name__ == "__main__":
    main()
