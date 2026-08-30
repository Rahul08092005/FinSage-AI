# FinSage AI — Team Repository

Agentic AI FinTech project. 4-person team, one repo, four owned folders.

## Ownership map (do not edit outside your folder without a PR)

| Person | Folder | Stack |
|---|---|---|
| Aditi (P1) | `apps/bff-server/` | Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis |
| Rahul (P2) | `apps/ai-engine/app/agents/`, `app/rag/`, `app/tools/`, `app/graph/`, `app/services/` | Python, FastAPI, LangChain, LangGraph, Gemini/Groq |
| Kavya (P3) | `apps/ai-engine/app/analytics/`, `app/documents/`, `app/adapters/` | Python, Pandas, OCR, PostgreSQL |
| Radhika (P4) | `apps/web/` | Next.js, TypeScript, Tailwind CSS |

Person 2 and Person 3 share the `ai-engine` FastAPI app but never touch each other's subfolders — this is intentional so both can push without merge conflicts.

## Phase 1 — Foundation (see /docs/phase1.docx for full details)

Run everything locally:

```bash
# 1. Start infra
docker compose up -d

# 2. Backend (Aditi)
cd apps/bff-server && npm install && npx prisma migrate dev && npm run dev

# 3. AI engine (Rahul + Kavya)
cd apps/ai-engine && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

# 4. Frontend (Radhika)
cd apps/web && npm install && npm run dev
```

- Frontend: http://localhost:3000
- BFF API: http://localhost:4000
- AI Engine: http://localhost:8000/docs
