"""Investment / renovation CRUD (capital items eligible for tax bonuses)."""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from app import config
from app.common import get_property
from app.database import get_session
from app.models import BonusType, Investment, PaymentMethod
from app.parsing import parse_float, parse_int
from app.tax import deduction_schedule
from app.templating import templates

router = APIRouter(prefix="/investments")


def _default_rate(session: Session) -> float:
    prop = get_property(session)
    return (
        config.RENOVATION_RATE_SECOND_HOME
        if prop.is_second_home
        else config.RENOVATION_RATE_PRIMARY
    )


@router.get("")
def list_investments(request: Request, session: Session = Depends(get_session)):
    items = list(session.exec(select(Investment).order_by(Investment.start_year.desc())))
    schedules = {inv.id: deduction_schedule(inv) for inv in items}
    return templates.TemplateResponse(
        "investment_list.html",
        {
            "request": request,
            "items": items,
            "schedules": schedules,
            "active": "investments",
            "edit": None,
            "default_rate": _default_rate(session),
            "this_year": date.today().year,
        },
    )


@router.get("/{investment_id}/edit")
def edit_investment(investment_id: int, request: Request, session: Session = Depends(get_session)):
    items = list(session.exec(select(Investment).order_by(Investment.start_year.desc())))
    schedules = {inv.id: deduction_schedule(inv) for inv in items}
    edit = session.get(Investment, investment_id)
    return templates.TemplateResponse(
        "investment_list.html",
        {
            "request": request,
            "items": items,
            "schedules": schedules,
            "active": "investments",
            "edit": edit,
            "default_rate": _default_rate(session),
            "this_year": date.today().year,
        },
    )


@router.post("")
def create_investment(
    session: Session = Depends(get_session),
    description: str = Form(""),
    bonus_type: str = Form("ristrutturazione"),
    total_amount: Optional[str] = Form(None),
    deduction_rate: Optional[str] = Form(None),
    start_year: Optional[str] = Form(None),
    payment_method: str = Form("bank_transfer"),
    notes: str = Form(""),
):
    prop = get_property(session)
    inv = Investment(
        property_id=prop.id,
        description=description,
        bonus_type=BonusType(bonus_type),
        total_amount=parse_float(total_amount),
        deduction_rate=parse_float(deduction_rate, _default_rate(session)),
        start_year=parse_int(start_year, date.today().year),
        payment_method=PaymentMethod(payment_method),
        notes=notes,
    )
    session.add(inv)
    session.commit()
    return RedirectResponse("/investments", status_code=303)


@router.post("/{investment_id}")
def update_investment(
    investment_id: int,
    session: Session = Depends(get_session),
    description: str = Form(""),
    bonus_type: str = Form("ristrutturazione"),
    total_amount: Optional[str] = Form(None),
    deduction_rate: Optional[str] = Form(None),
    start_year: Optional[str] = Form(None),
    payment_method: str = Form("bank_transfer"),
    notes: str = Form(""),
):
    inv = session.get(Investment, investment_id)
    if inv is None:
        return RedirectResponse("/investments", status_code=303)
    inv.description = description
    inv.bonus_type = BonusType(bonus_type)
    inv.total_amount = parse_float(total_amount)
    inv.deduction_rate = parse_float(deduction_rate, _default_rate(session))
    inv.start_year = parse_int(start_year, date.today().year)
    inv.payment_method = PaymentMethod(payment_method)
    inv.notes = notes
    session.add(inv)
    session.commit()
    return RedirectResponse("/investments", status_code=303)


@router.post("/{investment_id}/delete")
def delete_investment(investment_id: int, session: Session = Depends(get_session)):
    inv = session.get(Investment, investment_id)
    if inv is not None:
        session.delete(inv)
        session.commit()
    return RedirectResponse("/investments", status_code=303)
