"""BudgetAgent: Wraps budget recommendation tool calls and LLM advice."""
from typing import Any, Dict, List
from app.agents.base_agent import BaseAgent
from app.tools.budgeting_tools import get_budget_recommendation
from app.tools.analytics_tools import get_spending_summary
from app.services.llm_client import generate


def build_budget_reasoning_trace(tx_data: Any, rec: dict) -> dict:
    """Builds a structured reasoning trace for budgeting recommendations."""
    evidence: List[str] = []
    try:
        summary = get_spending_summary.invoke({"transactions_json": tx_data or ""})
        cat_spending = summary.get("by_category", {})
        total_historical = float(summary.get("total", 0.0))
        by_month = summary.get("by_month", {})
        num_months = len(by_month)
    except Exception:
        cat_spending = {}
        total_historical = 0.0
        num_months = 0

    total_rec = float(rec.get("total_recommended_budget", 0.0))
    savings_diff = round(total_historical - total_rec, 2)

    evidence.append(f"Historical spending evaluated across {len(cat_spending)} categories totaling Rs.{total_historical:,.2f}.")
    if num_months > 0:
        evidence.append(f"Transaction history spans {num_months} calendar month(s).")
    top_cats = sorted(cat_spending.items(), key=lambda x: x[1], reverse=True)[:3]
    if top_cats:
        top_str = ", ".join([f"{c}: Rs.{amt:,.2f}" for c, amt in top_cats])
        evidence.append(f"Highest spending categories: {top_str}.")

    if num_months > 1:
        avg_mo = round(total_historical / num_months, 2)
        calculation = (
            f"{num_months}-month total Rs.{total_historical:,.2f} (average Rs.{avg_mo:,.2f}/mo); "
            f"10% savings buffer applied across categories -> recommended monthly budget Rs.{total_rec:,.2f} "
            f"(target monthly reduction Rs.{savings_diff:,.2f})."
        )
        confidence = "high" if num_months >= 3 else "medium"
    elif total_historical > 0:
        calculation = (
            f"Baseline spend Rs.{total_historical:,.2f}; 10% reduction applied across categories -> "
            f"recommended budget limit Rs.{total_rec:,.2f} (target savings Rs.{savings_diff:,.2f})."
        )
        confidence = "medium"
    else:
        calculation = "No historical spending recorded; baseline default recommendation provided."
        confidence = "low"

    return {
        "evidence": evidence,
        "calculation": calculation,
        "confidence": confidence,
    }


class BudgetAgent(BaseAgent):
    name = "budget_agent"

    def run(self, state: dict) -> dict:
        tx_data = state.get("transactions_json") or ""
        message = state.get("message", "Provide budget recommendations")

        rec = get_budget_recommendation.invoke({"transactions_json": tx_data})
        state["reasoning_trace"] = build_budget_reasoning_trace(tx_data, rec)

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
