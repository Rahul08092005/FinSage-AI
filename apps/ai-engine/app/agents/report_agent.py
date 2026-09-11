"""ReportAgent: Generates deterministic financial reports with exact figures and an optional executive summary."""
import json
from typing import Any, Dict, List, Union
import pandas as pd

from app.agents.base_agent import BaseAgent
from app.services.llm_client import generate


def assemble_financial_report(
    transactions: Union[List[Dict[str, Any]], str, None] = None,
    budgets: Union[Dict[str, Any], List[Dict[str, Any]], None] = None,
    goals: Union[List[Dict[str, Any]], str, None] = None,
    health_score: Union[Dict[str, Any], int, float, None] = None,
) -> str:
    """Assembles a structured markdown report from exact financial figures without LLM paraphrasing.
    Includes an optional plain-language executive summary paragraph at the top.
    """
    # 1. Parse Transactions
    tx_list: List[Dict[str, Any]] = []
    if isinstance(transactions, str) and transactions.strip():
        try:
            tx_list = json.loads(transactions)
        except Exception:
            try:
                from app.analytics.csv_parser import parse_transactions_csv
                df = parse_transactions_csv(transactions.encode("utf-8"))
                tx_list = df.to_dict(orient="records")
            except Exception:
                tx_list = []
    elif isinstance(transactions, list):
        tx_list = transactions

    cat_totals: Dict[str, float] = {}
    total_spend = 0.0
    for tx in tx_list:
        amt = float(tx.get("amount", 0.0) or 0.0)
        cat = str(tx.get("category") or "General")
        cat_totals[cat] = round(cat_totals.get(cat, 0.0) + amt, 2)
        total_spend = round(total_spend + amt, 2)

    # 2. Parse Budgets
    budget_map: Dict[str, float] = {}
    if isinstance(budgets, dict):
        for k, v in budgets.items():
            budget_map[str(k)] = float(v)
    elif isinstance(budgets, list):
        for b in budgets:
            if isinstance(b, dict):
                c = b.get("category") or "General"
                limit = float(b.get("monthlyLimit", b.get("limit", b.get("amount", 0.0))))
                budget_map[str(c)] = limit

    # 3. Parse Goals
    goals_list: List[Dict[str, Any]] = []
    if isinstance(goals, str) and goals.strip():
        try:
            goals_list = json.loads(goals)
        except Exception:
            goals_list = []
    elif isinstance(goals, list):
        goals_list = goals

    # 4. Parse Health Score
    score_value = 100
    score_breakdown: Dict[str, Any] = {}
    if isinstance(health_score, (int, float)):
        score_value = int(health_score)
    elif isinstance(health_score, dict):
        score_value = int(health_score.get("score", 100))
        score_breakdown = health_score.get("breakdown", {})

    # 5. Optional LLM Executive Summary
    summary_paragraph = ""
    try:
        summary_prompt = (
            f"Provide a concise, 2-3 sentence plain-language financial summary based on these user numbers:\n"
            f"- Total Spending: ${total_spend:.2f}\n"
            f"- Health Score: {score_value}/100\n"
            f"- Number of Budget Categories: {len(budget_map)}\n"
            f"- Active Goals: {len(goals_list)}\n"
            "Keep it encouraging, clear, and professional. Do not modify or repeat raw tables."
        )
        summary_paragraph = generate(summary_prompt, system="You are the Financial Report Agent for FinSage AI.")
    except Exception:
        summary_paragraph = "Here is your latest financial performance report detailing your spending, budgets, goals, and health score."

    # 6. Deterministic Markdown Assembly
    lines = [
        "# FinSage Comprehensive Financial Report",
        "",
        "## Executive Summary",
        summary_paragraph.strip(),
        "",
        "---",
        "",
        "## 1. Spending by Category",
        "",
        f"**Total Spending**: ${total_spend:.2f}",
        "",
        "| Category | Spend Amount | Share of Spend |",
        "| :--- | :--- | :--- |",
    ]

    if cat_totals:
        for cat, amt in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True):
            share = (amt / total_spend * 100.0) if total_spend > 0 else 0.0
            lines.append(f"| {cat} | ${amt:.2f} | {share:.1f}% |")
    else:
        lines.append("| *No recorded transactions* | $0.00 | 0.0% |")

    lines.extend([
        "",
        "## 2. Budget Variance",
        "",
        "| Category | Budget Limit | Actual Spend | Variance | Status |",
        "| :--- | :--- | :--- | :--- | :--- |",
    ])

    if budget_map:
        all_budget_cats = sorted(set(list(budget_map.keys()) + list(cat_totals.keys())))
        for cat in all_budget_cats:
            limit = budget_map.get(cat, 0.0)
            actual = cat_totals.get(cat, 0.0)
            diff = round(limit - actual, 2)
            if limit <= 0.0:
                status = "No Limit Set"
                var_str = f"-${actual:.2f}"
            elif diff >= 0:
                status = "Within Budget"
                var_str = f"+${diff:.2f}"
            else:
                status = f"Over Budget (${abs(diff):.2f})"
                var_str = f"-${abs(diff):.2f}"
            lines.append(f"| {cat} | ${limit:.2f} | ${actual:.2f} | {var_str} | {status} |")
    else:
        lines.append("| *No active budgets* | $0.00 | $0.00 | $0.00 | Not Set |")

    lines.extend([
        "",
        "## 3. Financial Goals Progress",
        "",
        "| Goal Name | Target Amount | Current Saved | Progress (%) | Remaining |",
        "| :--- | :--- | :--- | :--- | :--- |",
    ])

    if goals_list:
        for g in goals_list:
            name = g.get("name") or g.get("title") or g.get("goal_name") or "Goal"
            target = float(g.get("target_amount") or g.get("targetAmount") or 0.0)
            saved = float(g.get("current_saved") or g.get("currentSaved") or g.get("progress") or 0.0)
            pct = round((saved / target) * 100.0, 2) if target > 0 else (100.0 if saved > 0 else 0.0)
            rem = max(0.0, round(target - saved, 2))
            lines.append(f"| {name} | ${target:.2f} | ${saved:.2f} | {min(100.0, pct):.1f}% | ${rem:.2f} |")
    else:
        lines.append("| *No active goals* | $0.00 | $0.00 | 0.0% | $0.00 |")

    lines.extend([
        "",
        "## 4. Financial Health Score",
        "",
        f"**Health Score**: {score_value}/100",
        "",
        "### Score Breakdown",
    ])

    if score_breakdown:
        for reason, pts in score_breakdown.items():
            pts_val = float(pts)
            sign = "+" if pts_val > 0 else ""
            lines.append(f"- **{reason}**: {sign}{pts_val:.1f} pts")
    else:
        lines.append("- Baseline score evaluated based on transaction and budget adherence.")

    lines.append("")
    return "\n".join(lines)


class ReportAgent(BaseAgent):
    name = "report_agent"

    def run(self, state: dict) -> dict:
        tx_data = state.get("transactions_json")
        goals_data = state.get("goals_json")
        budgets_data = state.get("budgets")
        health_data = state.get("health_score")

        report_md = assemble_financial_report(
            transactions=tx_data,
            budgets=budgets_data,
            goals=goals_data,
            health_score=health_data,
        )

        state["answer"] = report_md
        state["citations"] = []
        state.setdefault("agent_path", []).append(self.name)
        return state
