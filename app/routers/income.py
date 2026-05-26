"""Income / booking CRUD."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from app.common import get_property
from app.database import get_session
from app.models import Income, IncomeChannel
from app.parsing import parse_date, parse_float, parse_int
from app.templating import templates

router = APIRouter(prefix="/income")


@router.get("")
def list_income(request: Request, session: Session = Depends(get_session)):
    items = list(session.exec(select(Income).order_by(Income.check_in.desc())))
    return templates.TemplateResponse(
        "income_list.html",
        {"request": request, "items": items, "active": "income", "edit": None},
    )


@router.get("/{income_id}/edit")
def edit_income(income_id: int, request: Request, session: Session = Depends(get_session)):
    items = list(session.exec(select(Income).order_by(Income.check_in.desc())))
    edit = session.get(Income, income_id)
    return templates.TemplateResponse(
        "income_list.html",
        {"request": request, "items": items, "active": "income", "edit": edit},
    )


@router.post("")
def create_income(
    session: Session = Depends(get_session),
    channel: str = Form(...),
    tax_withheld_at_source: Optional[str] = Form(None),
    guest_name: str = Form(""),
    check_in: Optional[str] = Form(None),
    check_out: Optional[str] = Form(None),
    nights: Optional[str] = Form(None),
    gross_rent: Optional[str] = Form(None),
    cleaning_fee: Optional[str] = Form(None),
    platform_commission: Optional[str] = Form(None),
    amount_withheld: Optional[str] = Form(None),
    net_received: Optional[str] = Form(None),
    payout_date: Optional[str] = Form(None),
    notes: str = Form(""),
):
    prop = get_property(session)
    ch = IncomeChannel(channel)
    inc = Income(
        property_id=prop.id,
        channel=ch,
        tax_withheld_at_source=tax_withheld_at_source is not None,
        guest_name=guest_name,
        check_in=parse_date(check_in),
        check_out=parse_date(check_out),
        nights=parse_int(nights),
        gross_rent=parse_float(gross_rent),
        cleaning_fee=parse_float(cleaning_fee),
        platform_commission=parse_float(platform_commission),
        amount_withheld=parse_float(amount_withheld),
        net_received=parse_float(net_received),
        payout_date=parse_date(payout_date),
        notes=notes,
    )
    session.add(inc)
    session.commit()
    return RedirectResponse("/income", status_code=303)


@router.post("/{income_id}")
def update_income(
    income_id: int,
    session: Session = Depends(get_session),
    channel: str = Form(...),
    tax_withheld_at_source: Optional[str] = Form(None),
    guest_name: str = Form(""),
    check_in: Optional[str] = Form(None),
    check_out: Optional[str] = Form(None),
    nights: Optional[str] = Form(None),
    gross_rent: Optional[str] = Form(None),
    cleaning_fee: Optional[str] = Form(None),
    platform_commission: Optional[str] = Form(None),
    amount_withheld: Optional[str] = Form(None),
    net_received: Optional[str] = Form(None),
    payout_date: Optional[str] = Form(None),
    notes: str = Form(""),
):
    inc = session.get(Income, income_id)
    if inc is None:
        return RedirectResponse("/income", status_code=303)
    inc.channel = IncomeChannel(channel)
    inc.tax_withheld_at_source = tax_withheld_at_source is not None
    inc.guest_name = guest_name
    inc.check_in = parse_date(check_in)
    inc.check_out = parse_date(check_out)
    inc.nights = parse_int(nights)
    inc.gross_rent = parse_float(gross_rent)
    inc.cleaning_fee = parse_float(cleaning_fee)
    inc.platform_commission = parse_float(platform_commission)
    inc.amount_withheld = parse_float(amount_withheld)
    inc.net_received = parse_float(net_received)
    inc.payout_date = parse_date(payout_date)
    inc.notes = notes
    session.add(inc)
    session.commit()
    return RedirectResponse("/income", status_code=303)


@router.post("/{income_id}/delete")
def delete_income(income_id: int, session: Session = Depends(get_session)):
    inc = session.get(Income, income_id)
    if inc is not None:
        session.delete(inc)
        session.commit()
    return RedirectResponse("/income", status_code=303)
