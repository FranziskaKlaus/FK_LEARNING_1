"""Property settings."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session

from app.common import get_property
from app.database import get_session
from app.parsing import parse_date
from app.templating import templates

router = APIRouter(prefix="/property")


@router.get("")
def settings(request: Request, session: Session = Depends(get_session)):
    prop = get_property(session)
    return templates.TemplateResponse(
        "property.html", {"request": request, "property": prop, "active": "property"}
    )


@router.post("")
def update_settings(
    session: Session = Depends(get_session),
    name: str = Form(...),
    address: str = Form(""),
    comune: str = Form(""),
    is_second_home: Optional[str] = Form(None),
    purchase_date: Optional[str] = Form(None),
    cadastral_info: str = Form(""),
):
    prop = get_property(session)
    prop.name = name
    prop.address = address
    prop.comune = comune
    prop.is_second_home = is_second_home is not None
    prop.purchase_date = parse_date(purchase_date)
    prop.cadastral_info = cadastral_info
    session.add(prop)
    session.commit()
    return RedirectResponse("/property", status_code=303)
