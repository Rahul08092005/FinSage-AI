"""ReportAgent: Generates deterministic financial reports with exact figures and an optional executive summary."""
from datetime import datetime, timedelta
import json
from typing import Any, Dict, List, Optional, Union
import pandas as pd

from app.agents.base_agent import BaseAgent
from app.services.llm_client import generate

try:
    from app.analytics.tax_calculator import calculate_tax_savings, calculate_sip_suggestion
except ImportError:
    # Dependency: Kavya's app/analytics/tax_calculator.py (pending merge)
    def calculate_tax_savings(income: float, current_80c_investments: float = 0.0) -> Dict[str, Any]:
        """Deterministic tax savings calculation under Section 80C of the Indian Income Tax Act.
        Section 80C deduction cap is Rs 1,50,000.
        """
        max_80c = 150000.0
        current_invested = min(max_80c, max(0.0, float(current_80c_investments or 0.0)))
        remaining_80c = max(0.0, max_80c - current_invested)

        inc = float(income or 0.0)
        if inc > 1500000:
            marginal_rate = 0.30
        elif inc > 1000000:
            marginal_rate = 0.20
        elif inc > 700000:
            marginal_rate = 0.10
        elif inc > 500000:
            marginal_rate = 0.05
        else:
            marginal_rate = 0.0

        potential_savings = round(remaining_80c * marginal_rate, 2)

        return {
            "income": inc,
            "current_80c_investments": current_invested,
            "max_80c_limit": max_80c,
            "remaining_80c_limit": remaining_80c,
            "potential_tax_savings": potential_savings,
            "marginal_tax_rate": marginal_rate,
            "eligible_80c_options": ["PPF", "ELSS", "EPF", "Tax-Saver FD", "NPS (Tier 1)"],
        }

    def calculate_sip_suggestion(
        monthly_surplus: float = 0.0,
        goals: Optional[List[Dict[str, Any]]] = None,
        monthly_income: Optional[float] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Calculates suggested monthly SIP and allocation across goals and asset classes."""
        surplus = max(0.0, float(monthly_surplus or 0.0))
        if surplus <= 0 and monthly_income and monthly_income > 0:
            surplus = monthly_income * 0.20
        elif surplus <= 0:
            surplus = 10000.0

        suggested_sip = round(surplus * 0.70, 2)
        if suggested_sip < 1000.0:
            suggested_sip = max(1000.0, surplus)

        goals_allocation = []
        if goals and isinstance(goals, list) and len(goals) > 0:
            active_goals = []
            for g in goals:
                target = float(g.get("target_amount") or g.get("targetAmount") or 0.0)
                saved = float(g.get("current_saved") or g.get("currentSaved") or g.get("progress") or 0.0)
                rem = max(0.0, target - saved)
                active_goals.append({"goal": g, "target": target, "saved": saved, "remaining": rem})

            total_rem = sum(item["remaining"] for item in active_goals)
            for item in active_goals:
                g = item["goal"]
                name = g.get("name") or g.get("title") or g.get("goal_name") or "Goal"
                rem = item["remaining"]
                if total_rem > 0:
                    weight = rem / total_rem
                    alloc_sip = round(suggested_sip * weight, 2)
                else:
                    alloc_sip = round(suggested_sip / max(1, len(active_goals)), 2)

                alloc_sip = max(500.0, alloc_sip)
                months_needed = int(rem / alloc_sip) + (1 if (rem / alloc_sip) % 1 > 0 else 0) if alloc_sip > 0 else 0
                proj_date = (datetime.now() + timedelta(days=months_needed * 30)).strftime("%b %Y") if months_needed > 0 else "Achieved"

                goals_allocation.append({
                    "goal_name": name,
                    "target_amount": item["target"],
                    "current_saved": item["saved"],
                    "remaining_amount": rem,
                    "monthly_sip": alloc_sip,
                    "months_to_completion": months_needed,
                    "projected_completion_date": proj_date,
                })

        return {
            "suggested_monthly_sip": suggested_sip,
            "goal_allocations": goals_allocation,
            "asset_split": {
                "equity_elss_index": round(suggested_sip * 0.70, 2),
                "debt_ppf": round(suggested_sip * 0.30, 2),
            },
        }


def assemble_financial_report(
    transactions: Union[List[Dict[str, Any]], str, None] = None,
    budgets: Union[Dict[str, Any], List[Dict[str, Any]], None] = None,
    goals: Union[List[Dict[str, Any]], str, None] = None,
    health_score: Union[Dict[str, Any], int, float, None] = None,
    income: Optional[float] = None,
    current_investments: Optional[float] = None,
    current_80c_investments: Optional[float] = None,
    total_income: Optional[float] = None,
    **kwargs,
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

    # 7. Optional Unified Financial Plan (Tax & SIP Optimization)
    has_tax_sip_data = (
        income is not None
        or total_income is not None
        or current_investments is not None
        or current_80c_investments is not None
        or kwargs.get("tax_data") is not None
        or kwargs.get("sip_data") is not None
    )

    if has_tax_sip_data:
        user_income = float(income if income is not None else (total_income or 0.0))
        user_investments = float(
            current_investments if current_investments is not None else (current_80c_investments or 0.0)
        )

        annual_income = user_income if user_income > 200000 else (user_income * 12.0 if user_income > 0 else 1000000.0)
        monthly_income = user_income / 12.0 if user_income > 200000 else (user_income if user_income > 0 else annual_income / 12.0)

        tax_res = calculate_tax_savings(income=annual_income, current_80c_investments=user_investments)
        monthly_surplus = max(0.0, monthly_income - total_spend)
        sip_res = calculate_sip_suggestion(
            monthly_surplus=monthly_surplus,
            goals=goals_list,
            monthly_income=monthly_income
        )

        curr_80c = tax_res.get("current_80c_investments", user_investments)
        rem_80c = tax_res.get("remaining_80c_limit", max(0.0, 150000.0 - curr_80c))
        pot_savings = tax_res.get("potential_tax_savings", 0.0)
        max_80c = tax_res.get("max_80c_limit", 150000.0)
        sug_sip = sip_res.get("suggested_monthly_sip", 0.0)
        split = sip_res.get("asset_split", {})
        eq_sip = split.get("equity_elss_index", sug_sip * 0.70)
        debt_sip = split.get("debt_ppf", sug_sip * 0.30)

        lines.extend([
            "",
            "## 5. Unified Financial Plan",
            "",
            "### Tax Optimization (Section 80C)",
            "",
            f"- **Annual Gross Income**: ${annual_income:,.2f}",
            f"- **Current Section 80C Investments**: ${curr_80c:,.2f}",
            f"- **Remaining Section 80C Capacity**: ${rem_80c:,.2f} (out of ${max_80c:,.2f} cap)",
            f"- **Estimated Potential Tax Savings**: ${pot_savings:,.2f}",
            "- **Recommended Tax-Advantaged Instruments**: Public Provident Fund (PPF, 15-year sovereign lock-in) and Equity Linked Savings Scheme (ELSS, 3-year equity lock-in).",
            "",
            "### Suggested SIP Allocation",
            "",
            f"- **Recommended Total Monthly SIP**: ${sug_sip:,.2f}",
            f"- **Equity & ELSS Mutual Funds**: ${eq_sip:,.2f} / month",
            f"- **Debt & PPF Long-Term Reserves**: ${debt_sip:,.2f} / month",
            "",
            "### Goal Timelines Under Recommended SIP Allocation",
            "",
            "| Goal Name | Target Amount | Current Saved | Remaining | Monthly SIP Allocation | Projected Timeline | Completion Date |",
            "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
        ])

        goal_allocations = sip_res.get("goal_allocations", [])
        if goal_allocations:
            for ga in goal_allocations:
                g_name = ga.get("goal_name", "Goal")
                g_target = float(ga.get("target_amount", 0.0))
                g_saved = float(ga.get("current_saved", 0.0))
                g_rem = float(ga.get("remaining_amount", 0.0))
                g_sip = float(ga.get("monthly_sip", 0.0))
                g_months = ga.get("months_to_completion", 0)
                g_date = ga.get("projected_completion_date", "Achieved")
                timeline_str = f"{g_months} months" if g_months > 0 else "Fully Funded"
                lines.append(
                    f"| {g_name} | ${g_target:,.2f} | ${g_saved:,.2f} | ${g_rem:,.2f} | ${g_sip:,.2f} | {timeline_str} | {g_date} |"
                )
        elif goals_list:
            for g in goals_list:
                name = g.get("name") or g.get("title") or g.get("goal_name") or "Goal"
                target = float(g.get("target_amount") or g.get("targetAmount") or 0.0)
                saved = float(g.get("current_saved") or g.get("currentSaved") or g.get("progress") or 0.0)
                rem = max(0.0, round(target - saved, 2))
                lines.append(f"| {name} | ${target:,.2f} | ${saved:,.2f} | ${rem:,.2f} | ${sug_sip:,.2f} | On Track | Planned |")
        else:
            lines.append("| *No active goals configured* | $0.00 | $0.00 | $0.00 | $0.00 | — | — |")

    lines.append("")
    return "\n".join(lines)


class ReportAgent(BaseAgent):
    name = "report_agent"

    def run(self, state: dict) -> dict:
        tx_data = state.get("transactions_json")
        goals_data = state.get("goals_json")
        budgets_data = state.get("budgets")
        health_data = state.get("health_score")
        income = state.get("income") or state.get("total_income")
        current_investments = (
            state.get("current_investments")
            or state.get("current_80c_investments")
            or state.get("investments")
        )

        report_md = assemble_financial_report(
            transactions=tx_data,
            budgets=budgets_data,
            goals=goals_data,
            health_score=health_data,
            income=income,
            current_investments=current_investments,
        )

        state["answer"] = report_md
        state["citations"] = []
        state.setdefault("agent_path", []).append(self.name)
        return state
