"""Invoice documents: upload, AI scan-to-draft, view, delete.

This is the headline feature — uploading or photographing an invoice runs it
through Claude vision, which fills in a draft expense you then confirm.
"""
from __future__ import annotations

import uuid
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, File, Request, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from sqlmodel import Session, select

from app import config, extraction
from app.common import get_property
from app.database import get_session
from app.models import Document, DocumentStatus, Expense, ExpenseCategory, PaymentMethod
from app.templating import templates

router = APIRouter(prefix="/documents")


@router.get("")
def list_documents(request: Request, session: Session = Depends(get_session)):
    items = list(session.exec(select(Document).order_by(Document.uploaded_at.desc())))
    return templates.TemplateResponse(
        "documents.html",
        {
            "request": request,
            "items": items,
            "active": "documents",
            "scanning_enabled": extraction.is_configured(),
        },
    )


@router.post("/upload")
async def upload_document(
    request: Request,
    session: Session = Depends(get_session),
    file: UploadFile = File(...),
):
    contents = await file.read()
    stored_name = f"{uuid.uuid4().hex}_{file.filename}"
    stored_path = config.UPLOAD_DIR / stored_name
    stored_path.write_bytes(contents)

    doc = Document(
        filename=file.filename or stored_name,
        stored_path=str(stored_path),
        content_type=file.content_type or "",
        source="web",
        status=DocumentStatus.uploaded,
    )

    parsed = None
    if extraction.is_configured():
        try:
            parsed, raw = extraction.extract_invoice(contents, doc.content_type)
            doc.parsed_vendor = parsed.vendor or ""
            doc.parsed_total = parsed.total
            doc.parsed_vat = parsed.vat
            doc.parsed_category = parsed.suggested_category or ""
            doc.confidence = parsed.confidence or 0.0
            doc.raw_response = raw
            doc.parsed_date = _safe_date(parsed.invoice_date)
            doc.status = DocumentStatus.extracted
        except Exception as exc:  # extraction is best-effort; never block upload
            doc.raw_response = f"extraction failed: {exc}"
            doc.status = DocumentStatus.needs_review

    session.add(doc)
    session.commit()
    session.refresh(doc)

    # Create a draft expense pre-filled from the scan (or empty for manual fill).
    prop = get_property(session)
    category = (
        extraction.normalize_category(parsed.suggested_category)
        if parsed
        else ExpenseCategory.uncategorized
    )
    low_confidence = (not parsed) or parsed.confidence < config.EXTRACTION_CONFIDENCE_THRESHOLD
    needs_review = category == ExpenseCategory.uncategorized or low_confidence

    expense = Expense(
        property_id=prop.id,
        category=category,
        vendor=doc.parsed_vendor,
        date=doc.parsed_date,
        amount=doc.parsed_total or 0.0,
        vat_amount=doc.parsed_vat or 0.0,
        payment_method=PaymentMethod.bank_transfer,
        document_id=doc.id,
        needs_review=needs_review,
        notes="Created from scanned invoice.",
    )
    session.add(expense)
    if not needs_review:
        doc.status = DocumentStatus.confirmed
        session.add(doc)
    session.commit()
    session.refresh(expense)

    # Land the user on the draft so they can confirm or correct it.
    return RedirectResponse(f"/expenses/{expense.id}/edit", status_code=303)


@router.get("/{document_id}/file")
def get_file(document_id: int, session: Session = Depends(get_session)):
    doc = session.get(Document, document_id)
    if doc is None:
        return RedirectResponse("/documents", status_code=303)
    return FileResponse(doc.stored_path, filename=doc.filename)


@router.post("/{document_id}/delete")
def delete_document(document_id: int, session: Session = Depends(get_session)):
    doc = session.get(Document, document_id)
    if doc is not None:
        # Unlink any expenses pointing at this document, then remove the file.
        for exp in session.exec(select(Expense).where(Expense.document_id == document_id)):
            exp.document_id = None
            session.add(exp)
        Path(doc.stored_path).unlink(missing_ok=True)
        session.delete(doc)
        session.commit()
    return RedirectResponse("/documents", status_code=303)


def _safe_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value.strip()[:10])
    except ValueError:
        return None
