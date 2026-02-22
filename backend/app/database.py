"""
Database Configuration and Session Management
==============================================

Provides async database engine, session factory, and base model class.
Supports both PostgreSQL (production) and SQLite (development).
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    String,
    Boolean,
    Integer,
    Text,
    Float,
    event,
    inspect,
    text,
)
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    MappedAsDataclass,
    declared_attr,
    mapped_column,
    relationship,
    Session,
)
from sqlalchemy.pool import StaticPool

from app.config import get_settings

logger = logging.getLogger(__name__)

# ============================================================================
# Base Model Class
# ============================================================================

class Base(DeclarativeBase):
    """Base class for all database models with common fields."""
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
        index=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    @declared_attr.directive
    def __tablename__(cls) -> str:
        """Generate table name from class name."""
        import re
        name = re.sub(r'(?<!^)(?=[A-Z])', '_', cls.__name__).lower()
        return name
    
    def to_dict(self) -> dict:
        """Convert model instance to dictionary."""
        result = {}
        for column in inspect(self.__class__).columns:
            value = getattr(self, column.key)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.key] = value
        return result
    
    def soft_delete(self) -> None:
        """Soft delete the record."""
        self.is_deleted = True
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc)
    
    def restore(self) -> None:
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.is_active = True
        self.updated_at = datetime.now(timezone.utc)
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(id={self.id})>"


# ============================================================================
# Mixin Classes
# ============================================================================

class TimestampMixin:
    """Mixin for models that need detailed timestamp tracking."""
    
    created_by: Mapped[Optional[str]] = mapped_column(
        String(36), nullable=True
    )
    updated_by: Mapped[Optional[str]] = mapped_column(
        String(36), nullable=True
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deleted_by: Mapped[Optional[str]] = mapped_column(
        String(36), nullable=True
    )


class AuditMixin(TimestampMixin):
    """Mixin for models that need audit trail support."""
    
    version: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )
    change_reason: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45), nullable=True
    )
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )


class SoftDeleteMixin:
    """Mixin for soft-deletable models."""
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    
    @property
    def is_soft_deleted(self) -> bool:
        return self.deleted_at is not None


# ============================================================================
# Database Engine and Session Management
# ============================================================================

_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def get_engine() -> AsyncEngine:
    """Get or create the async database engine."""
    global _engine
    if _engine is None:
        settings = get_settings()
        db_url = settings.database.database_url
        
        engine_kwargs = {
            "echo": settings.database.echo,
        }
        
        if settings.database.use_sqlite:
            engine_kwargs.update({
                "connect_args": {"check_same_thread": False},
                "poolclass": StaticPool,
            })
        else:
            engine_kwargs.update({
                "pool_size": settings.database.pool_size,
                "max_overflow": settings.database.max_overflow,
                "pool_timeout": settings.database.pool_timeout,
                "pool_recycle": settings.database.pool_recycle,
                "pool_pre_ping": settings.database.pool_pre_ping,
            })
        
        _engine = create_async_engine(db_url, **engine_kwargs)
        logger.info(f"Database engine created: {db_url.split('@')[-1] if '@' in db_url else db_url}")
    
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Get or create the async session factory."""
    global _session_factory
    if _session_factory is None:
        engine = get_engine()
        _session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database sessions (for use outside of FastAPI DI)."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ============================================================================
# Database Lifecycle Management
# ============================================================================

async def init_db() -> None:
    """Initialize the database by creating all tables."""
    engine = get_engine()
    
    # Import all models to register them with Base
    from app.models import (  # noqa: F401
        user,
        patient,
        hospital,
        health_record,
        blood_sample,
        smartwatch_data,
        medication,
        appointment,
        cancer_screening,
        notification,
        audit_log,
        vital_signs,
        lab_result,
        medical_image,
        insurance,
        report,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Database tables created successfully")


async def drop_db() -> None:
    """Drop all database tables (USE WITH CAUTION)."""
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    logger.warning("All database tables dropped!")


async def close_db() -> None:
    """Close the database engine and dispose of connections."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("Database engine closed")


async def check_db_health() -> dict:
    """Check database health status."""
    try:
        async with get_db_context() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
        return {
            "status": "healthy",
            "database": "connected",
            "type": "sqlite" if get_settings().database.use_sqlite else "postgresql"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


# ============================================================================
# Database Utilities
# ============================================================================

class DatabaseManager:
    """High-level database management operations."""
    
    @staticmethod
    async def create_tables() -> None:
        """Create all tables."""
        await init_db()
    
    @staticmethod
    async def drop_tables() -> None:
        """Drop all tables."""
        await drop_db()
    
    @staticmethod
    async def reset_database() -> None:
        """Reset database by dropping and recreating all tables."""
        await drop_db()
        await init_db()
    
    @staticmethod
    async def seed_data() -> None:
        """Seed the database with initial data."""
        from app.services.seed_service import SeedService
        async with get_db_context() as session:
            seed_service = SeedService(session)
            await seed_service.seed_all()
    
    @staticmethod
    async def get_table_stats() -> dict:
        """Get statistics for all tables."""
        stats = {}
        async with get_db_context() as session:
            for table in Base.metadata.sorted_tables:
                try:
                    result = await session.execute(
                        text(f"SELECT COUNT(*) FROM {table.name}")
                    )
                    count = result.scalar()
                    stats[table.name] = {"count": count}
                except Exception as e:
                    stats[table.name] = {"error": str(e)}
        return stats
    
    @staticmethod
    async def backup_database(backup_path: str) -> None:
        """Create a database backup."""
        settings = get_settings()
        if settings.database.use_sqlite:
            import shutil
            shutil.copy2(settings.database.sqlite_path, backup_path)
            logger.info(f"Database backup created: {backup_path}")
        else:
            logger.warning("PostgreSQL backup requires pg_dump utility")
    
    @staticmethod
    async def execute_raw_query(query: str, params: dict = None) -> list:
        """Execute a raw SQL query (admin only)."""
        async with get_db_context() as session:
            result = await session.execute(text(query), params or {})
            try:
                return [dict(row._mapping) for row in result.fetchall()]
            except Exception:
                return []
