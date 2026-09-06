<<<<<<< HEAD
"""Pydantic schemas for AI Engine endpoints."""
from typing import Optional, List, Dict, Any
=======
"""Shared request/response contracts. Person 1 (Node BFF) and Person 4
(frontend) both build against this shape — see the Person1<->Person2
integration contract in the architecture doc.
"""
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
from pydantic import BaseModel


class OrchestrateRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
<<<<<<< HEAD
    document_id: Optional[str] = None
    transactions_json: Optional[str] = None
    goals_json: Optional[str] = None
    domain: Optional[str] = None
=======
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030


class OrchestrateResponse(BaseModel):
    answer: str
<<<<<<< HEAD
    agent_path: List[str]
    citations: Optional[List[str]] = []
    metrics: Optional[Dict[str, Any]] = {}


class RAGSearchRequest(BaseModel):
    query: str
    domain: Optional[str] = None


class RAGIngestRequest(BaseModel):
    domain: str
    content: str
=======
    citations: list[str] = []
    metrics: dict = {}
    agent_path: list[str] = []
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
