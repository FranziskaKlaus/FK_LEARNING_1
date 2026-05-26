"""Small helpers for turning HTML form strings into typed values."""
from __future__ import annotations

from datetime import date
from typing import Optional


def parse_float(value: Optional[str], default: float = 0.0) -> float:
    if value is None or value.strip() == "":
        return default
    return float(value.replace(",", ".").strip())


def parse_optional_float(value: Optional[str]) -> Optional[float]:
    if value is None or value.strip() == "":
        return None
    return float(value.replace(",", ".").strip())


def parse_int(value: Optional[str], default: int = 0) -> int:
    if value is None or value.strip() == "":
        return default
    return int(value.strip())


def parse_date(value: Optional[str]) -> Optional[date]:
    if value is None or value.strip() == "":
        return None
    return date.fromisoformat(value.strip())
