"""Shared request/response contracts. Person 1 (Node BFF) and Person 4
(frontend) both build against this shape — see the Person1<->Person2
integration contract in the architecture doc.
"""
from typing import Any
from pydantic import BaseModel


class OrchestrateRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    transactions_json: Any = None


class OrchestrateResponse(BaseModel):
    answer: str
    citations: list[str] = []
    metrics: dict = {}
    agent_path: list[str] = []
