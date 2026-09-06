"""Pydantic schemas for AI Engine endpoints."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class OrchestrateRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    document_id: Optional[str] = None
    transactions_json: Optional[str] = None
    goals_json: Optional[str] = None
    domain: Optional[str] = None


class OrchestrateResponse(BaseModel):
    answer: str
    agent_path: List[str]
    citations: Optional[List[str]] = []
    metrics: Optional[Dict[str, Any]] = {}


class RAGSearchRequest(BaseModel):
    query: str
    domain: Optional[str] = None


class RAGIngestRequest(BaseModel):
    domain: str
    content: str
