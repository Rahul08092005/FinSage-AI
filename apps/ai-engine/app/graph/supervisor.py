"""Supervisor Agent with multi-agent routing."""
from typing import Any
from app.agents.base_agent import BaseAgent
from app.agents.document_agent import DocumentAgent
from app.agents.expense_agent import ExpenseAgent
from app.agents.analytics_agent import AnalyticsAgent
from app.agents.rag_advisor_agent import RAGAdvisorAgent
from app.tools.budgeting_tools import get_budget_recommendation
from app.tools.goal_tools import track_goal_progress
from app.tools.analytics_tools import get_spending_summary
from app.tools.tax_advice_tools import get_tax_savings_advice
from app.services.llm_client import generate

SPENDING_KEYWORDS = [
    "spent", "spending", "total", "expense", "transaction", "purchased", 
    "cost", "spend", "doing", "month", "status", "overview", "summary", 
    "finances", "money", "how am i", "health"
]
ANALYTICS_KEYWORDS = ["breakdown", "analytics", "distribution", "category split", "pie"]
TAX_KEYWORDS = ["tax", "ppf", "elss", "sip", "80c", "save on taxes"]
FINANCE_KNOWLEDGE_KEYWORDS = ["what is", "explain", "invest", "itr", "deduction", "mutual fund"]
BUDGET_KEYWORDS = ["budget", "recommend", "how much should i spend", "limit", "target spend"]
GOAL_KEYWORDS = ["goal", "saving for", "progress", "target date", "save"]


class SupervisorAgent(BaseAgent):
    name = "supervisor"

    def run(self, state: dict) -> dict:
        message = state.get("message", "")
        msg_lower = message.lower()
        state["agent_path"] = ["supervisor"]

        # Branch 1: DocumentAgent when document_id is present
        if state.get("document_id"):
            agent = DocumentAgent()
            return agent.run(state)

        # Branch 2: Tax & SIP advice
        if any(kw in msg_lower for kw in TAX_KEYWORDS):
            import re
            income = float(state.get("income") or state.get("total_income") or 1000000.0)
            current_80c = float(state.get("current_80c_investments") or state.get("investments") or 0.0)

            inc_match = re.search(r'(?:income|salary|earning)(?:\s+is|\s+of)?\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*)', msg_lower)
            if inc_match:
                try:
                    income = float(inc_match.group(1).replace(",", ""))
                except Exception:
                    pass

            inv_match = re.search(r'(?:invested|investment|80c|ppf|elss)(?:\s+is|\s+of)?\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*)', msg_lower)
            if inv_match:
                try:
                    current_80c = float(inv_match.group(1).replace(",", ""))
                except Exception:
                    pass

            tool_name = getattr(get_tax_savings_advice, "name", "get_tax_savings_advice")
            rec = get_tax_savings_advice.invoke({"income": income, "current_80c_investments": current_80c})

            state["answer"] = rec.get("explanation", "")
            state["agent_path"].append(tool_name)
            state["citations"] = rec.get("citations", [])
            state["metrics"] = rec.get("raw_numbers", {})
            return state

        # Branch 3: Budgeting recommendation
        if any(kw in msg_lower for kw in BUDGET_KEYWORDS):
            tx_data = state.get("transactions_json") or ""
            rec = get_budget_recommendation.invoke({"transactions_json": tx_data})
            prompt = "User request: " + str(message) + "\nBudget Recommendations: " + str(rec) + "\nProvide actionable budget advice in INR (₹)."
            answer = generate(
                prompt,
                system=(
                    "You are the Budget Advisor Agent for FinSage AI in India. "
                    "All currency figures are in Indian Rupees (INR, ₹). Always format currency with ₹. "
                    "Provide actionable, direct, and encouraging advice."
                ),
            )
            state["answer"] = answer
            state["agent_path"].append("budgeting_tool")
            state["citations"] = []
            return state

        # Branch 4: Goal tracking
        if any(kw in msg_lower for kw in GOAL_KEYWORDS):
            goals_json = state.get("goals_json") or "[]"
            tx_data = state.get("transactions_json") or ""
            progress = track_goal_progress.invoke({"goals_json": goals_json, "transactions_json": tx_data})
            prompt = "User request: " + str(message) + "\nGoal Progress: " + str(progress) + "\nProvide motivating goal tracking insight in INR (₹)."
            answer = generate(
                prompt,
                system=(
                    "You are the Financial Goal Tracking Agent for FinSage AI in India. "
                    "All currency figures are in Indian Rupees (INR, ₹). Always format currency with ₹. "
                    "Provide motivating goal tracking insight."
                ),
            )
            state["answer"] = answer
            state["agent_path"].append("goal_tool")
            state["citations"] = []
            return state

        # Branch 5: Analytics (category breakdown)
        if any(kw in msg_lower for kw in ANALYTICS_KEYWORDS) and state.get("transactions_json"):
            agent = AnalyticsAgent()
            return agent.run(state)

        # Branch 6: Expense summary
        if any(kw in msg_lower for kw in SPENDING_KEYWORDS):
            if state.get("transactions_json"):
                agent = ExpenseAgent()
                return agent.run(state)

        # Branch 7: RAG Advisor when finance knowledge query and no transactions_json
        if any(kw in msg_lower for kw in FINANCE_KNOWLEDGE_KEYWORDS) and not state.get("transactions_json"):
            agent = RAGAdvisorAgent()
            return agent.run(state)

        # Default fallback: Supervisor direct LLM response grounded in real transactions
        summary = ""
        if state.get("transactions_json"):
            try:
                from app.tools.analytics_tools import get_spending_summary
                summary_data = get_spending_summary.invoke({"transactions_json": state.get("transactions_json")})
                summary = f"Current User Financial Data: {summary_data}\n"
            except Exception:
                pass

        fallback_prompt = (
            f"{summary}User query: {message}\n"
            "Answer the user directly and helpfully based on their current numbers in Indian Rupees (INR, ₹)."
        )
        answer = generate(
            prompt=fallback_prompt,
            system=(
                "You are the FinSage AI supervisor agent in India. "
                "All currency figures are in Indian Rupees (INR, ₹). Always format currency as ₹ with Indian numbering (e.g. ₹1,850, ₹10,000, ₹1,00,000). "
                "Never use USD or dollar signs ($). "
                "Provide a helpful, direct financial assistant response grounded in the user's actual data."
            ),
        )
        state["answer"] = answer
        state["citations"] = []
        state["metrics"] = {}
        return state


def run_supervisor_graph(
    user_id: str,
    session_id: str,
    message: str,
    document_id: str = None,
    transactions_json: Any = None,
    goals_json: str = None,
    domain: str = None,
    income: float = None,
    current_80c_investments: float = None,
    **kwargs
) -> dict:
    supervisor = SupervisorAgent()
    state = {
        "user_id": user_id,
        "session_id": session_id,
        "message": message,
        "document_id": document_id,
        "transactions_json": transactions_json,
        "goals_json": goals_json,
        "domain": domain,
        "income": income,
        "current_80c_investments": current_80c_investments,
        **kwargs
    }
    return supervisor.run(state)
