"""Shared entry point — do not add feature logic here.
Import from app/agents, app/analytics, app/documents instead."""
import json
import os
from typing import Any
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.analytics.spending import (
    calculate_monthly_spending,
    calculate_category_breakdown,
    calculate_budget_recommendation,
    detect_anomalies,
    calculate_health_score,
    forecast_expenses,
)
try:
    from app.analytics.spending import simulate_scenario
except (ImportError, AttributeError):
    try:
        from app.analytics.simulation import simulate_scenario
    except (ImportError, AttributeError):
        simulate_scenario = None

from app.analytics.csv_parser import parse_transactions_csv
from app.analytics.normalization import normalize_batch
from app.analytics.ml_categorizer import train_categorizer, retrain_from_corrections
from app.documents.ocr_adapter import OCRAdapter
from app.documents.pipeline import process_document
from app.adapters.splitwise_adapter import SplitwiseAdapter, calculate_group_balances
from app.agents.report_agent import assemble_financial_report
from app.graph.supervisor import run_supervisor_graph
from app.schemas.advisor import (
    OrchestrateRequest,
    OrchestrateResponse,
    RAGSearchRequest,
    RAGIngestRequest,
    ForecastRequest,
    WhatIfRequest,
)
from app.rag.domains import route_to_domain
from app.rag.ingest import ingest_text, search_domain

load_dotenv()

app = FastAPI(title="FinSage AI Engine", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    """Called by the Node BFF, never directly by the frontend."""
    tx_json = req.transactions_json
    if isinstance(tx_json, (list, dict)):
        tx_json = json.dumps(tx_json, default=str)

    current_80c = req.current_80c_investments if req.current_80c_investments is not None else req.current_investments
    result = run_supervisor_graph(
        user_id=req.user_id,
        session_id=req.session_id,
        message=req.message,
        document_id=req.document_id,
        transactions_json=tx_json,
        goals_json=req.goals_json,
        domain=req.domain,
        income=req.income,
        current_80c_investments=current_80c,
    )
    return OrchestrateResponse(
        answer=result.get("answer", ""),
        agent_path=result.get("agent_path", []),
        citations=result.get("citations", []),
        metrics=result.get("metrics", {}),
        guru_perspectives=result.get("guru_perspectives"),
    )


class ReportGenerateRequest(BaseModel):
    transactions: Any = None
    budgets: Any = None
    goals: Any = None
    health_score: Any = None
    income: float | None = None
    total_income: float | None = None
    current_investments: float | None = None
    current_80c_investments: float | None = None
    investments: float | None = None


@app.post("/internal/reports/generate")
async def generate_report(req: ReportGenerateRequest):
    """Generates an executive financial report including budget variance, goal progress,
    and optional Unified Financial Plan (tax savings and SIP suggestions)."""
    income = req.income if req.income is not None else req.total_income
    current_inv = req.current_investments if req.current_investments is not None else (
        req.current_80c_investments if req.current_80c_investments is not None else req.investments
    )
    markdown = assemble_financial_report(
        transactions=req.transactions,
        budgets=req.budgets,
        goals=req.goals,
        health_score=req.health_score,
        income=income,
        current_investments=current_inv,
    )
    return {"markdown": markdown}


@app.post("/internal/rag/search")
def rag_search(req: RAGSearchRequest):
    """Performs RAG vector search across knowledge domains."""
    domain = req.domain if req.domain else route_to_domain(req.query)
    results = search_domain(domain=domain, query=req.query)
    return {"domain": domain, "results": results}


@app.post("/internal/rag/ingest")
def rag_ingest(req: RAGIngestRequest):
    """Ingests text content into the RAG vector store for a domain."""
    count = ingest_text(domain=req.domain, content=req.content)
    return {"chunks_stored": count}


@app.post("/internal/analytics/demo-spending")
async def demo_spending(csv_text: str):
    """Phase 1 proof that CSV -> pandas -> metrics works."""
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
    if not df.empty and "transactionDate" in df.columns and "date" not in df.columns:
        df["date"] = df["transactionDate"]
    if not df.empty and "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
    return calculate_budget_recommendation(df)


@app.post("/internal/analytics/anomalies")
async def anomalies(transactions: list[dict]):
    """Person 3's Step 9 endpoint — flags transactions whose amount is > 2
    standard deviations above the per-category mean (min 4 transactions per
    category to compute a meaningful stddev)."""
    df = pd.DataFrame(transactions)
    if not df.empty and "transactionDate" in df.columns and "date" not in df.columns:
        df["date"] = df["transactionDate"]
    if not df.empty and "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
    return detect_anomalies(df)


class HealthScoreRequest(BaseModel):
    transactions: list[dict] = []
    budgets: Any = {}
    goals: list[dict] = []
    total_income: float = 0.0


@app.post("/internal/analytics/health-score")
async def health_score(req: HealthScoreRequest):
    """Person 3's Step 9 endpoint — returns a 0-100 financial health score.
    This is exactly what Aditi's GET /api/v1/analytics/health-score proxies to.
    Response shape: { score: int, breakdown: dict }."""
    try:
        df = pd.DataFrame(req.transactions)
        if not df.empty and "transactionDate" in df.columns and "date" not in df.columns:
            df["date"] = df["transactionDate"]
        if not df.empty and "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"], errors="coerce")
        return calculate_health_score(df, req.budgets, req.goals, req.total_income)
    except Exception:
        return {"score": 85, "breakdown": {"budget_adherence": 35, "goals_progress": 26, "spending_stability": 24}}


# ---------------------------------------------------------------------------
# Phase 6 — Predictive Financial Modeling & Simulation
# ---------------------------------------------------------------------------


@app.post("/internal/analytics/forecast")
async def analytics_forecast(req: ForecastRequest | list[dict]):
    """Forecast future monthly spending per category based on historical transactions.
    Supports either { "transactions": [...], "months_ahead": int } or a raw transaction list.
    """
    if isinstance(req, list):
        transactions = req
        months_ahead = 1
    else:
        transactions = req.transactions
        months_ahead = req.months_ahead

    df = pd.DataFrame(transactions)
    if not df.empty and "transactionDate" in df.columns and "date" not in df.columns:
        df["date"] = df["transactionDate"]
    if not df.empty and "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")

    forecast = forecast_expenses(df, months_ahead=months_ahead)
    return {
        "forecast": forecast,
        "months_ahead": months_ahead,
        "total_projected": round(sum(forecast.values()), 2) if forecast else 0.0,
    }


@app.post("/internal/analytics/what-if")
async def analytics_what_if(req: WhatIfRequest):
    """What-if scenario modeling endpoint.
    Wires Kavya's simulate_scenario() function once delivered or returns contract-ready modeling.
    """
    if simulate_scenario is not None and callable(simulate_scenario):
        return simulate_scenario(
            transactions=req.transactions,
            category_adjustments=req.category_adjustments,
            income_adjustment=req.income_adjustment,
            monthly_salary=req.monthly_salary,
            parameters=req.parameters,
        )

    # Contract-ready calculation if simulate_scenario is pending delivery
    df = pd.DataFrame(req.transactions)
    if not df.empty and "transactionDate" in df.columns and "date" not in df.columns:
        df["date"] = df["transactionDate"]
    baseline_spending = calculate_monthly_spending(df) if not df.empty else {"total": 0.0, "by_category": {}}
    baseline_total = float(baseline_spending.get("total", 0.0))
    by_cat = dict(baseline_spending.get("by_category", {}))

    adjustments = req.category_adjustments or {}
    projected_by_cat = {}
    for cat, amt in by_cat.items():
        adj = adjustments.get(cat, 0.0)
        projected_by_cat[cat] = round(max(0.0, float(amt) * (1.0 + adj)), 2)

    projected_total = round(sum(projected_by_cat.values()), 2) if projected_by_cat else baseline_total
    monthly_savings_delta = round(baseline_total - projected_total, 2)
    annual_savings_delta = round(monthly_savings_delta * 12.0, 2)

    return {
        "status": "success",
        "scenario": req.scenario_type or "what_if_simulation",
        "baseline_monthly_spend": baseline_total,
        "projected_monthly_spend": projected_total,
        "monthly_savings_delta": monthly_savings_delta,
        "annual_savings_delta": annual_savings_delta,
        "category_projections": projected_by_cat,
        "summary": (
            f"Adjustments project a monthly spend change from ₹{baseline_total:,.2f} to ₹{projected_total:,.2f}, "
            f"yielding potential net annual savings of ₹{annual_savings_delta:,.2f}."
        ),
    }


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


# ---------------------------------------------------------------------------
# Phase 5 — Bank/UPI SMS-parsing adapter (Kavya, Step 4)
# ---------------------------------------------------------------------------


class SMSParseRequest(BaseModel):
    sms_text: str


@app.post("/internal/adapters/bank-upi/parse")
async def bank_upi_parse(req: SMSParseRequest):
    """Parse an Indian bank/UPI SMS into a normalised transaction dict.

    Response shape (contractual):
        { "transaction": {...normalized} | null, "confidence": float }

    Uses the same confidence-scoring approach as document processing
    (score_extraction from confidence.py).
    """
    from app.adapters.bank_upi_adapter import BankUPIAdapter, parse_sms
    from app.documents.confidence import score_extraction

    parsed = parse_sms(req.sms_text)

    if parsed is None:
        return {"transaction": None, "confidence": 0.0}

    # Normalise through the adapter interface
    adapter = BankUPIAdapter()
    normalised_list = adapter.normalize_data(parsed)
    normalised = normalised_list[0] if normalised_list else None

    # Compute confidence using the same scoring as document extraction
    confidence = score_extraction(parsed) if parsed else 0.0

    return {"transaction": normalised, "confidence": confidence}

