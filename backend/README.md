# TRI-MATSYA Backend (FastAPI)

Production-oriented FastAPI backend for the TRI-MATSYA platform.

## Stack
- Python FastAPI
- SQLAlchemy ORM
- PostgreSQL (recommended) or SQLite fallback
- JWT cookie/bearer auth + OTP-ready endpoints
- WhatsApp/n8n webhook-ready endpoints

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env (DATABASE_URL, SECRET_KEY, etc.)
```

### Database
- PostgreSQL: set `DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/trimatsya`
- SQLite fallback (no server needed): `DATABASE_URL=sqlite:///./data/trimatsya.db`

Tables are created automatically on startup and demo/sample data is seeded if empty.

## Run

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Open: http://localhost:8000 (serves existing SPA from `../public` and API on same origin)
Docs: http://localhost:8000/docs

## Key endpoints (spec-aligned + compatibility)
- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/verify-otp`, `GET /fishers/profile` (+ `/api/*` compat)
- Catches/Marketplace: `POST /catches`, `GET /catches/my-listings`, `PUT/PATCH /catches/{id}`, `GET /marketplace`, `GET /marketplace/{id}`
- Orders: `POST /orders`, `GET /orders`, `GET /orders/{id}`
- Waste: `POST /waste/listings`, `GET /waste/listings`, `POST /waste/inspection`
- Logistics: `POST /logistics/pickup`, `GET /logistics/tracking`
- Admin: `GET /admin/dashboard`, `GET /admin/users`, `GET /admin/analytics`
- WhatsApp: `POST /webhooks/whatsapp`, `GET /webhooks/whatsapp`

## Demo accounts (seeded)
- Admin: `admin@trimatsya.in` / `admin123`
- Fisherman: `ravi@trimatsya.in` / `fisher123`
- Buyer: `buyer@trimatsya.in` / `buyer123`
- Processor: `processor@trimatsya.in` / `partner123`

## Notes
- WhatsApp/n8n are **webhook-ready**; actual delivery requires valid API credentials in `.env`.
- OTP endpoint is provider-ready and returns a demo code in non-production console flow.
- Fresh and non-food-grade/waste flows are separated; waste materials require inspection approval.
