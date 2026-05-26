"""Italian rental tax calculations.

Pure functions over the model objects so they're easy to unit-test. Everything
here is an estimate to support your commercialista, not an official filing.

Key facts encoded:
- Cedolare secca is a flat substitute tax on gross short-term rental income
  (21% on the first rented property, 26% from the second). Ordinary running
  costs are NOT deductible against it.
- Airbnb withholds the cedolare at source and remits it; direct/website
  bookings paid to your bank are NOT withheld, so that tax is still owed.
- Renovation/energy bonuses are IRPEF deductions spread over 10 equal yearly
  instalments (36% for a second home in 2026, capped at 96,000 EUR of spend).
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app import config
from app.models import Expense, ExpenseCategory, Income, IncomeChannel, Investment


def cedolare_rate(is_first_property: bool = True) -> float:
    return config.CEDOLARE_RATE_FIRST if is_first_property else config.CEDOLARE_RATE_SECOND


def taxable_base(income: Income) -> float:
    """Cedolare applies to the whole consideration paid by the guest, including
    the cleaning fee charged to them. Platform commission is not deducted."""
    return round(income.gross_rent + income.cleaning_fee, 2)


@dataclass
class CedolareSummary:
    rate: float = 0.0
    total_taxable: float = 0.0
    total_tax_due: float = 0.0
    tax_paid_at_source: float = 0.0   # withheld by Airbnb etc.
    tax_still_owed: float = 0.0       # you pay this via F24 / return
    by_channel: dict[str, dict[str, float]] = field(default_factory=dict)


def cedolare_summary(incomes: list[Income], is_first_property: bool = True) -> CedolareSummary:
    rate = cedolare_rate(is_first_property)
    summary = CedolareSummary(rate=rate)
    for inc in incomes:
        base = taxable_base(inc)
        tax_due = round(base * rate, 2)
        paid = round(inc.amount_withheld, 2) if inc.tax_withheld_at_source else 0.0
        owed = round(max(tax_due - paid, 0.0), 2)

        summary.total_taxable = round(summary.total_taxable + base, 2)
        summary.total_tax_due = round(summary.total_tax_due + tax_due, 2)
        summary.tax_paid_at_source = round(summary.tax_paid_at_source + paid, 2)
        summary.tax_still_owed = round(summary.tax_still_owed + owed, 2)

        ch = inc.channel.value if isinstance(inc.channel, IncomeChannel) else str(inc.channel)
        bucket = summary.by_channel.setdefault(
            ch, {"taxable": 0.0, "tax_due": 0.0, "paid": 0.0, "owed": 0.0}
        )
        bucket["taxable"] = round(bucket["taxable"] + base, 2)
        bucket["tax_due"] = round(bucket["tax_due"] + tax_due, 2)
        bucket["paid"] = round(bucket["paid"] + paid, 2)
        bucket["owed"] = round(bucket["owed"] + owed, 2)
    return summary


def deduction_schedule(investment: Investment) -> list[tuple[int, float]]:
    """10 equal yearly instalments of the bonus deduction.

    Eligible spend is capped (bonus ristrutturazione = 96,000 EUR). The yearly
    deductible amount = capped_spend * rate / 10.
    """
    eligible = min(investment.total_amount, config.RENOVATION_CAP)
    total_deduction = round(eligible * investment.deduction_rate, 2)
    years = config.DEDUCTION_INSTALMENT_YEARS
    per_year = round(total_deduction / years, 2)
    return [(investment.start_year + i, per_year) for i in range(years)]


def claimable_in_year(investments: list[Investment], year: int) -> float:
    """Sum of all bonus instalments deductible in a given calendar year."""
    total = 0.0
    for inv in investments:
        for inst_year, amount in deduction_schedule(inv):
            if inst_year == year:
                total += amount
    return round(total, 2)


# Categories treated as the property tax / waste tax owed to the comune.
LOCAL_TAX_CATEGORIES = {ExpenseCategory.imu, ExpenseCategory.tari}


def local_taxes_total(expenses: list[Expense], categories: set[ExpenseCategory]) -> float:
    return round(sum(e.amount for e in expenses if e.category in categories), 2)


@dataclass
class IncomeStatement:
    total_income: float = 0.0
    total_expenses: float = 0.0
    net_cash_flow: float = 0.0
    expenses_by_category: dict[str, float] = field(default_factory=dict)
    income_by_channel: dict[str, float] = field(default_factory=dict)


def income_statement(incomes: list[Income], expenses: list[Expense]) -> IncomeStatement:
    stmt = IncomeStatement()
    for inc in incomes:
        amount = round(inc.gross_rent + inc.cleaning_fee, 2)
        stmt.total_income = round(stmt.total_income + amount, 2)
        ch = inc.channel.value if isinstance(inc.channel, IncomeChannel) else str(inc.channel)
        stmt.income_by_channel[ch] = round(stmt.income_by_channel.get(ch, 0.0) + amount, 2)
    for exp in expenses:
        stmt.total_expenses = round(stmt.total_expenses + exp.amount, 2)
        cat = exp.category.value if isinstance(exp.category, ExpenseCategory) else str(exp.category)
        stmt.expenses_by_category[cat] = round(
            stmt.expenses_by_category.get(cat, 0.0) + exp.amount, 2
        )
    stmt.net_cash_flow = round(stmt.total_income - stmt.total_expenses, 2)
    return stmt


@dataclass
class RegimeComparison:
    """Compare flat cedolare secca vs ordinary IRPEF, where deductible running
    costs reduce the taxable base. This is a simplified illustration to show
    which regime tends to be more efficient; confirm with your commercialista."""
    cedolare_tax: float = 0.0
    ordinary_taxable: float = 0.0
    ordinary_tax_estimate: float = 0.0
    recommended: str = "cedolare"


# Simplified 2026 IRPEF brackets for the ordinary-regime illustration only.
_IRPEF_BRACKETS = [(28_000.0, 0.23), (50_000.0, 0.35), (float("inf"), 0.43)]


def _irpef(taxable: float) -> float:
    tax = 0.0
    lower = 0.0
    for upper, rate in _IRPEF_BRACKETS:
        if taxable > lower:
            slice_amount = min(taxable, upper) - lower
            tax += slice_amount * rate
            lower = upper
        else:
            break
    return round(tax, 2)


def regime_comparison(
    incomes: list[Income],
    deductible_expenses: list[Expense],
    is_first_property: bool = True,
) -> RegimeComparison:
    gross = sum(taxable_base(i) for i in incomes)
    cedolare = round(gross * cedolare_rate(is_first_property), 2)

    # Ordinary IRPEF: short-term rental income gets a flat 5% reduction, then
    # deductible costs reduce the base (illustrative).
    deductible = sum(e.amount for e in deductible_expenses if e.deductible)
    ordinary_base = max(gross * 0.95 - deductible, 0.0)
    ordinary_tax = _irpef(ordinary_base)

    return RegimeComparison(
        cedolare_tax=cedolare,
        ordinary_taxable=round(ordinary_base, 2),
        ordinary_tax_estimate=ordinary_tax,
        recommended="cedolare" if cedolare <= ordinary_tax else "ordinary",
    )
