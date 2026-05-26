"""Shared Jinja2 templates instance and view helpers."""
from __future__ import annotations

from datetime import date, datetime

from fastapi.templating import Jinja2Templates

from app.config import BASE_DIR
from app.models import (
    BonusType,
    ExpenseCategory,
    IncomeChannel,
    PaymentMethod,
)

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

CATEGORY_LABELS = {
    ExpenseCategory.cleaning: "Cleaning lady",
    ExpenseCategory.gas: "Gas",
    ExpenseCategory.water: "Water",
    ExpenseCategory.electricity: "Electricity",
    ExpenseCategory.wifi: "WiFi / Internet",
    ExpenseCategory.condominio: "Condominio (community)",
    ExpenseCategory.imu: "IMU (property tax)",
    ExpenseCategory.tari: "TARI (waste tax)",
    ExpenseCategory.insurance: "Insurance",
    ExpenseCategory.maintenance: "Maintenance",
    ExpenseCategory.platform_fee: "Platform fee",
    ExpenseCategory.other: "Other",
    ExpenseCategory.uncategorized: "Uncategorized",
}

CHANNEL_LABELS = {
    IncomeChannel.airbnb: "Airbnb (tax withheld)",
    IncomeChannel.direct: "Direct / website (you owe tax)",
    IncomeChannel.booking: "Booking.com",
    IncomeChannel.other: "Other",
}

PAYMENT_LABELS = {
    PaymentMethod.bank_transfer: "Bank transfer",
    PaymentMethod.card: "Card",
    PaymentMethod.cash: "Cash",
    PaymentMethod.other: "Other",
}

BONUS_LABELS = {
    BonusType.ristrutturazione: "Bonus Ristrutturazione",
    BonusType.ecobonus: "Ecobonus",
    BonusType.sismabonus: "Sismabonus",
    BonusType.none: "No bonus",
}


def eur(value: float | None) -> str:
    if value is None:
        return "—"
    return f"€ {value:,.2f}"


def _date(value) -> str:
    if isinstance(value, (date, datetime)):
        return value.strftime("%d %b %Y")
    return "—"


templates.env.filters["eur"] = eur
templates.env.filters["fdate"] = _date
templates.env.globals.update(
    category_labels=CATEGORY_LABELS,
    channel_labels=CHANNEL_LABELS,
    payment_labels=PAYMENT_LABELS,
    bonus_labels=BONUS_LABELS,
    ExpenseCategory=ExpenseCategory,
    IncomeChannel=IncomeChannel,
    PaymentMethod=PaymentMethod,
    BonusType=BonusType,
)
