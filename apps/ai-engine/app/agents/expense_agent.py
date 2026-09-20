"""ExpenseAgent: Standalone agent wrapping spending summary tool calls."""
from app.agents.base_agent import BaseAgent
from app.tools.analytics_tools import get_spending_summary
from app.services.llm_client import generate


class ExpenseAgent(BaseAgent):
    name = "expense_agent"

    def run(self, state: dict) -> dict:
        tx_data = state.get("transactions_json", "")
        message = state.get("message", "Expense summary")

        summary = get_spending_summary.invoke({"transactions_json": tx_data})

        prompt = (
            "User message: " + str(message) + "\n"
            "Calculated Spending Summary: " + str(summary) + "\n"
            "Provide a direct, accurate, and friendly breakdown answering the user's question using their real numbers."
        )
        answer = generate(
            prompt,
            system=(
                "You are the Expense Agent for FinSage AI in India. "
                "All currency figures are in Indian Rupees (INR, ₹). "
                "Always format currency as ₹ with Indian numbering (e.g. ₹1,850, ₹10,000, ₹1,00,000). "
                "Never use dollar signs ($) or USD. "
                "Directly and accurately answer the user's specific questions based on their real financial numbers."
            ),
        )

        state["answer"] = answer
        state.setdefault("agent_path", []).append(self.name)
        return state
