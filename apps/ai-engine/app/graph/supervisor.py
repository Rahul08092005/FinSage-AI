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


class SupervisorAgent(BaseAgent):
    name = "supervisor"

    def run(self, state: dict) -> dict:
        message = state["message"].lower()
        agent_path = ["supervisor"]

        if any(k in message for k in SPENDING_KEYWORDS) and state.get("transactions_json"):
            # Phase 2: route to the analytics tool directly.
            # Phase 4 makes this a real Analytics Agent node in the graph.
            agent_path.append("analytics_tool")
            try:
                summary = get_spending_summary.invoke(state["transactions_json"])
                answer = generate(
                    prompt=f"Explain this spending summary in 2-3 friendly sentences: {summary}",
                    system="You are the FinSage AI advisor. Be concise and encouraging.",
                )
                state["metrics"] = summary
            except Exception:
                answer = generate(
                    prompt=state["message"],
                    system="You are the FinSage AI advisor. Give a short, friendly reply about managing finances and budgets.",
                )
                state["metrics"] = {}
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
    supervisor = SupervisorAgent()
    state = {
        "user_id": user_id,
        "session_id": session_id,
        "message": message,
        "transactions_json": transactions_json,
    }
    return supervisor.run(state)
