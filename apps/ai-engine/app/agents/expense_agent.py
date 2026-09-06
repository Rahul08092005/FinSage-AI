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
            "Provide a friendly, insightful breakdown of the user's spending summary."
        )
        answer = generate(prompt, system="You are the Expense Agent for FinSage AI.")

        state["answer"] = answer
        state.setdefault("agent_path", []).append(self.name)
        return state
