"""Pattern Intelligence Engine — Automatic discovery of recurring behavioral spending rules.

Deterministic functions, no LLM calls, clear statistical evidence.
Phase 6 / Person 3 (Kavya) — Data, OCR & Financial Analytics.
"""
from __future__ import annotations

import re
import numpy as np
import pandas as pd

from app.analytics.spending import fit_linear_trend

# ---------------------------------------------------------------------------
# Constants and Classification Sets
# ---------------------------------------------------------------------------

DEFAULT_TIME_OF_MONTH_THRESHOLD = 0.30  # Bucket average must be >= 30% above next highest
DEFAULT_SALARY_SPEND_THRESHOLD = 0.30    # Post-salary daily spend must be >= 30% above rest of month
DEFAULT_TREND_MIN_MONTHS = 3            # Minimum months of history required for trend fit
DEFAULT_TREND_MIN_GROWTH_RATE = 0.05    # Minimum 5% monthly spending growth rate

# Typical discretionary categories (wants / flexible spending)
DEFAULT_DISCRETIONARY_CATEGORIES = {
    "food",
    "shopping",
    "entertainment",
    "festivals & gifts",
    "dining out",
    "travel",
    "leisure",
    "personal care",
    "electronics",
    "clothing",
    "hobbies",
    "restaurants",
    "swiggy",
    "zomato",
}

# Fixed / non-discretionary categories (needs / fixed obligations / income)
NON_DISCRETIONARY_CATEGORIES = {
    "rent",
    "emi",
    "bills",
    "healthcare",
    "education",
    "domestic help",
    "investment",
    "tax",
    "insurance",
    "utilities",
    "salary",
    "income",
}


# ---------------------------------------------------------------------------
# Normalization & Helpers
# ---------------------------------------------------------------------------


def _normalize_transactions_df(transactions: pd.DataFrame | list[dict] | None) -> pd.DataFrame:
    """Normalize raw transactions into a clean DataFrame with date, amount, category."""
    if transactions is None:
        return pd.DataFrame()

    if isinstance(transactions, list):
        if not transactions:
            return pd.DataFrame()
        df = pd.DataFrame(transactions)
    elif isinstance(transactions, pd.DataFrame):
        df = transactions.copy()
    else:
        return pd.DataFrame()

    if df.empty:
        return pd.DataFrame()

    # Resolve date column
    if "transactionDate" in df.columns and "date" not in df.columns:
        df["date"] = df["transactionDate"]
    elif "date" not in df.columns:
        return pd.DataFrame()

    if not pd.api.types.is_datetime64_any_dtype(df["date"]):
        df["date"] = pd.to_datetime(df["date"], errors="coerce")

    df = df.dropna(subset=["date"])
    if df.empty:
        return pd.DataFrame()

    # Resolve amount
    if "amount" not in df.columns:
        return pd.DataFrame()
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)

    # Resolve category
    if "category" not in df.columns:
        df["category"] = "General"
    else:
        df["category"] = df["category"].fillna("General").astype(str)

    return df


def _detect_recurring_salary_day(df: pd.DataFrame) -> int | None:
    """Detect recurring salary arrival day-of-month from transactions if available.

    Checks for:
      - Category containing 'salary' or 'income'
      - Description mentioning salary, payroll, stipend, or direct deposit
      - Credit transactions
    """
    if df.empty:
        return None

    salary_keywords = {"salary", "payroll", "stipend", "direct dep", "neft credit"}

    mask_cat = df["category"].str.lower().isin(["salary", "income"])
    mask_desc = pd.Series(False, index=df.index)
    if "description" in df.columns:
        mask_desc = df["description"].astype(str).str.lower().apply(
            lambda desc: any(kw in desc for kw in salary_keywords)
        )

    # Also check negative amounts if credits are represented as negative numbers
    mask_credit = df["amount"] < 0

    candidate_rows = df[mask_cat | mask_desc | mask_credit]
    if candidate_rows.empty:
        return None

    # Get day of month
    days = candidate_rows["date"].dt.day
    if days.empty:
        return None

    modal_day = int(days.mode().iloc[0])
    return modal_day


def _is_discretionary(category: str) -> bool:
    """Classify whether a category is discretionary."""
    cat_lower = str(category).strip().lower()
    if cat_lower in DEFAULT_DISCRETIONARY_CATEGORIES:
        return True
    if cat_lower in NON_DISCRETIONARY_CATEGORIES:
        return False
    # If unclassified, default to True for behavioral analysis
    return True


# ---------------------------------------------------------------------------
# Core Pattern Detectors
# ---------------------------------------------------------------------------


def detect_time_of_month_patterns(
    transactions: pd.DataFrame | list[dict] | None,
    threshold: float = DEFAULT_TIME_OF_MONTH_THRESHOLD,
) -> list[dict]:
    """Discover spending concentration across early, mid, and late thirds of the month.

    Buckets:
      - 'early': Days 1 to 10
      - 'mid':   Days 11 to 20
      - 'late':  Days 21 to end of month

    Calculates the true average daily spend per bucket for each category:
      daily_average = total_bucket_spend / total_bucket_days_in_period

    Reports any category where the peak bucket's daily average is at least
    ``threshold`` (default 30%) higher than the next highest bucket.

    Args:
        transactions: DataFrame or list of transaction dicts.
        threshold:    Fractional difference required above the second highest
                      bucket (default 0.30 = 30%).

    Returns:
        List of pattern dicts:
        [{
            "type": "pattern",
            "title": str,
            "evidence": dict,
            "category": str
        }]
    """
    df = _normalize_transactions_df(transactions)
    if df.empty:
        return []

    # Filter for positive expenses
    expenses = df[df["amount"] > 0].copy()
    if expenses.empty:
        return []

    # Compute total days in each bucket across all unique months in dataset
    expenses["year_month"] = expenses["date"].dt.to_period("M")
    unique_months = expenses["year_month"].unique()

    total_early_days = 0
    total_mid_days = 0
    total_late_days = 0

    for ym in unique_months:
        days_in_m = ym.days_in_month
        total_early_days += 10
        total_mid_days += 10
        total_late_days += max(1, days_in_m - 20)

    bucket_days = {
        "early": total_early_days,
        "mid": total_mid_days,
        "late": total_late_days,
    }

    # Assign each transaction to a bucket
    days = expenses["date"].dt.day
    expenses["bucket"] = np.where(
        days <= 10,
        "early",
        np.where(days <= 20, "mid", "late"),
    )

    bucket_labels = {
        "early": "days 1-10",
        "mid": "days 11-20",
        "late": "days 21-end",
    }

    patterns: list[dict] = []

    for cat, group in expenses.groupby("category"):
        cat_total = float(group["amount"].sum())
        if cat_total <= 0:
            continue

        spend_by_bucket = group.groupby("bucket")["amount"].sum().to_dict()
        early_spend = float(spend_by_bucket.get("early", 0.0))
        mid_spend = float(spend_by_bucket.get("mid", 0.0))
        late_spend = float(spend_by_bucket.get("late", 0.0))

        daily_avgs = {
            "early": early_spend / bucket_days["early"],
            "mid": mid_spend / bucket_days["mid"],
            "late": late_spend / bucket_days["late"],
        }

        # Find peak and second highest
        sorted_buckets = sorted(daily_avgs.items(), key=lambda kv: kv[1], reverse=True)
        peak_bucket, peak_avg = sorted_buckets[0]
        second_bucket, second_highest = sorted_buckets[1]

        if peak_avg <= 0:
            continue

        if second_highest > 0:
            pct_diff = (peak_avg - second_highest) / second_highest
            meets_threshold = pct_diff >= threshold
        else:
            pct_diff = float("inf")
            meets_threshold = True

        if meets_threshold:
            pct_display = (
                f"+{pct_diff * 100:.1f}%"
                if pct_diff != float("inf")
                else "exclusive concentration"
            )
            title = (
                f"Spends significantly more on {cat} in the {peak_bucket} third of the "
                f"month ({bucket_labels[peak_bucket]})"
            )
            patterns.append({
                "type": "pattern",
                "title": title,
                "category": str(cat),
                "evidence": {
                    "peak_bucket": peak_bucket,
                    "peak_daily_avg": round(peak_avg, 2),
                    "second_highest_avg": round(second_highest, 2),
                    "daily_averages": {
                        "early": round(daily_avgs["early"], 2),
                        "mid": round(daily_avgs["mid"], 2),
                        "late": round(daily_avgs["late"], 2),
                    },
                    "percentage_above_next": (
                        round(pct_diff * 100, 1) if pct_diff != float("inf") else 100.0
                    ),
                    "threshold_applied": threshold,
                    "category_total_spend": round(cat_total, 2),
                },
            })

    return patterns


def detect_salary_triggered_spending(
    transactions: pd.DataFrame | list[dict] | None,
    salary_date_guess: int | None = None,
    threshold: float = DEFAULT_SALARY_SPEND_THRESHOLD,
) -> dict | None:
    """Detect elevated discretionary spending in the 5 days after salary arrival.

    Compares the average daily discretionary spend during the 5 days following
    salary arrival (days S+1 through S+5) vs. the rest of the month.

    Args:
        transactions:       DataFrame or list of transactions.
        salary_date_guess:  Day-of-month salary lands on (e.g. 1 or 28), passed
                            from user profile data if not detectable from transactions.
        threshold:          Minimum fractional rise in daily discretionary spend
                            required to trigger a pattern (default 0.30 = 30%).

    Returns:
        Pattern dict if a statistically significant rise is detected, else None.
    """
    df = _normalize_transactions_df(transactions)
    if df.empty:
        return None

    # Determine salary day
    salary_day: int | None = None
    if salary_date_guess is not None:
        try:
            val = int(salary_date_guess)
            if 1 <= val <= 31:
                salary_day = val
        except (ValueError, TypeError):
            salary_day = None

    if salary_day is None:
        salary_day = _detect_recurring_salary_day(df)

    if salary_day is None:
        return None

    # Filter for positive discretionary expenses
    expenses = df[df["amount"] > 0].copy()
    if expenses.empty:
        return None

    # Select discretionary transactions
    discretionary = expenses[expenses["category"].apply(_is_discretionary)].copy()
    if discretionary.empty:
        # Fallback: exclude explicit non-discretionary fixed costs
        discretionary = expenses[
            ~expenses["category"].str.lower().isin(NON_DISCRETIONARY_CATEGORIES)
        ].copy()

    if discretionary.empty:
        return None

    # Compute days in post-salary window vs rest of month across months
    discretionary["year_month"] = discretionary["date"].dt.to_period("M")
    unique_months = discretionary["year_month"].unique()

    total_post_days = 0
    total_rest_days = 0

    for ym in unique_months:
        days_in_m = ym.days_in_month
        total_post_days += 5
        total_rest_days += max(1, days_in_m - 5)

    if total_post_days == 0 or total_rest_days == 0:
        return None

    # Determine which transactions fall in the 5 days after salary day
    # Day offset (1 to 5) modulo days_in_month
    discretionary["days_in_month"] = discretionary["date"].dt.days_in_month
    discretionary["day"] = discretionary["date"].dt.day
    discretionary["offset"] = (
        discretionary["day"] - salary_day - 1
    ) % discretionary["days_in_month"]
    is_post_salary = discretionary["offset"] < 5

    post_spend = float(discretionary[is_post_salary]["amount"].sum())
    rest_spend = float(discretionary[~is_post_salary]["amount"].sum())

    post_daily_avg = post_spend / total_post_days
    rest_daily_avg = rest_spend / total_rest_days

    if post_daily_avg <= 0:
        return None

    if rest_daily_avg > 0:
        pct_increase = (post_daily_avg - rest_daily_avg) / rest_daily_avg
    else:
        pct_increase = float("inf")

    if pct_increase < threshold:
        return None

    pct_display = (
        round(pct_increase * 100, 1) if pct_increase != float("inf") else 100.0
    )
    title = (
        f"Discretionary spending increases by {pct_display:.1f}% in the 5 days "
        f"following salary arrival (day {salary_day})"
    )

    return {
        "type": "pattern",
        "title": title,
        "category": "Discretionary",
        "evidence": {
            "salary_day": salary_day,
            "post_salary_daily_avg": round(post_daily_avg, 2),
            "rest_of_month_daily_avg": round(rest_daily_avg, 2),
            "percentage_increase": pct_display,
            "threshold_applied": threshold,
            "post_salary_total_spend": round(post_spend, 2),
            "rest_of_month_total_spend": round(rest_spend, 2),
        },
    }


def detect_category_trend(
    transactions: pd.DataFrame | list[dict] | None,
    category: str,
    months: int = 4,
    min_growth_rate: float = DEFAULT_TREND_MIN_GROWTH_RATE,
) -> dict | None:
    """Flag a category with a sustained upward spending trend over the given months.

    Reuses the least-squares linear trend logic established in ``forecast_expenses()``
    via the shared ``fit_linear_trend()`` helper.

    Args:
        transactions:    DataFrame or list of transactions.
        category:        Category name to test for upward trend.
        months:          Number of recent months to evaluate (default 4).
        min_growth_rate: Minimum monthly relative growth rate required (default 0.05 = 5%).

    Returns:
        Pattern dict if a sustained upward trend is detected, else None.
    """
    df = _normalize_transactions_df(transactions)
    if df.empty or not category:
        return None

    # Filter for target category and positive spend
    cat_mask = df["category"].str.lower() == str(category).strip().lower()
    cat_df = df[cat_mask & (df["amount"] > 0)].copy()
    if cat_df.empty:
        return None

    cat_df["month"] = cat_df["date"].dt.to_period("M")
    monthly_totals = cat_df.groupby("month")["amount"].sum().sort_index()

    # Need at least 3 months to fit a reliable trend line (matches forecast_expenses)
    recent = monthly_totals.iloc[-months:]
    n_months = len(recent)
    if n_months < DEFAULT_TREND_MIN_MONTHS:
        return None

    # Fit linear trend using shared helper
    y = recent.values.astype(float)
    slope, intercept = fit_linear_trend(y)

    mean_spend = float(np.mean(y))
    if mean_spend <= 0:
        return None

    growth_rate = slope / mean_spend

    # Goodness of fit (R-squared)
    x = np.arange(n_months, dtype=float)
    y_pred = slope * x + intercept
    ss_tot = float(np.sum((y - mean_spend) ** 2))
    ss_res = float(np.sum((y - y_pred) ** 2))
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

    # Sustained upward criteria:
    # 1. Positive slope
    # 2. End amount > start amount
    # 3. Monthly growth rate >= 5% or strong rupee slope (>= 50/mo)
    # 4. R-squared >= 0.30 (not purely random noise)
    is_sustained = (
        slope > 0
        and y[-1] > y[0]
        and (growth_rate >= min_growth_rate or slope >= 50.0)
        and r2 >= 0.30
    )

    if not is_sustained:
        return None

    title = (
        f"Sustained upward spending trend in {category} over the last {n_months} "
        f"months (+₹{slope:.2f}/month)"
    )

    total_growth_pct = ((y[-1] - y[0]) / y[0] * 100) if y[0] > 0 else 100.0

    return {
        "type": "pattern",
        "title": title,
        "category": str(category),
        "evidence": {
            "months_analyzed": n_months,
            "monthly_totals": {str(m): round(float(v), 2) for m, v in recent.items()},
            "slope": round(float(slope), 2),
            "intercept": round(float(intercept), 2),
            "monthly_growth_rate_pct": round(float(growth_rate * 100), 1),
            "total_increase_pct": round(float(total_growth_pct), 1),
            "r_squared": round(float(r2), 3),
            "start_amount": round(float(y[0]), 2),
            "latest_amount": round(float(y[-1]), 2),
        },
    }


# ---------------------------------------------------------------------------
# Top-Level Orchestration
# ---------------------------------------------------------------------------


def run_pattern_detection(
    transactions: pd.DataFrame | list[dict] | None,
    salary_day: int | None = None,
) -> list[dict]:
    """Execute all pattern detection heuristics and return a unified list of findings.

    Args:
        transactions: DataFrame or list of transactions with date, amount, category.
        salary_day:   Optional day-of-month when salary arrives (e.g. from user profile).

    Returns:
        List of pattern dicts shaped:
        {
            "type": "pattern",
            "title": <short human sentence>,
            "evidence": {...numbers...},
            "category": str | None
        }
    """
    df = _normalize_transactions_df(transactions)
    if df.empty:
        return []

    patterns: list[dict] = []

    # 1. Time of month patterns (early / mid / late)
    time_patterns = detect_time_of_month_patterns(df)
    patterns.extend(time_patterns)

    # 2. Salary-triggered spending
    salary_pattern = detect_salary_triggered_spending(df, salary_date_guess=salary_day)
    if salary_pattern is not None:
        patterns.append(salary_pattern)

    # 3. Category trends (linear trend across distinct categories)
    if "category" in df.columns:
        categories = df["category"].dropna().unique()
        for cat in categories:
            cat_str = str(cat).strip()
            if not cat_str or cat_str.lower() in ("salary", "income"):
                continue
            trend = detect_category_trend(df, category=cat_str)
            if trend is not None:
                patterns.append(trend)

    return patterns
