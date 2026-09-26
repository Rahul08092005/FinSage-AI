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
            "Provide actionable, clear, and encouraging budget advice directly addressing the user's question."
        )
        answer = generate(
            prompt,
            system=(
                "You are the Budget Advisor Agent for FinSage AI in India. "
                "All currency figures are in Indian Rupees (INR, ₹). "
                "Always format currency as ₹ with Indian numbering (e.g. ₹1,850, ₹10,000, ₹1,00,000). "
                "Never use dollar signs ($) or USD. "
                "Directly and accurately answer the user's specific questions based on their real financial numbers."
            ),
        )

        state["answer"] = answer
        state["citations"] = []
        state.setdefault("agent_path", []).append(self.name)
        return state
