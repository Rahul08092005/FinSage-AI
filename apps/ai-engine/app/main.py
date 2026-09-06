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
from app.rag.domains import route_to_domain
from app.rag.ingest import search_domain, ingest_text
from app.schemas.advisor import (
    OrchestrateRequest,
    OrchestrateResponse,
    RAGSearchRequest,
    RAGIngestRequest,
)

load_dotenv()

app = FastAPI(title="FinSage AI Engine", version="0.1.0")

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
    result = run_supervisor_graph(
        user_id=req.user_id,
        session_id=req.session_id,
        message=req.message,
        document_id=req.document_id,
        transactions_json=req.transactions_json,
        goals_json=req.goals_json,
        domain=req.domain,
    )
    return OrchestrateResponse(
        answer=result.get("answer", ""),
        agent_path=result.get("agent_path", []),
        citations=result.get("citations", []),
        metrics=result.get("metrics", {}),
    )


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
