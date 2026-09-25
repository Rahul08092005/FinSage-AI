"""AnalyticsAgent: Performs category breakdown analysis and LLM explanation."""
from app.agents.base_agent import BaseAgent
from app.services.llm_client import generate


class AnalyticsAgent(BaseAgent):
    name = "analytics_agent"

    def run(self, state: dict) -> dict:
        tx_data = state.get("transactions_json", "")
        message = state.get("message", "Analyze spending categories")

        if isinstance(tx_data, str) and tx_data.strip():
            try:
                import json
                parsed = json.loads(tx_data)
                if isinstance(parsed, list):
                    tx_data = parsed
            except Exception:
                pass

        try:
            from app.analytics.spending import calculate_category_breakdown
            breakdown = calculate_category_breakdown(tx_data)
        except (ImportError, AttributeError):
            from app.tools.analytics_tools import get_spending_summary
            summary = get_spending_summary.invoke({"transactions_json": tx_data})
            breakdown = summary.get("by_category", {})

        prompt = (
            "User request: " + str(message) + "\n"
            "Category Breakdown Data: " + str(breakdown) + "\n"
            "Explain the user's spending distribution across categories clearly and directly with recommendations."
        )
        answer = generate(
            prompt,
            system=(
                "You are the Analytics Specialist Agent for FinSage AI in India. "
                "All currency figures are in Indian Rupees (INR, ₹). "
                "Always format currency as ₹ with Indian numbering (e.g. ₹1,850, ₹10,000, ₹1,00,000). "
                "Never use dollar signs ($) or USD. "
                "Directly and accurately answer the user's specific questions based on their real financial numbers."
            ),
        )

        state["answer"] = answer
        state.setdefault("agent_path", []).append(self.name)
        return state
