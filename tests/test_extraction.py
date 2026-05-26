import base64

from app import extraction
from app.models import ExpenseCategory


def test_normalize_category_valid():
    assert extraction.normalize_category("cleaning") == ExpenseCategory.cleaning
    assert extraction.normalize_category("imu") == ExpenseCategory.imu


def test_normalize_category_unknown_falls_back():
    assert extraction.normalize_category("groceries") == ExpenseCategory.uncategorized
    assert extraction.normalize_category("") == ExpenseCategory.uncategorized


def test_source_block_for_pdf():
    block = extraction._source_block(b"%PDF-1.4 fake", "application/pdf")
    assert block["type"] == "document"
    assert block["source"]["media_type"] == "application/pdf"
    assert base64.standard_b64decode(block["source"]["data"]) == b"%PDF-1.4 fake"


def test_source_block_for_image():
    block = extraction._source_block(b"\x89PNG fake", "image/png")
    assert block["type"] == "image"
    assert block["source"]["media_type"] == "image/png"


def test_source_block_defaults_unknown_to_jpeg():
    block = extraction._source_block(b"data", "application/octet-stream")
    assert block["type"] == "image"
    assert block["source"]["media_type"] == "image/jpeg"


def test_extracted_invoice_model_parses():
    inv = extraction.ExtractedInvoice(
        vendor="ENEL Energia",
        invoice_date="2026-03-15",
        total=84.50,
        vat=15.24,
        suggested_category="electricity",
        confidence=0.92,
    )
    assert inv.total == 84.50
    assert inv.suggested_category == "electricity"
