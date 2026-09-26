"""Analytics and deterministic financial math functions."""
import pandas as pd


def calculate_monthly_spending(transactions: pd.DataFrame) -> dict:
    """Takes a normalized transactions DataFrame (date, description, amount,
    category) and returns total spend per month, per category.
    """
    if transactions.empty:
        return {"by_month": {}, "by_category": {}, "total": 0.0}

    df = transactions.copy()
    if "transactionDate" in df.columns and "date" not in df.columns:
        df["date"] = df["transactionDate"]
    elif "date" not in df.columns:
        df["date"] = pd.Timestamp.now()

    if not pd.api.types.is_datetime64_any_dtype(df["date"]):
        df["date"] = pd.to_datetime(df["date"], errors="coerce").fillna(pd.Timestamp.now())

    df["month"] = df["date"].dt.to_period("M").astype(str)

    if "category" not in df.columns:
        df["category"] = "General"
    else:
        df["category"] = df["category"].fillna("General")

    if "amount" not in df.columns:
        df["amount"] = 0.0
    else:
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)

    by_month = df.groupby("month")["amount"].sum().round(2).to_dict()
    by_category = df.groupby("category")["amount"].sum().round(2).to_dict()
    total = round(float(df["amount"].sum()), 2)

    return {"by_month": by_month, "by_category": by_category, "total": total}


def calculate_category_breakdown(transactions: list[dict]) -> dict:
    """Person 3, Phase 2: works directly on a list of normalized transaction
    dicts (as produced by normalization.normalize_batch), so the BFF can send
    JSON straight from Prisma without a CSV round-trip. Returns spend and
    percentage share per category.
    """
    if not transactions:
        return {"by_category": {}, "total": 0.0}

    df = pd.DataFrame(transactions)
    if "amount" not in df.columns:
        return {"by_category": {}, "total": 0.0}
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    total = round(float(df["amount"].sum()), 2)
    if total == 0:
        return {"by_category": {}, "total": 0.0}

    if "category" not in df.columns:
        df["category"] = "General"
    else:
        df["category"] = df["category"].fillna("General")

    grouped = df.groupby("category")["amount"].sum().round(2)
    by_category = {
        cat: {"amount": float(amt), "percent": round(float(amt) / total * 100, 1)}
        for cat, amt in grouped.items()
    }
    return {"by_category": by_category, "total": total}


# ---------------------------------------------------------------------------
# Phase 3 additions (Step 9) -- deterministic, no LLM calls
# ---------------------------------------------------------------------------


def calculate_budget_recommendation(transactions: pd.DataFrame) -> dict:
    """Suggest monthly spending limits per category based on historical data.

    Heuristic: recommended limit = historical monthly average * 1.10 (i.e., 10%
    above average).  This is a simple demo heuristic, not financial advice.
    Returns an empty dict if the DataFrame is empty or lacks required columns.

    Args:
        transactions: DataFrame with at least 'date' (datetime), 'amount' (float),
                      and 'category' (str) columns.

    Returns:
        { category: recommended_monthly_limit_float }
    """
    required = {"date", "amount", "category"}
    if transactions.empty or not required.issubset(transactions.columns):
        return {}

    df = transactions.copy()
    df["month"] = df["date"].dt.to_period("M").astype(str)

    # Average spend per category per month
    monthly_by_cat = (
        df.groupby(["category", "month"])["amount"]
        .sum()
        .groupby(level="category")
        .mean()
    )

    # Recommend 10% above the historical monthly average
    return {
        cat: round(float(avg) * 1.10, 2)
        for cat, avg in monthly_by_cat.items()
    }


def detect_anomalies(transactions: pd.DataFrame) -> list[dict]:
    """Flag transactions whose amount exceeds 2 standard deviations above the
    per-category mean.

    Categories with fewer than 4 transactions are skipped -- not enough data
    for a meaningful standard deviation.

    Args:
        transactions: DataFrame with at least 'amount' and 'category' columns.

    Returns:
        List of flagged transaction dicts, each augmented with a 'reason' key.
    """
    required = {"amount", "category"}
    if transactions.empty or not required.issubset(transactions.columns):
        return []

    df = transactions.copy()
    anomalies: list[dict] = []

    for cat, group in df.groupby("category"):
        if len(group) < 4:
            # Not enough data to compute a reliable stddev -- skip
            continue

        mean = group["amount"].mean()
        std = group["amount"].std()
        if std == 0 or pd.isna(std):
            continue

        flagged = group[group["amount"] > mean + 2 * std]
        for _, row in flagged.iterrows():
            entry = row.to_dict()
            entry["reason"] = (
                f"Amount {row['amount']:.2f} is more than 2 std deviations "
                f"above the {cat} category mean ({mean:.2f}, std={std:.2f})."
            )
            anomalies.append(entry)

    return anomalies


def calculate_health_score(
    transactions: pd.DataFrame,
    budgets: dict,
    goals: list[dict],
    total_income: float = 0.0,
) -> dict:
    """Compute a 0-100 financial health score.

    Formula (clearly documented -- not financial advice):
      Start at 100.
      For each category that is over its budget limit:
          subtract min(20, 20 * (overage_ratio))
          where overage_ratio = (actual - limit) / limit, capped at 1.0.
      If total_income > 0 and total spend > total_income:
          subtract 15 points.
      For each goal with 'progress' > 0 (any positive progress):
          add 5 points (capped so score cannot exceed 100).

    Phase 6 additions (Health Score 2.0) — extend, don't replace:
      Spending trend direction: if the most recent month's total spend is
          lower than the mean of all prior months, add 5 points ("Spending
          trend improving"); if higher, subtract 5 ("Spending trend rising").
          Requires >= 2 months of history; skipped otherwise.
      Anomaly count: subtract 3 points per anomaly detected by
          detect_anomalies() (capped at -15). Anomalies signal irregular
          spending that may threaten financial health.

    Args:
        transactions: DataFrame with 'amount' and 'category' columns.
        budgets:      { category: monthly_limit } as returned by
                      calculate_budget_recommendation().
        goals:        List of dicts, each with at least 'progress' (float,
                      0.0-1.0 or absolute amount > 0).
        total_income: Optional total income for the period; 0.0 means unknown.

    Returns:
        { "score": int (0-100), "breakdown": { reason: points_change } }
    """
    score = 100
    breakdown: dict[str, float] = {}

    # Normalize budgets if passed as a list of budget dicts
    budgets_dict = {}
    if isinstance(budgets, dict):
        budgets_dict = budgets
    elif isinstance(budgets, list):
        for b in budgets:
            if isinstance(b, dict) and "category" in b:
                budgets_dict[b["category"]] = float(b.get("monthlyLimit", b.get("limit", b.get("amount", 0))))

    # Category budget checks
    if not transactions.empty and "category" in transactions.columns and budgets_dict:
        actual_by_cat = transactions.groupby("category")["amount"].sum().to_dict()
        for cat, limit in budgets_dict.items():
            actual = actual_by_cat.get(cat, 0.0)
            if limit > 0 and actual > limit:
                overage_ratio = min(1.0, (actual - limit) / limit)
                deduction = round(20 * overage_ratio, 1)
                score -= deduction
                breakdown[f"{cat} over budget"] = -deduction

    # Income vs spend check
    if total_income > 0 and not transactions.empty and "amount" in transactions.columns:
        total_spend = float(transactions["amount"].sum())
        if total_spend > total_income:
            score -= 15
            breakdown["Total spend exceeds income"] = -15

    # Goal progress bonus
    if isinstance(goals, list):
        for goal in goals:
            progress = goal.get("progress", 0) if isinstance(goal, dict) else 0
            if isinstance(progress, (int, float)) and progress > 0:
                bonus = 5
                score = min(100, score + bonus)
                label = goal.get("title", goal.get("name", "goal"))
                breakdown[f"Positive progress on '{label}'"] = +bonus

    # -----------------------------------------------------------------------
    # Phase 6 — Health Score 2.0: Spending Trend + Anomaly Signals
    # -----------------------------------------------------------------------

    # Spending trend direction (requires date + amount + ≥2 months)
    if (
        not transactions.empty
        and "amount" in transactions.columns
    ):
        df_trend = transactions.copy()
        # Resolve date column
        if "transactionDate" in df_trend.columns and "date" not in df_trend.columns:
            df_trend["date"] = df_trend["transactionDate"]
        if "date" in df_trend.columns:
            if not pd.api.types.is_datetime64_any_dtype(df_trend["date"]):
                df_trend["date"] = pd.to_datetime(df_trend["date"], errors="coerce")
            df_trend = df_trend.dropna(subset=["date"])
            if not df_trend.empty:
                df_trend["_month"] = df_trend["date"].dt.to_period("M")
                monthly_totals = df_trend.groupby("_month")["amount"].sum().sort_index()
                if len(monthly_totals) >= 2:
                    latest_month_spend = float(monthly_totals.iloc[-1])
                    prior_mean = float(monthly_totals.iloc[:-1].mean())
                    if latest_month_spend < prior_mean:
                        score = min(100, score + 5)
                        breakdown["Spending trend improving"] = +5
                    elif latest_month_spend > prior_mean:
                        score -= 5
                        breakdown["Spending trend rising"] = -5
                    # If equal, no change — trend is flat

    # Anomaly count penalty (reuses detect_anomalies)
    if not transactions.empty and "amount" in transactions.columns and "category" in transactions.columns:
        anomaly_list = detect_anomalies(transactions)
        n_anomalies = len(anomaly_list)
        if n_anomalies > 0:
            penalty = min(15, n_anomalies * 3)  # cap at -15
            score -= penalty
            breakdown["Anomalies detected"] = -penalty

    score = max(0, min(100, round(score)))

    return {"score": score, "breakdown": breakdown}


# ---------------------------------------------------------------------------
# Phase 4 additions (Kavya) -- deterministic, no LLM calls
# ---------------------------------------------------------------------------


def forecast_expenses(transactions: pd.DataFrame, months_ahead: int = 1) -> dict:
    """Forecast future monthly spending per category.

    Strategy:
      - If a category has **3 or more months** of history, fit a simple
        linear trend (least-squares, numpy.polyfit degree=1) and project
        forward by ``months_ahead`` using the trend line.
      - If fewer than 3 months exist, fall back to the Phase 4 flat-average
        approach (not enough data points for a meaningful trend).

    numpy ships with pandas — no new dependency needed.

    Note: This is an illustrative deterministic projection, not a trained
    time-series model or financial advice.

    Args:
        transactions: DataFrame containing transactions with 'date' (or
                      'transactionDate'), 'amount', and 'category'.
        months_ahead: Number of months to project forward (default 1).

    Returns:
        { category: projected_amount }

    Example (≥3 months, linear-trend path)::

        >>> import pandas as pd
        >>> df = pd.DataFrame([
        ...     {"date": "2026-01-15", "amount": 1000.0, "category": "Food"},
        ...     {"date": "2026-02-15", "amount": 1200.0, "category": "Food"},
        ...     {"date": "2026-03-15", "amount": 1400.0, "category": "Food"},
        ... ])
        >>> df["date"] = pd.to_datetime(df["date"])
        >>> forecast_expenses(df, months_ahead=1)
        {'Food': 1600.0}   # slope=200/mo, intercept=1000, x=3 → 1600

    Example (<3 months, flat-average fallback)::

        >>> df2 = pd.DataFrame([
        ...     {"date": "2026-01-15", "amount": 5000.0, "category": "Rent"},
        ...     {"date": "2026-02-15", "amount": 5000.0, "category": "Rent"},
        ... ])
        >>> df2["date"] = pd.to_datetime(df2["date"])
        >>> forecast_expenses(df2, months_ahead=1)
        {'Rent': 5000.0}   # avg of [5000, 5000] = 5000

    Example (empty DataFrame)::

        >>> forecast_expenses(pd.DataFrame(), months_ahead=1)
        {}
    """
    import numpy as np

    if transactions is None or transactions.empty:
        return {}

    df = transactions.copy()
    if "transactionDate" in df.columns and "date" not in df.columns:
        df["date"] = df["transactionDate"]
    elif "date" not in df.columns:
        return {}

    if not pd.api.types.is_datetime64_any_dtype(df["date"]):
        df["date"] = pd.to_datetime(df["date"], errors="coerce")

    df = df.dropna(subset=["date"])
    if df.empty:
        return {}

    if "category" not in df.columns:
        df["category"] = "General"
    else:
        df["category"] = df["category"].fillna("General").astype(str)

    if "amount" not in df.columns:
        return {}
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)

    # Filter for positive expenses
    df = df[df["amount"] > 0]
    if df.empty:
        return {}

    df["month"] = df["date"].dt.to_period("M")

    multiplier = max(1, int(months_ahead)) if months_ahead is not None else 1
    result: dict[str, float] = {}

    for cat, group in df.groupby("category"):
        monthly_totals = group.groupby("month")["amount"].sum().sort_index()
        n_months = len(monthly_totals)

        if n_months >= 3:
            # --- Linear trend (least-squares) ---
            # x-axis: 0, 1, 2, ... (month indices)
            # y-axis: monthly total spend
            x = np.arange(n_months, dtype=float)
            y = monthly_totals.values.astype(float)

            # polyfit degree 1 => [slope, intercept]
            slope, intercept = np.polyfit(x, y, 1)

            # Project forward: next month index = n_months, then n_months+1, ...
            # For months_ahead=1, projected value = slope*(n_months) + intercept
            # For months_ahead>1, sum projected values for the next N months
            projected = 0.0
            for i in range(multiplier):
                val = slope * (n_months + i) + intercept
                # Floor at 0 — projected spend can't be negative
                projected += max(0.0, val)

            result[str(cat)] = round(projected, 2)
        else:
            # --- Flat-average fallback (< 3 months of history) ---
            avg = float(monthly_totals.mean())
            result[str(cat)] = round(avg * multiplier, 2)

    return result


def calculate_goal_projection(
    goal: dict,
    transactions: pd.DataFrame,
    monthly_salary: float | None = None,
) -> dict:
    """Project realistic completion date and timeline for a financial savings goal.

    Replaces simplified Phase 3 placeholder math with real historical net savings.
    Computes average monthly net savings as:
      - (monthly_salary - average_monthly_spend) if monthly_salary is provided (> 0).
      - Heuristic: max(5000.0, avg_monthly_spend * 0.2) if monthly_salary is absent or <= 0
        (documented 20% savings heuristic).

    Args:
        goal: Dict containing goal parameters, e.g.:
              'target_amount' (float/int), 'current_saved' (float/int),
              and optionally 'target_date' or 'deadline' (str 'YYYY-MM-DD').
        transactions: DataFrame of user transactions.
        monthly_salary: Optional user monthly income/salary.

    Returns:
        {
            "on_track": bool,
            "projected_date": str,        # YYYY-MM-DD
            "months_remaining": int,
        }

    Example (with salary — net savings path)::

        >>> goal = {"target_amount": 600000, "current_saved": 100000, "target_date": "2028-12-31"}
        >>> # Assume avg monthly spend = 25000, salary = 75000
        >>> # net_savings = max(1000, 75000 - 25000) = 50000
        >>> # remaining = 500000, months = ceil(500000 / 50000) = 10
        >>> calculate_goal_projection(goal, transactions_df, monthly_salary=75000)
        {'on_track': True, 'projected_date': '2027-06-25', 'months_remaining': 10}

    Example (without salary — 20% heuristic path)::

        >>> goal = {"target_amount": 100000, "current_saved": 0}
        >>> # avg spend = 20000, net_savings = max(5000, 20000*0.2) = 5000
        >>> # months = ceil(100000 / 5000) = 20
        >>> calculate_goal_projection(goal, transactions_df)
        {'on_track': True, 'projected_date': '...', 'months_remaining': 20}

    Example (goal already achieved)::

        >>> goal = {"target_amount": 100000, "current_saved": 150000}
        >>> calculate_goal_projection(goal, pd.DataFrame())
        {'on_track': True, 'projected_date': '<today>', 'months_remaining': 0}
    """
    import math
    from datetime import datetime, timedelta

    target_amount = float(goal.get("target_amount", goal.get("targetAmount", 0.0)) or 0.0)
    current_saved = float(goal.get("current_saved", goal.get("currentSaved", 0.0)) or 0.0)
    remaining = max(0.0, target_amount - current_saved)

    if remaining <= 0:
        return {
            "on_track": True,
            "projected_date": datetime.now().strftime("%Y-%m-%d"),
            "months_remaining": 0,
        }

    # Compute average monthly spend from transaction history
    avg_monthly_spend = 0.0
    if transactions is not None and not transactions.empty:
        df = transactions.copy()
        if "transactionDate" in df.columns and "date" not in df.columns:
            df["date"] = df["transactionDate"]
        elif "date" not in df.columns:
            df["date"] = pd.Timestamp.now()

        df["date"] = pd.to_datetime(df["date"], errors="coerce").fillna(pd.Timestamp.now())
        df["amount"] = pd.to_numeric(df.get("amount", 0.0), errors="coerce").fillna(0.0)
        df["month"] = df["date"].dt.to_period("M").astype(str)
        monthly_totals = df[df["amount"] > 0].groupby("month")["amount"].sum()
        if not monthly_totals.empty:
            avg_monthly_spend = float(monthly_totals.mean())

    # Compute net monthly savings
    if monthly_salary is not None and float(monthly_salary) > 0:
        salary = float(monthly_salary)
        net_savings = max(1000.0, salary - avg_monthly_spend)
    else:
        # Documented heuristic: 20% savings buffer or baseline 5,000 INR
        net_savings = max(5000.0, avg_monthly_spend * 0.2)

    months_remaining = int(math.ceil(remaining / net_savings)) if net_savings > 0 else 12
    projected_dt = datetime.now() + timedelta(days=months_remaining * 30)
    projected_date = projected_dt.strftime("%Y-%m-%d")

    # Evaluate on-track status against goal deadline if available
    deadline_str = goal.get("target_date") or goal.get("deadline") or goal.get("targetDate")
    on_track = True
    if deadline_str:
        try:
            deadline_dt = pd.to_datetime(deadline_str).to_pydatetime()
            if deadline_dt.tzinfo is not None:
                deadline_dt = deadline_dt.replace(tzinfo=None)
            on_track = projected_dt <= deadline_dt
        except Exception:
            on_track = True

    return {
        "on_track": bool(on_track),
        "projected_date": projected_date,
        "months_remaining": months_remaining,
    }


# ---------------------------------------------------------------------------
# Phase 6 — What-If Simulator Calculation Model (Kavya, Task 2)
# ---------------------------------------------------------------------------


def simulate_scenario(
    transactions: list[dict] | pd.DataFrame | None = None,
    category_adjustments: dict[str, float] | None = None,
    income_adjustment: float | None = None,
    monthly_salary: float | None = None,
    parameters: dict | None = None,
) -> dict:
    """What-If Simulator: project financial outcomes under hypothetical changes.

    This is Pipeline 3's calculation model (Kavya → Aditi endpoint → Radhika UI
    → Rahul explanation layer). The function computes a **current** baseline
    from real transaction data and a **scenario** path with caller-supplied
    adjustments, then returns both paths plus the delta so downstream layers
    can consume a single, stable contract.

    The signature matches Rahul's wiring in ``main.py`` (``/internal/analytics/what-if``):
        simulate_scenario(transactions, category_adjustments, income_adjustment,
                          monthly_salary, parameters)

    Modes:
      1. **Expense-adjustment mode** (default): apply per-category multipliers
         via ``category_adjustments`` (e.g. ``{"Dining Out": -0.20}`` = 20% cut)
         and/or a flat ``income_adjustment`` delta to ``monthly_salary``.
      2. **Goal-projection mode**: when ``parameters`` contains a ``goal`` dict,
         compute a goal timeline under both current and scenario conditions
         using ``calculate_goal_projection()`` and return months/date deltas.

    Args:
        transactions:          List of transaction dicts or a DataFrame. Expected
                               columns: date (or transactionDate), amount, category.
        category_adjustments:  ``{ category: float }`` where the float is a
                               fractional delta applied to that category's
                               baseline spend (e.g. -0.20 = 20% reduction).
        income_adjustment:     A flat delta added to ``monthly_salary`` in the
                               scenario path (e.g. +10000 = ₹10K raise).
        monthly_salary:        User's current monthly income. Required for
                               goal-projection mode; optional otherwise.
        parameters:            Arbitrary extra params. Supports:
                               - ``goal``: dict with target_amount, current_saved,
                                 and optionally target_date — triggers goal mode.
                               - ``savings_rate_delta``: float, fraction added to
                                 the derived savings rate in goal mode.

    Returns:
        In **expense-adjustment mode**::

            {
                "status": "success",
                "scenario": "<scenario_type>",
                "baseline_monthly_spend": float,
                "projected_monthly_spend": float,
                "monthly_savings_delta": float,
                "annual_savings_delta": float,
                "category_projections": { category: projected_amount },
                "summary": str,
            }

        In **goal-projection mode**::

            {
                "status": "success",
                "current": {
                    "on_track": bool,
                    "projected_date": str,    # YYYY-MM-DD
                    "months_remaining": int,
                },
                "scenario": {
                    "on_track": bool,
                    "projected_date": str,
                    "months_remaining": int,
                    "achievable": bool,       # False when net_savings <= 0
                },
                "months_delta": int,          # negative = faster
                "date_delta_days": int,       # negative = sooner
            }

    Example (expense mode)::

        >>> simulate_scenario(
        ...     transactions=[{"date": "2026-01-10", "amount": 10000, "category": "Food"}],
        ...     category_adjustments={"Food": -0.25},
        ...     monthly_salary=80000,
        ... )
        {
            "status": "success",
            "scenario": "what_if_simulation",
            "baseline_monthly_spend": 10000.0,
            "projected_monthly_spend": 7500.0,
            "monthly_savings_delta": 2500.0,
            "annual_savings_delta": 30000.0,
            "category_projections": {"Food": 7500.0},
            "summary": "Adjustments project a monthly spend change from ₹10,000.00 ..."
        }

    Example (goal mode)::

        >>> simulate_scenario(
        ...     transactions=[...],
        ...     monthly_salary=75000,
        ...     income_adjustment=10000,
        ...     parameters={"goal": {"target_amount": 500000, "current_saved": 50000}},
        ... )
        {
            "status": "success",
            "current": {"on_track": True, "projected_date": "2027-06-...", "months_remaining": 9},
            "scenario": {"on_track": True, "projected_date": "2027-03-...", "months_remaining": 7, "achievable": True},
            "months_delta": -2,
            "date_delta_days": -60,
        }
    """
    import math
    from datetime import datetime, timedelta

    params = parameters or {}
    adjustments = category_adjustments or {}
    salary = float(monthly_salary) if monthly_salary is not None else 0.0
    inc_adj = float(income_adjustment) if income_adjustment is not None else 0.0

    # Build DataFrame from transactions
    if transactions is None:
        df = pd.DataFrame()
    elif isinstance(transactions, pd.DataFrame):
        df = transactions.copy()
    else:
        df = pd.DataFrame(transactions)

    if not df.empty:
        if "transactionDate" in df.columns and "date" not in df.columns:
            df["date"] = df["transactionDate"]
        if "date" in df.columns and not pd.api.types.is_datetime64_any_dtype(df["date"]):
            df["date"] = pd.to_datetime(df["date"], errors="coerce")
        if "amount" in df.columns:
            df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)

    # ----- Goal-projection mode -----
    goal = params.get("goal") if isinstance(params, dict) else None
    if isinstance(goal, dict) and goal:
        savings_rate_delta = float(params.get("savings_rate_delta", 0.0))

        # Current path
        current = calculate_goal_projection(
            goal=goal, transactions=df, monthly_salary=salary if salary > 0 else None,
        )

        # Scenario path: apply income delta + savings rate delta
        scenario_salary = salary + inc_adj
        if scenario_salary <= 0 and salary > 0:
            # Income reduced to zero or negative — not achievable
            return {
                "status": "success",
                "current": current,
                "scenario": {
                    "on_track": False,
                    "projected_date": "",
                    "months_remaining": -1,
                    "achievable": False,
                },
                "months_delta": 0,
                "date_delta_days": 0,
            }

        # Compute average monthly spend for scenario path
        avg_monthly_spend = 0.0
        if not df.empty and "amount" in df.columns:
            df_pos = df[df["amount"] > 0].copy()
            if "date" in df_pos.columns:
                df_pos["_month"] = df_pos["date"].dt.to_period("M").astype(str)
                monthly_totals = df_pos.groupby("_month")["amount"].sum()
                if not monthly_totals.empty:
                    avg_monthly_spend = float(monthly_totals.mean())

        # Apply category adjustments to average spend
        scenario_spend = avg_monthly_spend
        if adjustments and not df.empty and "category" in df.columns:
            df_pos = df[df["amount"] > 0].copy()
            if "date" in df_pos.columns:
                df_pos["_month"] = df_pos["date"].dt.to_period("M").astype(str)
                n_months = df_pos["_month"].nunique() if not df_pos.empty else 1
                n_months = max(1, n_months)
                cat_totals = df_pos.groupby("category")["amount"].sum()
                total_adj = 0.0
                for cat, adj_frac in adjustments.items():
                    cat_monthly = float(cat_totals.get(cat, 0.0)) / n_months
                    total_adj += cat_monthly * adj_frac
                scenario_spend = max(0.0, avg_monthly_spend + total_adj)

        # Compute scenario net savings
        if scenario_salary > 0:
            scenario_net = max(0.0, scenario_salary - scenario_spend)
        else:
            scenario_net = max(0.0, scenario_spend * (0.2 + savings_rate_delta))

        # Apply savings_rate_delta as an additive fraction of salary
        if savings_rate_delta != 0 and scenario_salary > 0:
            scenario_net += scenario_salary * savings_rate_delta

        target_amount = float(goal.get("target_amount", goal.get("targetAmount", 0)) or 0)
        current_saved = float(goal.get("current_saved", goal.get("currentSaved", 0)) or 0)
        remaining = max(0.0, target_amount - current_saved)

        if scenario_net <= 0:
            scenario_result = {
                "on_track": False,
                "projected_date": "",
                "months_remaining": -1,
                "achievable": False,
            }
            months_delta = 0
            date_delta_days = 0
        else:
            scenario_months = int(math.ceil(remaining / scenario_net)) if remaining > 0 else 0
            scenario_dt = datetime.now() + timedelta(days=scenario_months * 30)
            scenario_date = scenario_dt.strftime("%Y-%m-%d")

            deadline_str = goal.get("target_date") or goal.get("deadline") or goal.get("targetDate")
            scenario_on_track = True
            if deadline_str:
                try:
                    deadline_dt = pd.to_datetime(deadline_str).to_pydatetime()
                    if deadline_dt.tzinfo is not None:
                        deadline_dt = deadline_dt.replace(tzinfo=None)
                    scenario_on_track = scenario_dt <= deadline_dt
                except Exception:
                    scenario_on_track = True

            scenario_result = {
                "on_track": bool(scenario_on_track),
                "projected_date": scenario_date,
                "months_remaining": scenario_months,
                "achievable": True,
            }
            months_delta = scenario_months - current["months_remaining"]
            date_delta_days = months_delta * 30

        return {
            "status": "success",
            "current": current,
            "scenario": scenario_result,
            "months_delta": months_delta,
            "date_delta_days": date_delta_days,
        }

    # ----- Expense-adjustment mode (default) -----
    baseline = calculate_monthly_spending(df) if not df.empty else {"total": 0.0, "by_category": {}}
    baseline_total = float(baseline.get("total", 0.0))
    by_cat = dict(baseline.get("by_category", {}))

    projected_by_cat = {}
    for cat, amt in by_cat.items():
        adj = adjustments.get(cat, 0.0)
        projected_by_cat[cat] = round(max(0.0, float(amt) * (1.0 + adj)), 2)

    projected_total = round(sum(projected_by_cat.values()), 2) if projected_by_cat else baseline_total
    monthly_savings_delta = round(baseline_total - projected_total, 2)

    # Factor in income adjustment
    if inc_adj != 0 and salary > 0:
        monthly_savings_delta = round(monthly_savings_delta + inc_adj, 2)

    annual_savings_delta = round(monthly_savings_delta * 12.0, 2)

    scenario_type = "what_if_simulation"
    if isinstance(params, dict) and params.get("scenario_type"):
        scenario_type = params["scenario_type"]

    return {
        "status": "success",
        "scenario": scenario_type,
        "baseline_monthly_spend": baseline_total,
        "projected_monthly_spend": projected_total,
        "monthly_savings_delta": monthly_savings_delta,
        "annual_savings_delta": annual_savings_delta,
        "category_projections": projected_by_cat,
        "summary": (
            f"Adjustments project a monthly spend change from ₹{baseline_total:,.2f} to ₹{projected_total:,.2f}, "
            f"yielding potential net annual savings of ₹{annual_savings_delta:,.2f}."
        ),
    }

