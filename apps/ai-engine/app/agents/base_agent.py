"""Person 2 (Rahul) owns this file.

Every LangGraph agent (Supervisor, Document, Expense, Analytics, RAG Advisor,
Budget, Goal, Guru, Report) will subclass this in later phases. Phase 1 only
implements the Supervisor so the end-to-end request path can be demoed.
"""
from abc import ABC, abstractmethod


class BaseAgent(ABC):
    name: str = "base_agent"

    @abstractmethod
    def run(self, state: dict) -> dict:
        """Takes the shared LangGraph state dict, returns the updated state."""
        raise NotImplementedError
