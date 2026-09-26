"""Pydantic schemas for AI Engine endpoints."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class OrchestrateRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    document_id: Optional[str] = None
    transactions_json: Any = None
    goals_json: Optional[str] = None
    domain: Optional[str] = None
    income: Optional[float] = None
    current_80c_investments: Optional[float] = None
    current_investments: Optional[float] = None


class GuruPerspective(BaseModel):
    label: str
    summary: str
    reasoning: str
    title: Optional[str] = None
    recommendation: Optional[str] = None
    content: Optional[str] = None


class OrchestrateResponse(BaseModel):
    answer: str
    agent_path: List[str] = []
    citations: Optional[List[str]] = []
    metrics: Optional[Dict[str, Any]] = {}
    guru_perspectives: Optional[List[GuruPerspective]] = None


class ForecastRequest(BaseModel):
    transactions: List[Dict[str, Any]] = []
    months_ahead: int = 1


class WhatIfRequest(BaseModel):
    transactions: List[Dict[str, Any]] = []
    category_adjustments: Optional[Dict[str, float]] = None
    income_adjustment: Optional[float] = None
    monthly_salary: Optional[float] = None
    scenario_type: Optional[str] = "what_if_simulation"
    parameters: Optional[Dict[str, Any]] = None


class RAGSearchRequest(BaseModel):
    query: str
    domain: Optional[str] = None


class RAGIngestRequest(BaseModel):
    domain: str
    content: str
