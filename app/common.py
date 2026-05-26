"""Helpers shared across routers."""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlmodel import Session, select

from app.models import Expense, Income, Investment, Property


def get_property(session: Session) -> Property:
    prop = session.exec(select(Property)).first()
    if prop is None:
        prop = Property(name="My Italian house", is_second_home=True)
        session.add(prop)
        session.commit()
        session.refresh(prop)
    return prop


def income_year(inc: Income) -> Optional[int]:
    d = inc.check_in or inc.payout_date or inc.check_out
    return d.year if d else None


def expense_year(exp: Expense) -> Optional[int]:
    return exp.date.year if exp.date else None


def filter_income_by_year(items: list[Income], year: Optional[int]) -> list[Income]:
    if year is None:
        return items
    return [i for i in items if income_year(i) == year]


def filter_expense_by_year(items: list[Expense], year: Optional[int]) -> list[Expense]:
    if year is None:
        return items
    return [e for e in items if expense_year(e) == year]


def available_years(
    incomes: list[Income], expenses: list[Expense], investments: list[Investment]
) -> list[int]:
    years = {date.today().year}
    years.update(y for i in incomes if (y := income_year(i)))
    years.update(y for e in expenses if (y := expense_year(e)))
    years.update(inv.start_year for inv in investments)
    return sorted(years, reverse=True)
