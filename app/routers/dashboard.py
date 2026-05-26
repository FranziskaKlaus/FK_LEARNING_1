"""Dashboard and tax-overview pages."""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Request
from sqlmodel import Session, select

from app import config, tax
from app.common import (
    available_years,
    filter_expense_by_year,
    filter_income_by_year,
    get_property,
)
from app.database import get_session
from app.models import Expense, Income, Investment
from app.templating import templates

router = APIRouter()


def _load(session: Session):
    incomes = list(session.exec(select(Income)))
    expenses = list(session.exec(select(Expense)))
    investments = list(session.exec(select(Investment)))
    return incomes, expenses, investments


@router.get("/")
def dashboard(request: Request, year: Optional[int] = None, session: Session = Depends(get_session)):
    prop = get_property(session)
    incomes, expenses, investments = _load(session)
    years = available_years(incomes, expenses, investments)
    if year is None:
        year = years[0]

    year_income = filter_income_by_year(incomes, year)
    year_expenses = filter_expense_by_year(expenses, year)

    stmt = tax.income_statement(year_income, year_expenses)
    ced = tax.cedolare_summary(year_income)
    bonus_claimable = tax.claimable_in_year(investments, year)
    review_count = sum(1 for e in expenses if e.needs_review)

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "property": prop,
            "year": year,
            "years": years,
            "stmt": stmt,
            "cedolare": ced,
            "bonus_claimable": bonus_claimable,
            "review_count": review_count,
            "active": "dashboard",
        },
    )


@router.get("/taxes")
def taxes(request: Request, year: Optional[int] = None, session: Session = Depends(get_session)):
    prop = get_property(session)
    incomes, expenses, investments = _load(session)
    years = available_years(incomes, expenses, investments)
    if year is None:
        year = years[0]

    year_income = filter_income_by_year(incomes, year)
    year_expenses = filter_expense_by_year(expenses, year)

    ced = tax.cedolare_summary(year_income)
    comparison = tax.regime_comparison(year_income, year_expenses)
    imu = tax.local_taxes_total(year_expenses, {tax.ExpenseCategory.imu})
    tari = tax.local_taxes_total(year_expenses, {tax.ExpenseCategory.tari})

    schedules = []
    for inv in investments:
        schedules.append((inv, tax.deduction_schedule(inv)))
    bonus_claimable = tax.claimable_in_year(investments, year)

    # Compliance: bonuses require traceable payment.
    cash_investments = [
        inv for inv in investments if inv.payment_method.value == "cash" and inv.bonus_type.value != "none"
    ]

    return templates.TemplateResponse(
        "taxes.html",
        {
            "request": request,
            "property": prop,
            "year": year,
            "years": years,
            "cedolare": ced,
            "comparison": comparison,
            "imu": imu,
            "tari": tari,
            "schedules": schedules,
            "bonus_claimable": bonus_claimable,
            "cash_investments": cash_investments,
            "disclaimer": config.DISCLAIMER,
            "today": date.today(),
            "active": "taxes",
        },
    )
