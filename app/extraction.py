"""AI invoice scanning via Claude vision.

Sends an invoice image/PDF to Claude and gets back structured fields (vendor,
date, total, VAT) plus a suggested expense category. The instructions live in a
stable system prompt with prompt caching enabled; only the image varies per
request. The invoice image is the only thing that leaves the machine.
"""
from __future__ import annotations

import base64
from typing import Optional

import anthropic
from pydantic import BaseModel

from app import config
from app.models import ExpenseCategory

# The categories Claude is allowed to suggest. Built from the enum so the two
# never drift apart.
_CATEGORY_VALUES = [c.value for c in ExpenseCategory]

SYSTEM_PROMPT = f"""You read invoices and receipts for an Italian short-term \
rental property (an Airbnb-style holiday let) and extract structured \
accounting data.

Extract:
- vendor: the company or person that issued the invoice.
- invoice_date: the document date, as ISO YYYY-MM-DD. Null if not visible.
- total: the gross total amount in EUR, as a number (no currency symbol). \
Null if not visible.
- vat: the VAT/IVA amount in EUR, as a number. Null if not shown.
- suggested_category: the single best fit from this list: \
{", ".join(_CATEGORY_VALUES)}.
  Guidance: cleaning = cleaning lady / pulizie; gas/water/electricity/wifi = \
utility bills; condominio = community/building fees; imu = property tax; \
tari = waste tax; insurance = assicurazione; maintenance = repairs; \
platform_fee = Airbnb/Booking commission. If you are NOT confident which \
category applies, use "uncategorized".
- confidence: your overall confidence in this extraction, 0.0 to 1.0. Use a \
low value when the image is unclear or the category is uncertain.

Only output the structured fields."""


class ExtractedInvoice(BaseModel):
    vendor: str
    invoice_date: Optional[str]
    total: Optional[float]
    vat: Optional[float]
    suggested_category: str
    confidence: float


def is_configured() -> bool:
    return bool(config.ANTHROPIC_API_KEY)


def _source_block(file_bytes: bytes, content_type: str) -> dict:
    data = base64.standard_b64encode(file_bytes).decode("utf-8")
    if "pdf" in content_type:
        return {
            "type": "document",
            "source": {"type": "base64", "media_type": "application/pdf", "data": data},
        }
    media_type = content_type if content_type.startswith("image/") else "image/jpeg"
    return {
        "type": "image",
        "source": {"type": "base64", "media_type": media_type, "data": data},
    }


def extract_invoice(file_bytes: bytes, content_type: str) -> tuple[ExtractedInvoice, str]:
    """Returns the parsed fields and the raw JSON response (for audit)."""
    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    response = client.messages.parse(
        model=config.EXTRACTION_MODEL,
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": [
                    _source_block(file_bytes, content_type),
                    {"type": "text", "text": "Extract the invoice fields."},
                ],
            }
        ],
        output_format=ExtractedInvoice,
    )
    return response.parsed_output, response.to_json()


def normalize_category(suggested: str) -> ExpenseCategory:
    try:
        return ExpenseCategory(suggested)
    except ValueError:
        return ExpenseCategory.uncategorized
