# FinSage AI — Team Repository

Agentic AI FinTech project. 4-person team, one repo, four owned folders.

**Current status: Phase 2 — Core Features.** Transactions, Budgets, and Goals
are live, backed by real database-persisted data end to end (browser → BFF →
PostgreSQL). Phase 1's foundation (auth, health checks, AI engine skeleton)
is unchanged underneath.

---

## Ownership map

| Person | Folder | Stack |
|---|---|---|
| Aditi (P1) | `apps/bff-server/` | Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis |
| Rahul (P2) | `apps/ai-engine/app/agents/`, `app/rag/`, `app/tools/`, `app/graph/`, `app/services/` | Python, FastAPI, LangChain, LangGraph, Gemini/Groq |
| Kavya (P3) | `apps/ai-engine/app/analytics/`, `app/documents/`, `app/adapters/` | Python, Pandas, OCR, PostgreSQL |
| Radhika (P4) | `apps/web/` | Next.js, TypeScript, Tailwind CSS |

Person 2 and Person 3 share the `ai-engine` FastAPI app but never touch each
other's subfolders. `app/main.py` is the one shared entrypoint file, owned by
Rahul.

---

## What's working in Phase 2

- **Auth** — register/login issuing a JWT (Phase 1, unchanged).
- **Transactions** — full CRUD, scoped per user, paginated, filterable by
  category and date range.
- **Expenses** — read-only category-breakdown summary over the transactions
  table.
- **Budgets** — set a monthly limit per category; live variance (spent vs.
  limit) computed against real transactions.
- **Goals** — create savings goals with a title, target amount, and deadline.
- **Frontend** — Dashboard, Transactions, Budgets, and Goals pages all
  consume the live BFF APIs (no mock data). A minimal login/register gate
  (`AuthGate`) handles the JWT round-trip in the browser.
- **AI engine** — Supervisor agent now routes between a general reply and a
  spending-summary tool call; the first LangChain tool wraps Kavya's
  deterministic `calculate_monthly_spending()`; a pgvector-backed store and
  an embeddings function are in place as the RAG foundation (not yet wired
  into a retrieval flow — that's Phase 3).

---

## Folder structure

```
finsage-ai/
├── docker-compose.yml        # Postgres (pgvector) + Redis
├── apps/
│   ├── bff-server/            # Aditi — Node/Express/Prisma
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── routes/        # auth, transactions, expenses, budgets, goals, health
│   │       ├── controllers/
│   │       ├── middleware/    # JWT auth guard
│   │       └── lib/           # prisma + redis clients
│   ├── ai-engine/             # Rahul + Kavya — Python/FastAPI
│   │   └── app/
│   │       ├── agents/, graph/, services/, rag/, tools/, schemas/   # Rahul
│   │       └── analytics/, documents/, adapters/                    # Kavya
│   └── web/                   # Radhika — Next.js
│       ├── app/                # dashboard, transactions, budgets, goals pages
│       ├── components/         # Navbar, Sidebar, Card, AuthGate, TransactionsTable, BudgetCard, GoalCard
│       └── lib/api.ts          # single BFF client
```

---

## Running it locally

### 1. Start shared infrastructure

```bash
docker compose up -d
docker ps        # confirm finsage-postgres and finsage-redis are Up
```

### 2. Backend (Aditi)

```bash
cd apps/bff-server
cp .env.example .env          # first time only
npm install
npx prisma migrate dev --name phase2_core_tables   # creates transactions/budgets/goals tables
npm run dev                   # http://localhost:4000
```

### 3. AI engine (Rahul + Kavya)

```bash
cd apps/ai-engine
cp .env.example .env          # first time only — add GROQ_API_KEY or GEMINI_API_KEY if you have one
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000   # http://localhost:8000/docs
```

### 4. Frontend (Radhika)

```bash
cd apps/web
cp .env.local.example .env.local   # first time only
npm install
npm run dev                   # http://localhost:3000
```

### 5. Try it end to end

1. Open `http://localhost:3000/transactions`, register a demo user.
2. Add a transaction — it appears in the table instantly.
3. Set a budget on `/budgets` for the same category, add a transaction in
   that category, and confirm the spend bar updates.
4. Add a goal on `/goals`.

**Verifying Postgres directly:**

```bash
docker exec -it finsage-postgres psql -U finsage -d finsage_db
\dt        -- should list: users, accounts, transactions, budgets, goals
```

**Verifying Redis directly:**

```bash
docker exec -it finsage-redis redis-cli
PING       -- should reply PONG
```

---

## Completed workflows

These are the full, working user journeys — each one tested end to end
through the actual UI, hitting the real BFF API, persisted in PostgreSQL.

### 1. Register → Login
1. User opens `/transactions` (or `/budgets`, `/goals`) with no session yet.
2. `AuthGate` shows a login/register form.
3. User registers with name, email, password → `POST /api/v1/auth/register`
   → BFF hashes the password (bcrypt), creates a `User` row, returns a JWT.
4. Token is stored in `localStorage`; the page reloads and the form is
   replaced by the real page content.
5. On a later visit, the same user logs in with email/password →
   `POST /api/v1/auth/login` → same JWT flow.

**Status: complete.**

### 2. Add and view a transaction
1. From `/transactions`, user fills in amount, description, category and
   clicks Add → `POST /api/v1/transactions` (JWT-authenticated).
2. BFF validates the payload (zod), writes a `Transaction` row scoped to
   `userId`, returns the created record.
3. Frontend re-fetches the list → `GET /api/v1/transactions` → the new
   transaction appears in the table immediately, newest first.
4. Transaction is deletable from the same row → `DELETE /api/v1/transactions/:id`.

**Status: complete.**

### 3. Set a budget and see live variance
1. From `/budgets`, user picks a category and a monthly limit, clicks
   "Set budget" → `POST /api/v1/budgets` (creates or updates that
   category's limit for the user).
2. User adds a transaction in that same category (workflow 2).
3. `/budgets` re-fetches → `GET /api/v1/budgets/variance` → BFF sums this
   month's transactions per category and returns `{ limit, spent,
   remaining }` per budget.
4. UI renders a progress bar per category; the bar turns red once spend
   exceeds the limit.

**Status: complete.**

### 4. Create a savings goal
1. From `/goals`, user enters a title, target amount, and target date,
   clicks "Add goal" → `POST /api/v1/goals`.
2. BFF creates a `Goal` row scoped to the user.
3. `/goals` re-fetches → `GET /api/v1/goals` → the new goal appears in the
   list with its target amount and deadline.
4. Goal is deletable → `DELETE /api/v1/goals/:id`.

**Status: complete.**

### 5. Category-wise expense summary
1. Any client can call `GET /api/v1/expenses/summary` (optionally with
   `?month=YYYY-MM`) once transactions exist.
2. BFF groups the user's transactions by category via Prisma's `groupBy`,
   returning per-category totals, counts, and an overall total.

**Status: complete** (API-level; not yet surfaced as its own page — planned
for the Dashboard in Phase 3).

### 6. AI Supervisor round-trip (spending question)
1. A message plus the user's transactions (as JSON) is sent to
   `POST /internal/ai/orchestrate` on the AI engine.
2. The Supervisor agent detects spending-related keywords, calls the
   `get_spending_summary` LangChain tool, which runs Kavya's deterministic
   `calculate_monthly_spending()` against the transactions.
3. The numeric summary is handed to the LLM (Groq/Gemini, with a safe mock
   fallback if no API key is set) to produce a short natural-language
   explanation.
4. Response returns `{ answer, metrics, agent_path }` to the caller.

**Status: complete at the API level**, via `/docs` on the AI engine or a
direct call from the BFF; no chat UI yet (planned for Phase 3's AI Advisor
page).



All routes below except `/health` and `/auth/*` require
`Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | BFF + Postgres + Redis status |
| POST | `/api/v1/auth/register` | Create a user, returns JWT |
| POST | `/api/v1/auth/login` | Returns JWT |
| GET | `/api/v1/transactions` | List transactions (paginated, filterable) |
| POST | `/api/v1/transactions` | Create a transaction |
| PATCH | `/api/v1/transactions/:id` | Update a transaction |
| DELETE | `/api/v1/transactions/:id` | Delete a transaction |
| GET | `/api/v1/expenses/summary` | Category totals, optional `?month=YYYY-MM` |
| GET | `/api/v1/budgets` | List budgets |
| GET | `/api/v1/budgets/variance` | Budget vs. actual spend this month |
| POST | `/api/v1/budgets` | Create/update a budget for a category |
| DELETE | `/api/v1/budgets/:id` | Delete a budget |
| GET | `/api/v1/goals` | List goals |
| POST | `/api/v1/goals` | Create a goal |
| DELETE | `/api/v1/goals/:id` | Delete a goal |

Internal, AI-engine-only endpoints (called by the BFF, not the browser):
`POST /internal/ai/orchestrate`, `POST /internal/analytics/normalize`,
`POST /internal/analytics/category-breakdown`.

---

## Known issue fixed this phase

The Transactions/Budgets/Goals pages initially crashed with
`Error: Functions are not valid as a child of Client Components`. Cause:
those three `page.tsx` files were Server Components by default, but
`AuthGate` passes its `children` as a function (a render prop), which can't
cross the server→client boundary. Fix: added `"use client"` to the top of
`app/transactions/page.tsx`, `app/budgets/page.tsx`, and `app/goals/page.tsx`.
The Dashboard page doesn't use `AuthGate`, so it was never affected.

---

## This week's submission checklist

- [x] **Completed workflows** — see the "Completed workflows" section above:
      6 end-to-end flows (auth, transactions, budgets, goals, expense
      summary, AI orchestrate) all tested through the real UI and API.
- [x] **Working API endpoints** — all 14 routes above tested and returning
      correct status codes and shapes.
- [x] **Interactive UI/UX** — delete actions on all three list views,
      loading states, inline success feedback, logout, and disabled-state
      buttons on incomplete forms.

---

## Next up — Phase 3

Async document processing (OCR pipeline via Redis queues), the 5 RAG
domains fully wired into retrieval, and the first three real LangGraph
agents (Document, Expense, RAG Advisor). See the Phase 1 Team Plan document
for the full 7-phase roadmap.