# FK_LEARNING_1

Getting to know the programming world. Interested in app programming, augmented reality, sustainability, transparency and the likes.

## Casa Italia — rental accounting tool

A local-first web app to keep clear accounting for an Italian short-term rental
property: income per channel, running costs, renovation investments, and an
overview of the taxes you owe and the deductions you can claim.

> All tax figures are estimates to support you and your commercialista — they
> are not official filings.

### What it does

- **Income** per channel. Airbnb withholds the 21% cedolare tax at source;
  direct/website bookings paid to your bank do not, so the tool tracks what's
  *already paid* vs *still owed by you*.
- **Expenses** by category — cleaning lady, gas/water/electricity/WiFi,
  condominio, IMU, TARI, insurance, maintenance, platform fees.
- **Investments / renovations** (e.g. a new sauna) with the 10-year tax-bonus
  deduction schedule, and a flag when a cash payment may disqualify the bonus.
- **AI invoice scanning** — upload or photograph an invoice and Claude reads the
  vendor, date, total and VAT and suggests a category, creating a draft you
  confirm in one tap. If it can't categorize confidently it flags the item for
  review instead of guessing. Categories are editable on any entry at any time.
- **Tax overview** — cedolare secca (withheld vs owed, per channel), a
  cedolare-vs-ordinary-IRPEF comparison, IMU/TARI totals and reminder dates, and
  renovation-bonus deduction schedules.

### Tech

Python + FastAPI + SQLite (one file you can back up), server-rendered with
Jinja2 and Pico.css. Invoice extraction uses the Anthropic Claude vision API.

### Run it

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# Optional: enable invoice scanning
cp .env.example .env   # then add your ANTHROPIC_API_KEY

./venv/bin/uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000. To reach it from your phone on the same network,
run with `--host 0.0.0.0` and visit `http://<your-computer-ip>:8000`.

Your data lives in `data.db` and uploaded invoices in `app/uploads/` — both are
git-ignored. Back up `data.db` to keep your records safe.

### Tests

```bash
./venv/bin/python -m pytest
```

### Roadmap

- Forward invoices to a **Telegram bot** for hands-free intake (same scan
  pipeline).
- CSV/PDF export for your commercialista.
