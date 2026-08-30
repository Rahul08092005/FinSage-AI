"""Shared entry point — do not add feature logic here.
Import from app/agents, app/analytics, app/documents instead."""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.analytics.spending import calculate_monthly_spending
from app.analytics.csv_parser import parse_transactions_csv
from app.documents.ocr_adapter import OCRAdapter
from app.graph.supervisor import run_supervisor_graph
from app.schemas.advisor import OrchestrateRequest, OrchestrateResponse

load_dotenv()

app = FastAPI(title="FinSage AI Engine", version="0.1.0")

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
