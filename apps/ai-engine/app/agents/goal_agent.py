"""GoalAgent: Wraps goal tracking tool calls and LLM guidance."""
from typing import Any, Dict, List
from app.agents.base_agent import BaseAgent
from app.tools.goal_tools import track_goal_progress
from app.services.llm_client import generate


def build_goal_reasoning_trace(progress: dict, tx_data: Any = "") -> dict:
    """Builds a structured reasoning trace for financial goal progress tracking."""
    goals_list = progress.get("goals_progress", []) if isinstance(progress, dict) else []
    evidence: List[str] = []

    evidence.append(f"Active financial goals tracked: {len(goals_list)}.")
    for g in goals_list[:3]:
        name = g.get("goal_name", "Goal")
        saved = float(g.get("current_saved", 0.0))
        target = float(g.get("target_amount", 0.0))
        pct = float(g.get("percent_complete", 0.0))
        status = "On Track" if g.get("on_track", True) else "Off Track"
        evidence.append(f"Goal '{name}': saved Rs.{saved:,.2f} of Rs.{target:,.2f} ({pct:.1f}%) — {status}.")

    if goals_list:
        calc_parts = []
        for g in goals_list[:2]:
            name = g.get("goal_name", "Goal")
            rem = max(0.0, float(g.get("target_amount", 0.0)) - float(g.get("current_saved", 0.0)))
            pace = float(g.get("monthly_savings_pace", 0.0))
            mo = g.get("months_remaining", 0)
            proj = g.get("projected_completion_date", "Pending")
            calc_parts.append(
                f"{name}: Remaining Rs.{rem:,.2f} / Rs.{pace:,.2f}/mo pace = {mo} months -> target completion {proj}"
            )
        calculation = "; ".join(calc_parts) + "."
        confidence = "high" if tx_data and len(goals_list) > 0 else "medium"
    else:
        calculation = "No active savings goals found; baseline target progress at 0%."
        confidence = "low"

    return {
        "evidence": evidence,
        "calculation": calculation,
        "confidence": confidence,
    }


class GoalAgent(BaseAgent):
    name = "goal_agent"

    def run(self, state: dict) -> dict:
        goals_json = state.get("goals_json") or "[]"
        tx_data = state.get("transactions_json") or ""
        message = state.get("message", "Track goal progress")

        progress = track_goal_progress.invoke({"goals_json": goals_json, "transactions_json": tx_data})
        state["reasoning_trace"] = build_goal_reasoning_trace(progress, tx_data)

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
