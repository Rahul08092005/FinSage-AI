<<<<<<< HEAD
"""Supervisor Agent with multi-agent routing."""
from app.agents.base_agent import BaseAgent
from app.agents.document_agent import DocumentAgent
from app.agents.expense_agent import ExpenseAgent
from app.agents.analytics_agent import AnalyticsAgent
from app.agents.rag_advisor_agent import RAGAdvisorAgent
from app.tools.budgeting_tools import get_budget_recommendation
from app.tools.goal_tools import track_goal_progress
from app.services.llm_client import generate

SPENDING_KEYWORDS = ["spent", "spending", "total", "expense", "transaction", "purchased", "cost"]
ANALYTICS_KEYWORDS = ["breakdown", "analytics", "distribution", "category split", "pie"]
FINANCE_KNOWLEDGE_KEYWORDS = ["what is", "explain", "ppf", "tax", "invest", "elss", "itr", "80c", "deduction", "sip", "mutual fund"]
BUDGET_KEYWORDS = ["budget", "recommend", "how much should i spend", "limit", "target spend"]
GOAL_KEYWORDS = ["goal", "saving for", "progress", "target date", "save"]
=======
"""Person 2 (Rahul) owns this file.

Phase 2: real routing logic — the Supervisor now decides whether a message
is a general question or a spending question, and picks a tool accordingly.
Phase 3+ replaces this if/else with a proper LangGraph StateGraph across all
9 agents; the branching logic here is the seed of that routing.
"""
from app.agents.base_agent import BaseAgent
from app.services.llm_client import generate
from app.tools.analytics_tools import get_spending_summary

SPENDING_KEYWORDS = ["spend", "spent", "spending", "budget", "expense", "category"]
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030


class SupervisorAgent(BaseAgent):
    name = "supervisor"

    def run(self, state: dict) -> dict:
<<<<<<< HEAD
        message = state.get("message", "")
        msg_lower = message.lower()
        state["agent_path"] = ["supervisor"]

        # Branch 1: DocumentAgent when document_id is present
        if state.get("document_id"):
            agent = DocumentAgent()
            return agent.run(state)

        # Branch 2: Budgeting recommendation
        if any(kw in msg_lower for kw in BUDGET_KEYWORDS):
            tx_data = state.get("transactions_json") or ""
            rec = get_budget_recommendation.invoke({"transactions_json": tx_data})
            prompt = "User request: " + str(message) + "\nBudget Recommendations: " + str(rec) + "\nProvide actionable budget advice."
            answer = generate(prompt, system="You are the Budget Advisor Agent for FinSage AI.")
            state["answer"] = answer
            state["agent_path"].append("budgeting_tool")
            state["citations"] = []
            return state

        # Branch 3: Goal tracking
        if any(kw in msg_lower for kw in GOAL_KEYWORDS):
            goals_json = state.get("goals_json") or "[]"
            tx_data = state.get("transactions_json") or ""
            progress = track_goal_progress.invoke({"goals_json": goals_json, "transactions_json": tx_data})
            prompt = "User request: " + str(message) + "\nGoal Progress: " + str(progress) + "\nProvide motivating goal tracking insight."
            answer = generate(prompt, system="You are the Financial Goal Tracking Agent for FinSage AI.")
            state["answer"] = answer
            state["agent_path"].append("goal_tool")
            state["citations"] = []
            return state

        # Branch 4: Analytics (category breakdown)
        if any(kw in msg_lower for kw in ANALYTICS_KEYWORDS) and state.get("transactions_json"):
            agent = AnalyticsAgent()
            return agent.run(state)

        # Branch 5: Expense summary
        if any(kw in msg_lower for kw in SPENDING_KEYWORDS):
            agent = ExpenseAgent()
            return agent.run(state)

        # Branch 6: RAG Advisor when finance knowledge query and no transactions_json
        if any(kw in msg_lower for kw in FINANCE_KNOWLEDGE_KEYWORDS) and not state.get("transactions_json"):
            agent = RAGAdvisorAgent()
            return agent.run(state)

        # Default fallback: Supervisor direct LLM response
        answer = generate(
            prompt=message,
            system=(
                "You are the FinSage AI supervisor agent. "
                "Provide a helpful financial assistant response."
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
    transactions_json: str = None,
    goals_json: str = None,
    domain: str = None
) -> dict:
=======
        message = state["message"].lower()
        agent_path = ["supervisor"]

        if any(k in message for k in SPENDING_KEYWORDS) and state.get("transactions_json"):
            # Phase 2: route to the analytics tool directly.
            # Phase 4 makes this a real Analytics Agent node in the graph.
            agent_path.append("analytics_tool")
            summary = get_spending_summary.invoke(state["transactions_json"])
            answer = generate(
                prompt=f"Explain this spending summary in 2-3 friendly sentences: {summary}",
                system="You are the FinSage AI advisor. Be concise and encouraging.",
            )
            state["metrics"] = summary
        else:
            agent_path.append("general_reply")
            answer = generate(
                prompt=state["message"],
                system=(
                    "You are the FinSage AI supervisor agent (Phase 2). Give a short, "
                    "friendly reply. If the user asks about spending or budgets but no "
                    "transaction data was provided, ask them to connect their account."
                ),
            )
            state["metrics"] = {}

        state["answer"] = answer
        state["agent_path"] = agent_path
        state["citations"] = []
        return state


def run_supervisor_graph(user_id: str, session_id: str, message: str, transactions_json: str | None = None) -> dict:
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
    supervisor = SupervisorAgent()
    state = {
        "user_id": user_id,
        "session_id": session_id,
        "message": message,
<<<<<<< HEAD
        "document_id": document_id,
        "transactions_json": transactions_json,
        "goals_json": goals_json,
        "domain": domain,
=======
        "transactions_json": transactions_json,
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
    }
    return supervisor.run(state)
