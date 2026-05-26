from datetime import date

from app import config, tax
from app.models import (
    BonusType,
    Expense,
    ExpenseCategory,
    Income,
    IncomeChannel,
    Investment,
    PaymentMethod,
)


def test_cedolare_rate_first_vs_second():
    assert tax.cedolare_rate(True) == config.CEDOLARE_RATE_FIRST
    assert tax.cedolare_rate(False) == config.CEDOLARE_RATE_SECOND


def test_taxable_base_includes_cleaning():
    inc = Income(gross_rent=1000.0, cleaning_fee=50.0)
    assert tax.taxable_base(inc) == 1050.0


def test_cedolare_airbnb_withheld_vs_direct_owed():
    airbnb = Income(
        channel=IncomeChannel.airbnb,
        tax_withheld_at_source=True,
        gross_rent=1000.0,
        amount_withheld=210.0,  # 21% of 1000
    )
    direct = Income(
        channel=IncomeChannel.direct,
        tax_withheld_at_source=False,
        gross_rent=1000.0,
    )
    summary = tax.cedolare_summary([airbnb, direct])

    # 21% of (1000 + 1000) = 420 total tax due
    assert summary.total_tax_due == 420.0
    # Airbnb already paid 210; direct owes its 210
    assert summary.tax_paid_at_source == 210.0
    assert summary.tax_still_owed == 210.0
    assert summary.by_channel["airbnb"]["owed"] == 0.0
    assert summary.by_channel["direct"]["owed"] == 210.0


def test_deduction_schedule_ten_equal_instalments():
    inv = Investment(
        description="New sauna",
        bonus_type=BonusType.ristrutturazione,
        total_amount=10000.0,
        deduction_rate=0.36,
        start_year=2026,
    )
    schedule = tax.deduction_schedule(inv)
    assert len(schedule) == 10
    # 10000 * 0.36 = 3600 total, over 10 years = 360/yr
    assert schedule[0] == (2026, 360.0)
    assert schedule[-1][0] == 2035
    assert round(sum(amount for _, amount in schedule), 2) == 3600.0


def test_deduction_schedule_respects_cap():
    inv = Investment(total_amount=200000.0, deduction_rate=0.36, start_year=2026)
    schedule = tax.deduction_schedule(inv)
    # Capped at 96,000 → 96000 * 0.36 / 10 = 3456/yr
    assert schedule[0] == (2026, 3456.0)


def test_claimable_in_year_sums_active_investments():
    a = Investment(total_amount=10000.0, deduction_rate=0.36, start_year=2026)
    b = Investment(total_amount=5000.0, deduction_rate=0.36, start_year=2026)
    # a: 360/yr, b: 180/yr → 540 in 2026, 0 in 2050
    assert tax.claimable_in_year([a, b], 2026) == 540.0
    assert tax.claimable_in_year([a, b], 2050) == 0.0


def test_income_statement_breakdowns():
    incomes = [
        Income(channel=IncomeChannel.airbnb, gross_rent=1000.0, cleaning_fee=50.0),
        Income(channel=IncomeChannel.direct, gross_rent=500.0),
    ]
    expenses = [
        Expense(category=ExpenseCategory.cleaning, amount=100.0),
        Expense(category=ExpenseCategory.gas, amount=80.0),
    ]
    stmt = tax.income_statement(incomes, expenses)
    assert stmt.total_income == 1550.0
    assert stmt.total_expenses == 180.0
    assert stmt.net_cash_flow == 1370.0
    assert stmt.income_by_channel["airbnb"] == 1050.0
    assert stmt.expenses_by_category["cleaning"] == 100.0


def test_local_taxes_total():
    expenses = [
        Expense(category=ExpenseCategory.imu, amount=600.0),
        Expense(category=ExpenseCategory.tari, amount=200.0),
        Expense(category=ExpenseCategory.gas, amount=80.0),
    ]
    assert tax.local_taxes_total(expenses, {ExpenseCategory.imu}) == 600.0
    assert tax.local_taxes_total(expenses, tax.LOCAL_TAX_CATEGORIES) == 800.0


def test_regime_comparison_recommends_cheaper():
    incomes = [Income(channel=IncomeChannel.direct, gross_rent=10000.0)]
    expenses = [Expense(category=ExpenseCategory.maintenance, amount=500.0, deductible=True)]
    comp = tax.regime_comparison(incomes, expenses)
    assert comp.cedolare_tax == 2100.0  # 21% of 10000
    assert comp.recommended in ("cedolare", "ordinary")
