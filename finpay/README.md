# FinPay: Campus digital wallet (v2)

Node.js + Express, React + Vite, SQLite. Pay campus merchants, add money, earn realistic tiered cashback, and reconcile it monthly.

## Run it (about 2 minutes)

Requirements: **Node.js 20+** and npm. Open two terminals.

**Terminal 1, backend**
```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev
```
You should see `FinPay API running at http://localhost:4000`. On first start it creates the SQLite database and three demo students with ~45 days of history.

**Terminal 2, frontend**
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**, choose a student, and click *Open wallet*. Tick "Sign in as finance admin" to see the Reconciliation page.

Tests: `cd backend && npm test` (21 tests). Production build: `cd frontend && npm run build`.

To reset all demo data, stop the backend and delete `backend/data/`.

## What's new in v2

**More realistic cashback**
| Rule | Detail |
|---|---|
| Lower, believable rates | 0.25% (hostel) to 2% (stationery, online). Canteen 1.5%, transport 1.5% |
| Minimum payment to qualify | e.g. ₹20 at canteens, ₹100 online, ₹500 for hostel dues |
| Per-payment ceiling | e.g. ₹10 at canteens, ₹50 for hostel |
| Monthly cap per category | scales with tier |
| Monthly ceiling across all categories | Basic ₹150, Prime ₹250, Premium ₹400 |
| Tier boost | Basic 1x, Prime 1.25x, Premium 1.5x on the rate (caps 1x / 1.5x / 2x) |
| Exact maths | integer basis-point arithmetic, always floored, no float drift |
| Explained | every payment stores *why* cashback was reduced (below minimum, per-payment cap, monthly cap, ceiling) |

Rates and limits live in `backend/src/config/rules.js`.

**More realistic wallet**
- Real **top-up flow** (UPI / card / net banking, simulated gateway) with min/max limits and a ₹20,000 balance ceiling. Top-ups earn no cashback and are reported separately in reconciliation.
- Safety limits: ₹5,000 per payment, ₹10,000 per day.
- 10 merchants across 5 categories, receipt references (`FP261106K7M2QX`), balance-after on every transaction.
- Idempotency keys also reject re-use with a different amount or merchant (HTTP 422).
- Month and day boundaries use **IST**, not UTC.
- Realistic seeded history, so charts and monthly caps are populated from the first launch.

**New UI**
- Wallet card, live cashback quote while typing an amount, confirm sheet, animated receipt.
- Dashboard with 14-day spending chart, category donut, daily limit and cashback-ceiling meters.
- Rewards page: per-category cap progress and tier comparison.
- Activity page with filters, search and tappable receipts.
- Admin reconciliation (admin only) with effective cashback rate per category, plus wallet list.
- Responsive, with a bottom tab bar on phones.

## API

All routes except health and the dev token require `Authorization: Bearer <JWT>`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/dev/token` | Local demo token (disabled in production) |
| GET | `/api/me`, `/api/wallet`, `/api/merchants`, `/api/rules` | Identity, wallet, merchants, rules and limits |
| GET | `/api/insights` | Monthly spend/cashback, per-category caps, 14-day chart data |
| GET | `/api/transactions?limit=` | Wallet ledger (payments and top-ups) |
| POST | `/api/cashback/preview` | `{merchantId, amount}`: exact quote including all caps |
| POST | `/api/payments` | `{merchantId, amount}` + `Idempotency-Key` header |
| POST | `/api/wallet/topup` | `{amount, method: UPI\|CARD\|NETBANKING}` + `Idempotency-Key` |
| GET | `/api/admin/reconciliation/:month` | `YYYY-MM`, admin role |
| GET | `/api/admin/wallets` | Admin role |

Note: `/cashback/preview` now takes `merchantId` (not `category`/`tier`) and applies the same caps as a real payment.

## Layout
```
backend/src/  config/ (rules, limits)  db/ (schema, seed)  middleware/ (JWT)
              repositories/  routes/  services/ (cashback, payment, topup, insights, reconciliation)
frontend/src/ pages/ (Login, Home, Pay, TopUp, Rewards, History, Admin)  ui.jsx  api.js  style.css
```

## Authentication
Unchanged: FinPay verifies TalentHub-issued JWTs (HS256 `JWT_SECRET` or RS256 `JWT_PUBLIC_KEY`, optional issuer/audience, `sub` = student id, `role` = ADMIN/FINANCE_ADMIN). `/api/dev/token` exists for local demos only. Match TalentHub's real claims and keys before any production use.

## Limitations
- The top-up gateway is simulated: no real money moves.
- SQLite is for demos. Use PostgreSQL for multi-instance deployments.
- When the schema version changes, demo tables are rebuilt automatically (fine for this starter, not for production).
