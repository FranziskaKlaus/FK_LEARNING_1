"""FastAPI application entry point for the Italian rental accounting tool."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from app.config import BASE_DIR
from app.database import engine, init_db
from app.models import Property
from app.routers import dashboard, documents, expenses, income, investments, properties

app = FastAPI(title="Casa Italia — Rental Accounting")

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

app.include_router(dashboard.router)
app.include_router(income.router)
app.include_router(expenses.router)
app.include_router(investments.router)
app.include_router(documents.router)
app.include_router(properties.router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    # Seed a single property so the app is usable immediately.
    with Session(engine) as session:
        if not session.exec(select(Property)).first():
            session.add(Property(name="My Italian house", is_second_home=True))
            session.commit()


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}
