"""Expense CRUD, including recategorization and the review queue."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from app.common import get_property
from app.database import get_session
from app.models import Document, DocumentStatus, Expense, ExpenseCategory, PaymentMethod
from app.parsing import parse_date, parse_float
from app.templating import templates

router = APIRouter(prefix="/expenses")


@router.get("")
def list_expenses(request: Request, session: Session = Depends(get_session)):
    items = list(session.exec(select(Expense).order_by(Expense.date.desc())))
    return templates.TemplateResponse(
        "expense_list.html",
        {"request": request, "items": items, "active": "expenses", "edit": None, "review_only": False},
    )


@router.get("/review")
def review_queue(request: Request, session: Session = Depends(get_session)):
    items = list(session.exec(select(Expense).where(Expense.needs_review == True)))  # noqa: E712
    return templates.TemplateResponse(
        "expense_list.html",
        {"request": request, "items": items, "active": "expenses", "edit": None, "review_only": True},
    )


@router.get("/{expense_id}/edit")
def edit_expense(expense_id: int, request: Request, session: Session = Depends(get_session)):
    items = list(session.exec(select(Expense).order_by(Expense.date.desc())))
    edit = session.get(Expense, expense_id)
    return templates.TemplateResponse(
        "expense_list.html",
        {"request": request, "items": items, "active": "expenses", "edit": edit, "review_only": False},
    )


@router.post("")
def create_expense(
    session: Session = Depends(get_session),
    category: str = Form(...),
    vendor: str = Form(""),
    date: Optional[str] = Form(None),
    amount: Optional[str] = Form(None),
    vat_amount: Optional[str] = Form(None),
    payment_method: str = Form("bank_transfer"),
    deductible: Optional[str] = Form(None),
    recurring: Optional[str] = Form(None),
    notes: str = Form(""),
):
    prop = get_property(session)
    cat = ExpenseCategory(category)
    exp = Expense(
        property_id=prop.id,
        category=cat,
        vendor=vendor,
        date=parse_date(date),
        amount=parse_float(amount),
        vat_amount=parse_float(vat_amount),
        payment_method=PaymentMethod(payment_method),
        deductible=deductible is not None,
        recurring=recurring is not None,
        notes=notes,
        needs_review=cat == ExpenseCategory.uncategorized,
    )
    session.add(exp)
    session.commit()
    return RedirectResponse("/expenses", status_code=303)


@router.post("/{expense_id}")
def update_expense(
    expense_id: int,
    session: Session = Depends(get_session),
    category: str = Form(...),
    vendor: str = Form(""),
    date: Optional[str] = Form(None),
    amount: Optional[str] = Form(None),
    vat_amount: Optional[str] = Form(None),
    payment_method: str = Form("bank_transfer"),
    deductible: Optional[str] = Form(None),
    recurring: Optional[str] = Form(None),
    notes: str = Form(""),
):
    exp = session.get(Expense, expense_id)
    if exp is None:
        return RedirectResponse("/expenses", status_code=303)
    cat = ExpenseCategory(category)
    exp.category = cat
    exp.vendor = vendor
    exp.date = parse_date(date)
    exp.amount = parse_float(amount)
    exp.vat_amount = parse_float(vat_amount)
    exp.payment_method = PaymentMethod(payment_method)
    exp.deductible = deductible is not None
    exp.recurring = recurring is not None
    exp.notes = notes
    # Confirming a category clears the review flag.
    exp.needs_review = cat == ExpenseCategory.uncategorized
    session.add(exp)
    # If this expense came from a scanned document, mark it confirmed once it
    # has a real category.
    if exp.document_id and not exp.needs_review:
        doc = session.get(Document, exp.document_id)
        if doc is not None:
            doc.status = DocumentStatus.confirmed
            session.add(doc)
    session.commit()
    return RedirectResponse("/expenses", status_code=303)


@router.post("/{expense_id}/delete")
def delete_expense(expense_id: int, session: Session = Depends(get_session)):
    exp = session.get(Expense, expense_id)
    if exp is not None:
        session.delete(exp)
        session.commit()
    return RedirectResponse("/expenses", status_code=303)
