"""GoalAgent: Wraps goal tracking tool calls and LLM guidance."""
from app.agents.base_agent import BaseAgent
from app.tools.goal_tools import track_goal_progress
from app.services.llm_client import generate


class GoalAgent(BaseAgent):
    name = "goal_agent"

    def run(self, state: dict) -> dict:
        goals_json = state.get("goals_json") or "[]"
        tx_data = state.get("transactions_json") or ""
        message = state.get("message", "Track goal progress")

        progress = track_goal_progress.invoke({"goals_json": goals_json, "transactions_json": tx_data})

        prompt = (
            "User request: " + str(message) + "\n"
            "Goal Progress: " + str(progress) + "\n"
            "Provide motivating, clear, and actionable goal tracking insights."
        )
        answer = generate(prompt, system="You are the Financial Goal Tracking Agent for FinSage AI.")

        state["answer"] = answer
        state["citations"] = []
        state.setdefault("agent_path", []).append(self.name)
        return state
