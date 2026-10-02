"""A/B Spending Experiment Evaluation Engine (Analytics Step 5.3).

Provides deterministic statistics comparing baseline and intervention periods
for spending within a specific category. No LLM calls are made in this module.
"""
import pandas as pd


def evaluate_experiment(
    category: str,
    baseline_transactions: pd.DataFrame,
    intervention_transactions: pd.DataFrame,
    baseline_days: int,
    intervention_days: int,
) -> dict:
    """Evaluate spending changes between baseline and intervention periods for a category.

    Args:
        category: Target category name (e.g. "Dining Out", "Shopping", "Food").
        baseline_transactions: DataFrame of transactions for baseline period.
        intervention_transactions: DataFrame of transactions for intervention period.
        baseline_days: Number of days in the baseline period.
        intervention_days: Number of days in the intervention period.

    Returns:
        Dict containing:
            - category (str)
            - baseline_daily_avg (float)
            - intervention_daily_avg (float)
            - absolute_difference (float)
            - percent_difference (float)
            - confidence (str: 'high', 'medium', or 'low')
            - projected_annual_impact (float)
    """
    def _get_category_total(df: pd.DataFrame, cat: str) -> float:
        if df is None or df.empty:
            return 0.0

        df_copy = df.copy()

        # Filter by category if category column exists
        if "category" in df_copy.columns and cat:
            cat_mask = df_copy["category"].astype(str).str.strip().str.lower() == str(cat).strip().lower()
            df_copy = df_copy[cat_mask]

        if df_copy.empty or "amount" not in df_copy.columns:
            return 0.0

        amounts = pd.to_numeric(df_copy["amount"], errors="coerce").fillna(0.0)
        return float(amounts.sum())

    # Compute total spend for each period
    baseline_total = _get_category_total(baseline_transactions, category)
    intervention_total = _get_category_total(intervention_transactions, category)

    # Normalize daily average spend
    b_days = max(1, int(baseline_days)) if baseline_days is not None and baseline_days > 0 else 0
    i_days = max(1, int(intervention_days)) if intervention_days is not None and intervention_days > 0 else 0

    baseline_daily_avg = round(baseline_total / b_days, 2) if b_days > 0 else 0.0
    intervention_daily_avg = round(intervention_total / i_days, 2) if i_days > 0 else 0.0

    # Calculate differences
    absolute_difference = round(intervention_daily_avg - baseline_daily_avg, 2)

    if baseline_daily_avg > 0:
        percent_difference = round(((intervention_daily_avg - baseline_daily_avg) / baseline_daily_avg) * 100.0, 2)
    elif intervention_daily_avg > 0:
        percent_difference = 100.0
    else:
        percent_difference = 0.0

    diff_pct = abs(percent_difference)
    actual_i_days = intervention_days if intervention_days is not None else 0

    # Determine confidence level
    # High: intervention is at least 14 days and difference exceeds 20%
    # Low: under 7 days or under 10% difference
    # Medium: otherwise
    if actual_i_days < 7 or diff_pct < 10.0:
        confidence = "low"
    elif actual_i_days >= 14 and diff_pct > 20.0:
        confidence = "high"
    else:
        confidence = "medium"

    # Annual impact extrapolates daily difference over 365 days
    projected_annual_impact = round(absolute_difference * 365.0, 2)

    return {
        "category": category,
        "baseline_daily_avg": baseline_daily_avg,
        "intervention_daily_avg": intervention_daily_avg,
        "absolute_difference": absolute_difference,
        "percent_difference": percent_difference,
        "confidence": confidence,
        "projected_annual_impact": projected_annual_impact,
    }
