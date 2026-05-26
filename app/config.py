"""Central configuration: file paths and Italian tax rates.

Tax rates are kept here (not hard-coded across the app) so they're easy to
update when the law changes. All figures are estimates to support your
commercialista, not official filings.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR.parent / 'data.db'}")

# --- Anthropic (invoice scanning) ---
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
# Vision-capable Claude model used to read invoices. Defaults to the most
# capable model; set EXTRACTION_MODEL=claude-haiku-4-5 in .env for cheaper,
# higher-volume scanning.
EXTRACTION_MODEL = os.getenv("EXTRACTION_MODEL", "claude-opus-4-7")
# Below this confidence the scanned entry is flagged "needs review".
EXTRACTION_CONFIDENCE_THRESHOLD = 0.6

# --- Italian tax rates (2026) ---
# Cedolare secca: flat substitute tax on short-term rental income.
CEDOLARE_RATE_FIRST = 0.21   # first rented property
CEDOLARE_RATE_SECOND = 0.26  # from the second rented property

# Renovation / energy bonuses: deduction spread over 10 equal yearly instalments.
RENOVATION_RATE_PRIMARY = 0.50    # prima casa, 2026
RENOVATION_RATE_SECOND_HOME = 0.36  # seconda casa, 2026 (drops in 2027)
RENOVATION_CAP = 96_000.0         # per housing unit cap for bonus ristrutturazione
DEDUCTION_INSTALMENT_YEARS = 10

# Categories that count as deductible running costs vs. plain bookkeeping.
# Under cedolare secca these do NOT reduce the rental tax base, but they matter
# for the ordinary-IRPEF comparison and overall profitability.
DISCLAIMER = (
    "All tax figures are estimates to help you and your commercialista. "
    "They are not official filings."
)
