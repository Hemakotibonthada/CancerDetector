"""Date parsing for fields that are dates on the wire and timestamps in the database.

HTML date inputs submit ``YYYY-MM-DD``. Pydantic's ``datetime`` type rejects that
string ("invalid datetime separator"). Several columns that store those values
are ``timestamp without time zone`` (SQLAlchemy ``DateTime``), which also
rejects timezone-aware datetimes on PostgreSQL. Callers that write to
``DateTime(timezone=True)`` columns ask for an aware UTC value instead.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Annotated, Any, Optional

from pydantic import BeforeValidator


def parse_optional_datetime(value: Any, *, naive: bool = True) -> Optional[datetime]:
    """Parse a date-only string, a datetime, or a blank into a datetime.

    Blank values (``None`` and ``""``) become ``None`` so optional form fields
    can be left empty. Date-only strings become midnight on that calendar date.
    Timezone offsets are dropped without shifting the clock when ``naive`` is
    true, which keeps a date of birth on the day the client sent and satisfies
    ``timestamp without time zone``. When ``naive`` is false the result is
    timezone-aware UTC for ``timestamptz`` columns.
    """
    if value is None:
        return None

    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        if text.endswith(("Z", "z")):
            text = text[:-1] + "+00:00"
        try:
            # Python 3.11+ accepts YYYY-MM-DD and returns midnight.
            parsed: datetime = datetime.fromisoformat(text)
        except ValueError:
            try:
                parsed_date = date.fromisoformat(text)
            except ValueError as exc:
                raise ValueError(
                    "Input should be a valid date (YYYY-MM-DD) or datetime"
                ) from exc
            parsed = datetime(
                parsed_date.year, parsed_date.month, parsed_date.day
            )
    elif isinstance(value, datetime):
        parsed = value
    elif isinstance(value, date):
        parsed = datetime(value.year, value.month, value.day)
    else:
        raise ValueError("Input should be a valid date (YYYY-MM-DD) or datetime")

    if naive:
        if parsed.tzinfo is not None:
            parsed = parsed.replace(tzinfo=None)
        return parsed

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _coerce_optional_naive_datetime(value: Any) -> Optional[datetime]:
    return parse_optional_datetime(value, naive=True)


# Request and response fields that persist into timestamp-without-time-zone columns.
OptionalNaiveDateTime = Annotated[
    Optional[datetime],
    BeforeValidator(_coerce_optional_naive_datetime),
]
