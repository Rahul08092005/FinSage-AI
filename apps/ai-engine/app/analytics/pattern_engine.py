"""Pattern Intelligence Engine — Automatic discovery of recurring behavioral spending rules.

Deterministic functions, no LLM calls, clear statistical evidence.
Phase 6 / Person 3 (Kavya) — Data, OCR & Financial Analytics.
"""
from __future__ import annotations

import re
import numpy as np
import pandas as pd

from app.analytics.spending import fit_linear_trend, calculate_goal_projection

# ---------------------------------------------------------------------------
# Constants and Classification Sets
# ---------------------------------------------------------------------------

DEFAULT_TIME_OF_MONTH_THRESHOLD = 0.30  # Bucket average must be >= 30% above next highest
DEFAULT_SALARY_SPEND_THRESHOLD = 0.30    # Post-salary daily spend must be >= 30% above rest of month
DEFAULT_TREND_MIN_MONTHS = 3            # Minimum months of history required for trend fit
DEFAULT_TREND_MIN_GROWTH_RATE = 0.05    # Minimum 5% monthly spending growth rate

DEFAULT_SUBSCRIPTION_CADENCE_DAYS = 30
DEFAULT_SUBSCRIPTION_TOLERANCE_DAYS = 5
DEFAULT_SUBSCRIPTION_MIN_OCCURRENCES = 3

DEFAULT_MONEY_LEAK_THRESHOLD = 200.0    # ₹200 small-transaction threshold
DEFAULT_MONEY_LEAK_MIN_SHARE = 0.15     # 15% of category spend
DEFAULT_MONEY_LEAK_MIN_COUNT = 3        # At least 3 small transactions
DEFAULT_MONEY_LEAK_REDUCTION_RATE = 0.30  # 30% reduction rate for annual savings

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


def _extract_merchant_name(row: pd.Series | dict) -> tuple[str, str]:
    """Extract cleaned merchant grouping key and display name from a transaction row.

    Returns:
        (grouping_key, display_name)
    """
    raw_text = ""
    for col in ["merchant", "description", "payee", "name", "title", "category"]:
        if col in row and pd.notna(row[col]) and str(row[col]).strip():
            raw_text = str(row[col]).strip()
            break

    if not raw_text:
        raw_text = "Unknown Merchant"

    # Clean text: remove UPI/POS/NACH prefixes and transaction noise
    cleaned = re.sub(
        r"^(upi[-/:]|pos[-/:]|mandate[-/:]|nach[-/:]|autopay[-/:]|netbanking[-/:]|neft[-/:]|imps[-/:])\s*",
        "",
        raw_text,
        flags=re.IGNORECASE,
    ).strip()

    # Remove trailing reference IDs like /12345 or @bank or #1234
    cleaned_base = re.sub(r"(@[a-zA-Z0-9]+|/[0-9a-zA-Z]+|#[0-9]+)$", "", cleaned).strip()
    if not cleaned_base:
        cleaned_base = cleaned

    group_key = cleaned_base.lower().strip()
    display_name = cleaned_base.title() if cleaned_base.islower() else cleaned_base
    return group_key, display_name


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


def detect_recurring_subscriptions(
    transactions: pd.DataFrame | list[dict] | None,
    cadence_tolerance_days: int = DEFAULT_SUBSCRIPTION_TOLERANCE_DAYS,
    min_occurrences: int = DEFAULT_SUBSCRIPTION_MIN_OCCURRENCES,
) -> list[dict]:
    """Identify recurring monthly subscription charges based on cadence and amount consistency.

    Groups transactions by (cleaned description/merchant, rounded amount) and flags
    groups appearing on a roughly monthly cadence (interval between occurrences within
    30 +/- cadence_tolerance_days, with at least min_occurrences charges).

    Args:
        transactions:           DataFrame or list of transactions.
        cadence_tolerance_days: Allowed deviation from 30-day cadence (default 5 days -> [25, 35]).
        min_occurrences:        Minimum matching consecutive charges (default 3).

    Returns:
        List of subscription dicts:
        [{
            "type": "subscription",
            "merchant": str,
            "amount": float,
            "occurrences": int,
            "estimated_annual_cost": float,
            "evidence": dict,
            "transactions": list[dict]
        }]
    """
    df = _normalize_transactions_df(transactions)
    if df.empty:
        return []

    expenses = df[df["amount"] > 0].copy()
    if expenses.empty or len(expenses) < min_occurrences:
        return []

    # Assign merchant info and rounded amount
    merchant_info = expenses.apply(_extract_merchant_name, axis=1)
    expenses["merchant_key"] = [info[0] for info in merchant_info]
    expenses["merchant_display"] = [info[1] for info in merchant_info]
    expenses["rounded_amount"] = expenses["amount"].round(2)

    min_interval = DEFAULT_SUBSCRIPTION_CADENCE_DAYS - cadence_tolerance_days  # 25
    max_interval = DEFAULT_SUBSCRIPTION_CADENCE_DAYS + cadence_tolerance_days  # 35

    subscriptions: list[dict] = []

    for (m_key, r_amt), group in expenses.groupby(["merchant_key", "rounded_amount"]):
        if len(group) < min_occurrences:
            continue

        sorted_group = group.sort_values("date")
        dates = sorted_group["date"].tolist()

        # Find the longest chain of transactions where each consecutive step is within [25, 35] days
        chain = [0]
        valid_chains = []

        for i in range(len(dates) - 1):
            gap = (dates[i + 1] - dates[i]).days
            if min_interval <= gap <= max_interval:
                if not chain or chain[-1] == i:
                    chain.append(i + 1)
                else:
                    if len(chain) >= min_occurrences:
                        valid_chains.append(list(chain))
                    chain = [i, i + 1]
            else:
                if len(chain) >= min_occurrences:
                    valid_chains.append(list(chain))
                chain = [i + 1]

        if len(chain) >= min_occurrences:
            valid_chains.append(list(chain))

        if not valid_chains:
            continue

        # Take the longest valid chain
        best_chain_indices = max(valid_chains, key=len)
        matched_txs = sorted_group.iloc[best_chain_indices]

        matched_dates = matched_txs["date"].tolist()
        intervals = [
            (matched_dates[k + 1] - matched_dates[k]).days
            for k in range(len(matched_dates) - 1)
        ]
        avg_interval = float(np.mean(intervals)) if intervals else 30.0

        sub_amount = float(matched_txs["amount"].iloc[0])
        merchant_name = str(matched_txs["merchant_display"].iloc[0])
        count = len(matched_txs)
        est_annual = round(sub_amount * 12.0, 2)

        tx_records = []
        for _, row in matched_txs.iterrows():
            tx_dict = {
                "date": row["date"].strftime("%Y-%m-%d"),
                "amount": float(row["amount"]),
                "category": str(row.get("category", "General")),
            }
            if "description" in row and pd.notna(row["description"]):
                tx_dict["description"] = str(row["description"])
            tx_records.append(tx_dict)

        subscriptions.append({
            "type": "subscription",
            "merchant": merchant_name,
            "amount": sub_amount,
            "occurrences": count,
            "estimated_annual_cost": est_annual,
            "evidence": {
                "merchant": merchant_name,
                "amount": sub_amount,
                "occurrences": count,
                "estimated_annual_cost": est_annual,
                "cadence_days_tolerance": cadence_tolerance_days,
                "average_interval_days": round(avg_interval, 1),
                "intervals_days": intervals,
                "transaction_dates": [d.strftime("%Y-%m-%d") for d in matched_dates],
            },
            "transactions": tx_records,
        })

    return subscriptions


def detect_money_leaks(
    transactions: pd.DataFrame | list[dict] | None,
    threshold: float = DEFAULT_MONEY_LEAK_THRESHOLD,
    min_share: float = DEFAULT_MONEY_LEAK_MIN_SHARE,
    min_count: int = DEFAULT_MONEY_LEAK_MIN_COUNT,
) -> list[dict]:
    """Aggregate small-transaction 'money leaks' and report categories with high leakage.

    Filters transactions with amount <= threshold, groups by category, and if the total
    across small transactions exceeds a meaningful share (min_share, default 15%) of that
    category's total spend, flags it as a money leak.

    Args:
        transactions: DataFrame or list of transactions.
        threshold:    Upper limit for small transactions in INR (default ₹200).
        min_share:    Minimum share of total category spend required (default 0.15 = 15%).
        min_count:    Minimum number of small transactions required (default 3).

    Returns:
        List of leak dicts:
        [{
            "type": "leak",
            "category": str,
            "count": int,
            "total": float,
            "projected_annual_savings_at_30pct_reduction": float,
            "evidence": dict,
            "transactions": list[dict]
        }]
    """
    df = _normalize_transactions_df(transactions)
    if df.empty:
        return []

    expenses = df[df["amount"] > 0].copy()
    if expenses.empty:
        return []

    # Number of unique months in dataset for annualization
    unique_months = expenses["date"].dt.to_period("M").nunique()
    months_count = max(1, unique_months)

    leaks: list[dict] = []

    for cat, group in expenses.groupby("category"):
        cat_str = str(cat).strip()
        if not cat_str or cat_str.lower() in ("salary", "income"):
            continue

        cat_total = float(group["amount"].sum())
        if cat_total <= 0:
            continue

        small_txs = group[group["amount"] <= threshold].sort_values("date")
        small_count = len(small_txs)
        small_total = float(small_txs["amount"].sum())

        if small_count < min_count or small_total <= 0:
            continue

        share = small_total / cat_total
        if share < min_share:
            continue

        # Annualize leak rate based on active dataset horizon
        monthly_leak_rate = small_total / months_count
        annual_leak_rate = monthly_leak_rate * 12.0
        projected_savings = round(annual_leak_rate * DEFAULT_MONEY_LEAK_REDUCTION_RATE, 2)

        tx_records = []
        for _, row in small_txs.iterrows():
            tx_dict = {
                "date": row["date"].strftime("%Y-%m-%d"),
                "amount": float(row["amount"]),
                "category": cat_str,
            }
            if "description" in row and pd.notna(row["description"]):
                tx_dict["description"] = str(row["description"])
            tx_records.append(tx_dict)

        leaks.append({
            "type": "leak",
            "category": cat_str,
            "count": small_count,
            "total": round(small_total, 2),
            "projected_annual_savings_at_30pct_reduction": projected_savings,
            "evidence": {
                "category": cat_str,
                "threshold": threshold,
                "small_transaction_count": small_count,
                "small_transaction_total": round(small_total, 2),
                "category_total_spend": round(cat_total, 2),
                "share_of_category_spend_pct": round(share * 100, 1),
                "min_share_threshold": min_share,
                "months_analyzed": months_count,
                "monthly_leak_rate": round(monthly_leak_rate, 2),
                "annual_leak_rate": round(annual_leak_rate, 2),
                "projected_annual_savings_at_30pct_reduction": projected_savings,
            },
            "transactions": tx_records,
        })

    return leaks


# ---------------------------------------------------------------------------
# Step 4.3 — Forward-Looking Risk Warnings
# ---------------------------------------------------------------------------


def detect_savings_decline(
    transactions: pd.DataFrame | list[dict] | None,
    monthly_salary: float | None = None,
) -> dict | None:
    """Detect sustained decline in net monthly savings over 3+ months.

    If monthly_salary is available, computes net savings (salary minus total spend)
    per month for the last 3+ months and flags a sustained decline.

    Args:
        transactions:   DataFrame or list of transactions.
        monthly_salary: Monthly salary/income. Required to compute net savings.

    Returns:
        Warning dict if a sustained decline is detected, else None:
        {
            "type": "warning",
            "subtype": "savings_decline",
            "message": str,
            "months_of_data": int,
            "evidence": dict,
        }
    """
    if monthly_salary is None:
        return None

    try:
        salary_val = float(monthly_salary)
    except (ValueError, TypeError):
        return None

    if salary_val <= 0:
        return None

    df = _normalize_transactions_df(transactions)
    if df.empty:
        return None

    expenses = df[df["amount"] > 0].copy()
    if expenses.empty:
        return None

    expenses["month"] = expenses["date"].dt.to_period("M")
    monthly_spend = expenses.groupby("month")["amount"].sum().sort_index()

    n_months = len(monthly_spend)
    if n_months < DEFAULT_TREND_MIN_MONTHS:
        return None

    # Calculate net savings per month: salary - spend
    net_savings = monthly_spend.apply(lambda s: salary_val - float(s))
    net_vals = net_savings.values.astype(float)

    slope, intercept = fit_linear_trend(net_vals)

    # Sustained decline criteria:
    # 1. Slope < 0 (savings decreasing over time)
    # 2. Latest net savings is strictly lower than starting net savings
    # 3. Strictly decreasing step-by-step OR clear negative slope with latest < previous
    is_strictly_decreasing = all(net_vals[i] < net_vals[i - 1] for i in range(1, n_months))
    is_trend_declining = (slope < 0) and (net_vals[-1] < net_vals[0]) and (net_vals[-1] < net_vals[-2])

    if not (is_strictly_decreasing or is_trend_declining):
        return None

    start_sav = net_vals[0]
    latest_sav = net_vals[-1]
    decline_amount = start_sav - latest_sav

    message = (
        f"Net monthly savings have consistently declined over the last {n_months} months "
        f"(from ₹{start_sav:,.2f} to ₹{latest_sav:,.2f}, down ₹{decline_amount:,.2f}/month)."
    )

    return {
        "type": "warning",
        "subtype": "savings_decline",
        "message": message,
        "months_of_data": n_months,
        "evidence": {
            "monthly_salary": salary_val,
            "monthly_net_savings": {str(m): round(float(v), 2) for m, v in net_savings.items()},
            "slope": round(float(slope), 2),
            "initial_savings": round(float(start_sav), 2),
            "latest_savings": round(float(latest_sav), 2),
            "months_analyzed": n_months,
        },
    }


def detect_discretionary_outpacing_income(
    transactions: pd.DataFrame | list[dict] | None,
    monthly_salary: float | None = None,
) -> dict | None:
    """Compare discretionary category growth against salary growth over 3+ months.

    Evaluates discretionary categories (Food, Shopping, Entertainment, etc.) over
    the last 3+ months and flags if their growth rate outpaces income growth
    (or flat salary rate of 0% if unchanged).

    Args:
        transactions:   DataFrame or list of transactions.
        monthly_salary: Optional user salary amount.

    Returns:
        Warning dict if discretionary spending outpaces income, else None:
        {
            "type": "warning",
            "subtype": "discretionary_outpacing_income",
            "message": str,
            "months_of_data": int,
            "evidence": dict,
        }
    """
    df = _normalize_transactions_df(transactions)
    if df.empty:
        return None

    expenses = df[df["amount"] > 0].copy()
    if expenses.empty:
        return None

    # Filter discretionary category expenses
    disc_df = expenses[expenses["category"].apply(_is_discretionary)].copy()
    if disc_df.empty:
        return None

    disc_df["month"] = disc_df["date"].dt.to_period("M")
    disc_monthly = disc_df.groupby("month")["amount"].sum().sort_index()

    n_months = len(disc_monthly)
    if n_months < DEFAULT_TREND_MIN_MONTHS:
        return None

    disc_vals = disc_monthly.values.astype(float)
    disc_slope, _ = fit_linear_trend(disc_vals)
    disc_mean = float(np.mean(disc_vals))

    if disc_mean <= 0 or disc_slope <= 0 or disc_vals[-1] <= disc_vals[0]:
        return None

    disc_growth_rate = disc_slope / disc_mean

    # Check for income / salary growth rate in transaction data if present
    income_growth_rate = 0.0
    salary_keywords = {"salary", "payroll", "stipend", "direct dep", "neft credit"}
    cat_mask = df["category"].str.lower().isin(["salary", "income"])
    desc_mask = pd.Series(False, index=df.index)
    if "description" in df.columns:
        desc_mask = df["description"].astype(str).str.lower().apply(
            lambda d: any(kw in d for kw in salary_keywords)
        )
    credit_mask = df["amount"] < 0

    inc_rows = df[cat_mask | desc_mask | credit_mask].copy()
    if not inc_rows.empty:
        inc_rows["abs_amount"] = inc_rows["amount"].abs()
        inc_rows["month"] = inc_rows["date"].dt.to_period("M")
        inc_monthly = inc_rows.groupby("month")["abs_amount"].sum().sort_index()
        if len(inc_monthly) >= DEFAULT_TREND_MIN_MONTHS:
            inc_vals = inc_monthly.values.astype(float)
            inc_slope, _ = fit_linear_trend(inc_vals)
            inc_mean = float(np.mean(inc_vals))
            if inc_mean > 0:
                income_growth_rate = max(0.0, inc_slope / inc_mean)

    # Discretionary growth rate must exceed income growth rate
    if disc_growth_rate <= income_growth_rate + 0.02:
        return None

    disc_pct = disc_growth_rate * 100.0
    inc_pct = income_growth_rate * 100.0

    message = (
        f"Discretionary spending growth (+{disc_pct:.1f}%/month) is outpacing income growth "
        f"({'+' if inc_pct > 0 else ''}{inc_pct:.1f}%/month) over the last {n_months} months."
    )

    return {
        "type": "warning",
        "subtype": "discretionary_outpacing_income",
        "message": message,
        "months_of_data": n_months,
        "evidence": {
            "discretionary_monthly_totals": {str(m): round(float(v), 2) for m, v in disc_monthly.items()},
            "discretionary_slope": round(float(disc_slope), 2),
            "discretionary_growth_rate_pct": round(float(disc_pct), 1),
            "income_growth_rate_pct": round(float(inc_pct), 1),
            "months_analyzed": n_months,
            "monthly_salary": monthly_salary,
        },
    }


def detect_goal_delay_risk(
    goal: dict,
    projection: dict,
) -> dict | None:
    """Wrap calculate_goal_projection() result into a warning if off-track.

    Args:
        goal:       Goal dict containing title, target_amount, deadline/target_date.
        projection: Output dict from calculate_goal_projection().

    Returns:
        Warning dict if on_track is False, else None:
        {
            "type": "warning",
            "subtype": "goal_delay_risk",
            "message": str,
            "goal_title": str,
            "evidence": dict,
        }
    """
    if not isinstance(projection, dict) or projection.get("on_track", True):
        return None

    goal_title = str(goal.get("title") or goal.get("name") or goal.get("goal_name") or "Savings Goal").strip()
    projected_date = str(projection.get("projected_date", "unknown date"))
    months_remaining = projection.get("months_remaining", 0)
    target_date = str(goal.get("target_date") or goal.get("deadline") or goal.get("targetDate") or "target date")

    message = (
        f"Goal '{goal_title}' is at risk of delay. Current savings velocity projects completion by "
        f"{projected_date} ({months_remaining} months away), missing the target date of {target_date}."
    )

    return {
        "type": "warning",
        "subtype": "goal_delay_risk",
        "message": message,
        "goal_title": goal_title,
        "evidence": {
            "goal": goal,
            "projection": projection,
            "target_date": target_date,
            "projected_date": projected_date,
            "months_remaining": months_remaining,
        },
    }


# ---------------------------------------------------------------------------
# Top-Level Orchestration
# ---------------------------------------------------------------------------


def run_pattern_detection(
    transactions: pd.DataFrame | list[dict] | None,
    salary_day: int | None = None,
    monthly_salary: float | None = None,
    goals: list[dict] | dict | None = None,
) -> list[dict]:
    """Execute all pattern detection heuristics and return a unified list of findings.

    Args:
        transactions:   DataFrame or list of transactions with date, amount, category.
        salary_day:     Optional day-of-month when salary arrives (e.g. from user profile).
        monthly_salary: Optional user monthly salary/income.
        goals:          Optional list of goal dicts (or single goal dict).

    Returns:
        List of pattern and insight dicts covering:
        1. Time-of-month spending concentration (type: "pattern")
        2. Post-salary discretionary surge (type: "pattern")
        3. Upward category trends (type: "pattern")
        4. Recurring subscriptions (type: "subscription")
        5. Money leaks (type: "leak")
        6. Net savings decline risk (type: "warning", subtype: "savings_decline")
        7. Discretionary outpacing income risk (type: "warning", subtype: "discretionary_outpacing_income")
        8. Goal delay risk (type: "warning", subtype: "goal_delay_risk")
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

    # 4. Recurring subscriptions
    subscriptions = detect_recurring_subscriptions(df)
    patterns.extend(subscriptions)

    # 5. Money leaks / small transaction leakage
    leaks = detect_money_leaks(df)
    patterns.extend(leaks)

    # 6. Risk Warnings — Savings Decline
    savings_warn = detect_savings_decline(df, monthly_salary=monthly_salary)
    if savings_warn is not None:
        patterns.append(savings_warn)

    # 7. Risk Warnings — Discretionary Outpacing Income
    disc_warn = detect_discretionary_outpacing_income(df, monthly_salary=monthly_salary)
    if disc_warn is not None:
        patterns.append(disc_warn)

    # 8. Risk Warnings — Goal Delay Risk
    if goals:
        goals_list = [goals] if isinstance(goals, dict) else goals
        if isinstance(goals_list, list):
            for g in goals_list:
                if isinstance(g, dict) and g:
                    proj = calculate_goal_projection(g, df, monthly_salary=monthly_salary)
                    g_warn = detect_goal_delay_risk(g, proj)
                    if g_warn is not None:
                        patterns.append(g_warn)

    return patterns


__all__ = [
    "DEFAULT_TIME_OF_MONTH_THRESHOLD",
    "DEFAULT_SALARY_SPEND_THRESHOLD",
    "DEFAULT_TREND_MIN_MONTHS",
    "DEFAULT_TREND_MIN_GROWTH_RATE",
    "DEFAULT_SUBSCRIPTION_CADENCE_DAYS",
    "DEFAULT_SUBSCRIPTION_TOLERANCE_DAYS",
    "DEFAULT_SUBSCRIPTION_MIN_OCCURRENCES",
    "DEFAULT_MONEY_LEAK_THRESHOLD",
    "DEFAULT_MONEY_LEAK_MIN_SHARE",
    "DEFAULT_MONEY_LEAK_MIN_COUNT",
    "DEFAULT_MONEY_LEAK_REDUCTION_RATE",
    "detect_time_of_month_patterns",
    "detect_salary_triggered_spending",
    "detect_category_trend",
    "detect_recurring_subscriptions",
    "detect_money_leaks",
    "detect_savings_decline",
    "detect_discretionary_outpacing_income",
    "detect_goal_delay_risk",
    "run_pattern_detection",
]
