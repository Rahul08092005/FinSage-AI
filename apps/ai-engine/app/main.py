"""Shared entry point — do not add feature logic here.
Import from app/agents, app/analytics, app/documents instead."""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.analytics.spending import (
    calculate_monthly_spending,
    calculate_category_breakdown,
    calculate_budget_recommendation,
    detect_anomalies,
    calculate_health_score,
)
from app.analytics.csv_parser import parse_transactions_csv
from app.analytics.normalization import normalize_batch
from app.analytics.ml_categorizer import train_categorizer, retrain_from_corrections
from app.documents.ocr_adapter import OCRAdapter
from app.documents.pipeline import process_document
from app.adapters.splitwise_adapter import SplitwiseAdapter, calculate_group_balances
from app.graph.supervisor import run_supervisor_graph
from app.schemas.advisor import OrchestrateRequest, OrchestrateResponse
import pandas as pd

load_dotenv()

app = FastAPI(title="FinSage AI Engine", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in later phases
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    ocr = OCRAdapter()
    return {
        "service": "finsage-ai-engine",
        "status": "ok",
        "ocr_available": ocr.health_check(),
    }


@app.post("/internal/ai/orchestrate", response_model=OrchestrateResponse)
def orchestrate(req: OrchestrateRequest):
    """Person 2's endpoint. Called by the Node BFF, never directly by the frontend."""
    result = run_supervisor_graph(req.user_id, req.session_id, req.message)
    return OrchestrateResponse(**result)


@app.post("/internal/analytics/demo-spending")
async def demo_spending(csv_text: str):
    """Person 3's endpoint — Phase 1 proof that CSV -> pandas -> metrics works.
    Not exposed to the frontend directly; the BFF will wrap this in Phase 2."""
    df = parse_transactions_csv(csv_text.encode("utf-8"))
    return calculate_monthly_spending(df)


@app.post("/internal/analytics/normalize")
async def normalize(raw_rows: list[dict], source: str = "manual"):
    """Person 3's Phase 2 endpoint — normalizes and categorizes a batch of
    raw transaction rows, called by the BFF before storing them via Prisma."""
    return normalize_batch(raw_rows, source)


@app.post("/internal/analytics/category-breakdown")
async def category_breakdown(transactions: list[dict]):
    """Person 3's Phase 2 endpoint — category totals + percentage share,
    called by the BFF for the Budget/Dashboard pages."""
    return calculate_category_breakdown(transactions)


# ---------------------------------------------------------------------------
# Phase 3 — Document processing (Step 4)
# ---------------------------------------------------------------------------


from pydantic import BaseModel


class DocumentProcessRequest(BaseModel):
    file_path: str
    doc_type: str


@app.post("/internal/documents/process")
async def document_process(req: DocumentProcessRequest):
    """Person 3's Phase 3 endpoint — parses a receipt or bank-statement PDF,
    normalises the extracted rows, and returns the result with a confidence
    score.  Called by Aditi's worker (BFF Step 3) — response shape is
    contractual: { transactions: [...], confidence: float }."""
    return process_document(req.file_path, req.doc_type)


# ---------------------------------------------------------------------------
# Phase 3 — Splitwise adapter (Step 7)
# ---------------------------------------------------------------------------


@app.get("/internal/adapters/splitwise/groups/{group_id}")
async def splitwise_group(group_id: str):
    """Person 3's Step 7 endpoint — returns normalised shared-expense
    transactions plus per-member balance math for a mock Splitwise group."""
    adapter = SplitwiseAdapter()
    raw = adapter.fetch_data(user_id="", params={"group_id": group_id})
    normalised = adapter.normalize_data(raw)
    balances = calculate_group_balances(raw)
    return {"transactions": normalised, "balances": balances}


# ---------------------------------------------------------------------------
# Phase 3 — CSV bulk import (Step 8)
# ---------------------------------------------------------------------------


@app.post("/internal/analytics/parse-csv-transactions")
async def parse_csv_transactions(csv_text: str):
    """Person 3's Step 8 endpoint — parses raw CSV text and returns individual
    normalised rows (not an aggregate summary).  Aditi's worker creates one
    Transaction per row from this response."""
    df = parse_transactions_csv(csv_text.encode("utf-8"))
    raw_rows = df.to_dict(orient="records")
    return normalize_batch(raw_rows, source="csv")


# ---------------------------------------------------------------------------
# Phase 3 — Budget recommendation, anomaly detection, health score (Step 9)
# ---------------------------------------------------------------------------


@app.post("/internal/analytics/budget-recommendation")
async def budget_recommendation(transactions: list[dict]):
    """Person 3's Step 9 endpoint — suggests per-category monthly spending
    limits based on the user's historical average + 10% heuristic buffer."""
    df = pd.DataFrame(transactions)
    if not df.empty and "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
    return calculate_budget_recommendation(df)


@app.post("/internal/analytics/anomalies")
async def anomalies(transactions: list[dict]):
    """Person 3's Step 9 endpoint — flags transactions whose amount is > 2
    standard deviations above the per-category mean (min 4 transactions per
    category to compute a meaningful stddev)."""
    df = pd.DataFrame(transactions)
    if not df.empty and "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
    return detect_anomalies(df)


class HealthScoreRequest(BaseModel):
    transactions: list[dict]
    budgets: dict = {}
    goals: list[dict] = []
    total_income: float = 0.0


@app.post("/internal/analytics/health-score")
async def health_score(req: HealthScoreRequest):
    """Person 3's Step 9 endpoint — returns a 0-100 financial health score.
    This is exactly what Aditi's GET /api/v1/analytics/health-score proxies to.
    Response shape: { score: int, breakdown: dict }."""
    df = pd.DataFrame(req.transactions)
    if not df.empty and "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
    return calculate_health_score(df, req.budgets, req.goals, req.total_income)


# ---------------------------------------------------------------------------
# Phase 3 — ML categorizer retraining (Step 10)
# ---------------------------------------------------------------------------


@app.post("/internal/analytics/retrain-categorizer")
async def retrain_categorizer(corrected_transactions: list[dict]):
    """Person 3's Step 10 endpoint — accepts a list of hand-corrected
    {description, category} pairs and re-fits the ML categorizer so that
    subsequent calls to categorize_transaction() reflect the corrections."""
    retrain_from_corrections(corrected_transactions)
    return {"status": "ok", "retrained_on": len(corrected_transactions)}
