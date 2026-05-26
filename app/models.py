"""Database models for the rental accounting tool.

One Italian short-term rental property, the income it earns (split by channel so
we can tell Airbnb-withheld tax from tax you still owe), the expenses to run it,
the capital investments that may qualify for multi-year tax bonuses, and the
scanned invoice documents that back them up.
"""
import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class IncomeChannel(str, Enum):
    airbnb = "airbnb"        # platform withholds cedolare at source
    direct = "direct"        # via your website, paid to your bank, NOT withheld
    booking = "booking"
    other = "other"


class PaymentMethod(str, Enum):
    bank_transfer = "bank_transfer"
    card = "card"
    cash = "cash"
    other = "other"


class ExpenseCategory(str, Enum):
    cleaning = "cleaning"          # cleaning lady
    gas = "gas"
    water = "water"
    electricity = "electricity"
    wifi = "wifi"
    condominio = "condominio"      # community fees
    imu = "imu"                    # property tax
    tari = "tari"                  # waste tax
    insurance = "insurance"
    maintenance = "maintenance"
    platform_fee = "platform_fee"
    other = "other"
    uncategorized = "uncategorized"


class BonusType(str, Enum):
    ristrutturazione = "ristrutturazione"
    ecobonus = "ecobonus"
    sismabonus = "sismabonus"
    none = "none"


class DocumentStatus(str, Enum):
    uploaded = "uploaded"
    extracted = "extracted"
    needs_review = "needs_review"
    confirmed = "confirmed"


class Property(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    address: str = ""
    comune: str = ""
    # Second homes get the 36% renovation rate (vs 50% primary) in 2026.
    is_second_home: bool = True
    purchase_date: Optional[datetime.date] = None
    cadastral_info: str = ""


class Income(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    property_id: Optional[int] = Field(default=None, foreign_key="property.id")
    channel: IncomeChannel = IncomeChannel.airbnb
    # Defaulted by channel (Airbnb=True, direct=False) but editable.
    tax_withheld_at_source: bool = True
    guest_name: str = ""
    check_in: Optional[datetime.date] = None
    check_out: Optional[datetime.date] = None
    nights: int = 0
    gross_rent: float = 0.0
    cleaning_fee: float = 0.0
    platform_commission: float = 0.0
    amount_withheld: float = 0.0     # cedolare withheld by the platform
    net_received: float = 0.0
    payout_date: Optional[datetime.date] = None
    notes: str = ""


class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    stored_path: str
    content_type: str = ""
    source: str = "web"  # web / telegram / email
    status: DocumentStatus = DocumentStatus.uploaded
    # AI-parsed fields (with confidence) + raw response for audit.
    parsed_vendor: str = ""
    parsed_date: Optional[datetime.date] = None
    parsed_total: Optional[float] = None
    parsed_vat: Optional[float] = None
    parsed_category: str = ""
    confidence: float = 0.0
    raw_response: str = ""
    uploaded_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)


class Expense(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    property_id: Optional[int] = Field(default=None, foreign_key="property.id")
    category: ExpenseCategory = ExpenseCategory.uncategorized
    vendor: str = ""
    date: Optional[datetime.date] = None
    amount: float = 0.0
    vat_amount: float = 0.0
    # Traceable payment (bank transfer/card) is required for bonus eligibility.
    payment_method: PaymentMethod = PaymentMethod.bank_transfer
    deductible: bool = False
    recurring: bool = False
    notes: str = ""
    document_id: Optional[int] = Field(default=None, foreign_key="document.id")
    # Flagged when the AI could not confidently assign a category.
    needs_review: bool = False


class Investment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    property_id: Optional[int] = Field(default=None, foreign_key="property.id")
    description: str = ""
    bonus_type: BonusType = BonusType.ristrutturazione
    total_amount: float = 0.0
    deduction_rate: float = 0.36
    start_year: int = Field(default_factory=lambda: datetime.date.today().year)
    payment_method: PaymentMethod = PaymentMethod.bank_transfer
    notes: str = ""
    document_id: Optional[int] = Field(default=None, foreign_key="document.id")
