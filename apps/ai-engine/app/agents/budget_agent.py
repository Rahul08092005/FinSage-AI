"""BudgetAgent: Wraps budget recommendation tool calls and LLM advice."""
from app.agents.base_agent import BaseAgent
from app.tools.budgeting_tools import get_budget_recommendation
from app.services.llm_client import generate


class BudgetAgent(BaseAgent):
    name = "budget_agent"

    def run(self, state: dict) -> dict:
        tx_data = state.get("transactions_json") or ""
        message = state.get("message", "Provide budget recommendations")

        rec = get_budget_recommendation.invoke({"transactions_json": tx_data})

        prompt = (
            "User request: " + str(message) + "\n"
            "Budget Recommendations: " + str(rec) + "\n"
            "Provide actionable, clear, and encouraging budget advice."
        )
        answer = generate(prompt, system="You are the Budget Advisor Agent for FinSage AI.")

        state["answer"] = answer
        state["citations"] = []
        state.setdefault("agent_path", []).append(self.name)
        return state
