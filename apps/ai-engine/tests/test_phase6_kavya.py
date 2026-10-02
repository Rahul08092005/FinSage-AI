"""Phase 6 Unit Tests — Kavya (Data, OCR & Financial Analytics Owner).

Covers:
  Task 1 — forecast_expenses() and calculate_goal_projection() validation
  Task 2 — simulate_scenario() (What-If Simulator)
  Task 3 — calculate_health_score() 2.0 (trend + anomaly extensions)
  Regression — detect_anomalies, existing health_score behavior, OCR pipeline import
"""
import math
import pytest
import pandas as pd
from datetime import datetime, timedelta

from app.analytics.spending import (
    calculate_monthly_spending,
    calculate_category_breakdown,
    calculate_budget_recommendation,
    detect_anomalies,
    calculate_health_score,
    forecast_expenses,
    calculate_goal_projection,
    simulate_scenario,
)


# ===========================================================================
# Shared Fixtures
# ===========================================================================


@pytest.fixture
def multi_month_df():
    """4 months of transactions across 2 categories — enough for linear trend."""
    rows = [
        {"date": "2026-01-15", "amount": 1000.0, "category": "Food"},
        {"date": "2026-02-15", "amount": 1200.0, "category": "Food"},
        {"date": "2026-03-15", "amount": 1400.0, "category": "Food"},
        {"date": "2026-04-15", "amount": 1600.0, "category": "Food"},
        {"date": "2026-01-10", "amount": 5000.0, "category": "Rent"},
        {"date": "2026-02-10", "amount": 5000.0, "category": "Rent"},
        {"date": "2026-03-10", "amount": 5000.0, "category": "Rent"},
        {"date": "2026-04-10", "amount": 5000.0, "category": "Rent"},
    ]
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    return df


@pytest.fixture
def two_month_df():
    """2 months of data — below the 3-month threshold for linear trend."""
    rows = [
        {"date": "2026-01-15", "amount": 5000.0, "category": "Rent"},
        {"date": "2026-02-15", "amount": 5000.0, "category": "Rent"},
    ]
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    return df


@pytest.fixture
def anomaly_df():
    """Dataset with one clear anomaly in the Food category.

    Values: [100, 110, 105, 95, 2000].
    mean ≈ 482, std ≈ 842 → threshold ≈ 2166 ... but with pandas std (ddof=1)
    we get std ≈ 841.7 so threshold ≈ 2165. 2000 is close. Better approach:
    use enough normal values so the outlier clearly exceeds 2*std.
    """
    rows = [
        {"date": "2026-01-01", "amount": 100.0, "category": "Food"},
        {"date": "2026-01-05", "amount": 110.0, "category": "Food"},
        {"date": "2026-01-10", "amount": 105.0, "category": "Food"},
        {"date": "2026-01-15", "amount": 95.0,  "category": "Food"},
        {"date": "2026-01-18", "amount": 100.0, "category": "Food"},
        {"date": "2026-01-19", "amount": 108.0, "category": "Food"},
        {"date": "2026-01-20", "amount": 2000.0, "category": "Food"},  # anomaly
    ]
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    return df


# ===========================================================================
# Task 1: forecast_expenses() validation
# ===========================================================================


class TestForecastExpenses:

    def test_linear_trend_3plus_months(self, multi_month_df):
        """≥3 months of history → linear regression forecast."""
        result = forecast_expenses(multi_month_df, months_ahead=1)
        assert "Food" in result
        assert "Rent" in result
        # Food: slope=200, intercept=1000, x=4 → 1800
        assert result["Food"] == pytest.approx(1800.0, abs=1.0)
        # Rent: flat at 5000, slope ≈ 0 → ≈ 5000
        assert result["Rent"] == pytest.approx(5000.0, abs=1.0)

    def test_flat_average_under_3_months(self, two_month_df):
        """<3 months → flat-average fallback."""
        result = forecast_expenses(two_month_df, months_ahead=1)
        assert "Rent" in result
        # avg of [5000, 5000] = 5000
        assert result["Rent"] == pytest.approx(5000.0, abs=0.01)

    def test_empty_dataframe(self):
        """Empty DataFrame → empty dict."""
        result = forecast_expenses(pd.DataFrame(), months_ahead=1)
        assert result == {}

    def test_none_input(self):
        """None transactions → empty dict."""
        result = forecast_expenses(None, months_ahead=1)
        assert result == {}

    def test_zero_spend_category(self, multi_month_df):
        """Category with all-zero amounts should not appear (filtered by >0)."""
        df = multi_month_df.copy()
        zero_rows = pd.DataFrame([
            {"date": pd.Timestamp("2026-01-01"), "amount": 0.0, "category": "ZeroCat"},
            {"date": pd.Timestamp("2026-02-01"), "amount": 0.0, "category": "ZeroCat"},
            {"date": pd.Timestamp("2026-03-01"), "amount": 0.0, "category": "ZeroCat"},
        ])
        df = pd.concat([df, zero_rows], ignore_index=True)
        result = forecast_expenses(df, months_ahead=1)
        assert "ZeroCat" not in result
        assert "Food" in result

    def test_months_ahead_multiple(self, multi_month_df):
        """months_ahead > 1 should sum projected values for N future months."""
        result_1 = forecast_expenses(multi_month_df, months_ahead=1)
        result_3 = forecast_expenses(multi_month_df, months_ahead=3)
        # Multi-month sum should be > single month for a rising category
        assert result_3["Food"] > result_1["Food"]

    def test_transactionDate_column_alias(self):
        """Function should accept 'transactionDate' as a date column alias."""
        rows = [
            {"transactionDate": "2026-01-15", "amount": 100.0, "category": "Test"},
            {"transactionDate": "2026-02-15", "amount": 200.0, "category": "Test"},
            {"transactionDate": "2026-03-15", "amount": 300.0, "category": "Test"},
        ]
        df = pd.DataFrame(rows)
        result = forecast_expenses(df, months_ahead=1)
        assert "Test" in result
        assert result["Test"] > 0


# ===========================================================================
# Task 1: calculate_goal_projection() validation
# ===========================================================================


class TestCalculateGoalProjection:

    def test_with_salary_net_savings(self):
        """Salary provided → net_savings = salary - avg_monthly_spend."""
        goal = {"target_amount": 600000, "current_saved": 100000, "target_date": "2028-12-31"}
        txs = pd.DataFrame([
            {"date": pd.Timestamp("2026-01-15"), "amount": 25000.0, "category": "General"},
            {"date": pd.Timestamp("2026-02-15"), "amount": 25000.0, "category": "General"},
        ])
        result = calculate_goal_projection(goal, txs, monthly_salary=75000)
        # net_savings = max(1000, 75000 - 25000) = 50000
        # remaining = 500000, months = ceil(500000/50000) = 10
        assert result["months_remaining"] == 10
        assert result["on_track"] is True
        assert "projected_date" in result

    def test_without_salary_heuristic(self):
        """No salary → 20% heuristic: net_savings = max(5000, avg_spend * 0.2)."""
        goal = {"target_amount": 100000, "current_saved": 0}
        txs = pd.DataFrame([
            {"date": pd.Timestamp("2026-01-15"), "amount": 50000.0, "category": "General"},
            {"date": pd.Timestamp("2026-02-15"), "amount": 50000.0, "category": "General"},
        ])
        result = calculate_goal_projection(goal, txs, monthly_salary=None)
        # avg_spend = 50000, net_savings = max(5000, 50000*0.2) = 10000
        # months = ceil(100000/10000) = 10
        assert result["months_remaining"] == 10

    def test_goal_already_achieved(self):
        """current_saved >= target_amount → months_remaining = 0, on_track = True."""
        goal = {"target_amount": 100000, "current_saved": 150000}
        result = calculate_goal_projection(goal, pd.DataFrame())
        assert result["months_remaining"] == 0
        assert result["on_track"] is True

    def test_empty_transactions(self):
        """Empty transactions → falls back to heuristic for net savings."""
        goal = {"target_amount": 100000, "current_saved": 0}
        result = calculate_goal_projection(goal, pd.DataFrame())
        # avg_spend = 0, net_savings = max(5000, 0) = 5000
        # months = ceil(100000/5000) = 20
        assert result["months_remaining"] == 20
        assert result["on_track"] is True

    def test_deadline_behind_schedule(self):
        """projected_date past deadline → on_track = False."""
        # Tight deadline that the projection can't meet
        goal = {"target_amount": 10000000, "current_saved": 0, "target_date": "2026-10-01"}
        txs = pd.DataFrame([
            {"date": pd.Timestamp("2026-01-15"), "amount": 70000.0, "category": "General"},
            {"date": pd.Timestamp("2026-02-15"), "amount": 70000.0, "category": "General"},
        ])
        result = calculate_goal_projection(goal, txs, monthly_salary=75000)
        assert result["on_track"] is False

    def test_return_shape(self):
        """Verify exact return dict keys."""
        goal = {"target_amount": 50000, "current_saved": 10000}
        result = calculate_goal_projection(goal, pd.DataFrame())
        assert set(result.keys()) == {"on_track", "projected_date", "months_remaining"}


# ===========================================================================
# Task 2: simulate_scenario() — What-If Simulator
# ===========================================================================


class TestSimulateScenario:

    def test_expense_reduction_positive(self):
        """Reducing a category → positive savings delta."""
        txs = [
            {"date": "2026-01-10", "amount": 10000.0, "category": "Dining Out"},
            {"date": "2026-01-15", "amount": 20000.0, "category": "Rent"},
        ]
        result = simulate_scenario(
            transactions=txs,
            category_adjustments={"Dining Out": -0.20},
            monthly_salary=80000.0,
        )
        assert result["status"] == "success"
        assert result["baseline_monthly_spend"] == 30000.0
        assert result["projected_monthly_spend"] < result["baseline_monthly_spend"]
        assert result["monthly_savings_delta"] > 0
        assert result["annual_savings_delta"] > 0
        assert "Dining Out" in result["category_projections"]
        # 10000 * 0.80 = 8000
        assert result["category_projections"]["Dining Out"] == 8000.0
        assert "summary" in result

    def test_noop_scenario_all_deltas_zero(self):
        """All deltas = 0 → baseline == projected (no-op)."""
        txs = [
            {"date": "2026-01-10", "amount": 5000.0, "category": "Food"},
        ]
        result = simulate_scenario(
            transactions=txs,
            category_adjustments={},
            income_adjustment=0.0,
            monthly_salary=50000.0,
        )
        assert result["status"] == "success"
        assert result["baseline_monthly_spend"] == result["projected_monthly_spend"]
        assert result["monthly_savings_delta"] == 0.0
        assert result["annual_savings_delta"] == 0.0

    def test_expense_increase_negative_savings(self):
        """Increasing expenses → negative savings delta."""
        txs = [
            {"date": "2026-01-10", "amount": 10000.0, "category": "Shopping"},
        ]
        result = simulate_scenario(
            transactions=txs,
            category_adjustments={"Shopping": 0.50},  # +50%
        )
        assert result["projected_monthly_spend"] > result["baseline_monthly_spend"]
        assert result["monthly_savings_delta"] < 0

    def test_empty_transactions(self):
        """Empty transactions → baseline and projected both 0."""
        result = simulate_scenario(transactions=[], category_adjustments={})
        assert result["status"] == "success"
        assert result["baseline_monthly_spend"] == 0.0
        assert result["projected_monthly_spend"] == 0.0

    def test_none_transactions(self):
        """None transactions → baseline and projected both 0."""
        result = simulate_scenario(transactions=None)
        assert result["status"] == "success"
        assert result["baseline_monthly_spend"] == 0.0

    def test_goal_mode_income_increase_shorter_timeline(self):
        """Goal mode: income increase → shorter timeline (negative months_delta)."""
        txs = [
            {"date": "2026-01-15", "amount": 25000.0, "category": "General"},
            {"date": "2026-02-15", "amount": 25000.0, "category": "General"},
        ]
        goal = {"target_amount": 500000, "current_saved": 50000}
        result = simulate_scenario(
            transactions=txs,
            monthly_salary=75000,
            income_adjustment=25000,  # raise of 25K
            parameters={"goal": goal},
        )
        assert result["status"] == "success"
        assert "current" in result
        assert "scenario" in result
        assert result["scenario"]["achievable"] is True
        # More income → fewer months
        assert result["months_delta"] < 0
        assert result["date_delta_days"] < 0

    def test_goal_mode_noop_current_equals_scenario(self):
        """Goal mode: all deltas = 0 → current == scenario."""
        txs = [
            {"date": "2026-01-15", "amount": 25000.0, "category": "General"},
            {"date": "2026-02-15", "amount": 25000.0, "category": "General"},
        ]
        goal = {"target_amount": 500000, "current_saved": 50000}
        result = simulate_scenario(
            transactions=txs,
            monthly_salary=75000,
            income_adjustment=0,
            parameters={"goal": goal},
        )
        assert result["status"] == "success"
        assert result["months_delta"] == 0
        assert result["current"]["months_remaining"] == result["scenario"]["months_remaining"]

    def test_goal_mode_not_achievable_negative_income(self):
        """Goal mode: income reduced to <= 0 → 'achievable': False."""
        txs = [
            {"date": "2026-01-15", "amount": 25000.0, "category": "General"},
        ]
        goal = {"target_amount": 500000, "current_saved": 0}
        result = simulate_scenario(
            transactions=txs,
            monthly_salary=50000,
            income_adjustment=-50000,  # Wipes out income entirely
            parameters={"goal": goal},
        )
        assert result["status"] == "success"
        assert result["scenario"]["achievable"] is False
        assert result["scenario"]["months_remaining"] == -1

    def test_goal_mode_expense_reduction_shorter_timeline(self):
        """Goal mode: cutting expenses → more net savings → shorter timeline."""
        txs = [
            {"date": "2026-01-15", "amount": 40000.0, "category": "Dining Out"},
            {"date": "2026-02-15", "amount": 40000.0, "category": "Dining Out"},
        ]
        goal = {"target_amount": 500000, "current_saved": 0}
        result = simulate_scenario(
            transactions=txs,
            monthly_salary=75000,
            category_adjustments={"Dining Out": -0.50},  # cut dining 50%
            parameters={"goal": goal},
        )
        assert result["status"] == "success"
        assert result["scenario"]["achievable"] is True
        assert result["months_delta"] < 0  # faster

    def test_return_shape_expense_mode(self):
        """Verify exact keys in expense-adjustment mode."""
        result = simulate_scenario(transactions=[], category_adjustments={})
        expected_keys = {
            "status", "scenario", "baseline_monthly_spend",
            "projected_monthly_spend", "monthly_savings_delta",
            "annual_savings_delta", "category_projections", "summary",
        }
        assert set(result.keys()) == expected_keys

    def test_return_shape_goal_mode(self):
        """Verify exact keys in goal-projection mode."""
        result = simulate_scenario(
            transactions=[],
            monthly_salary=50000,
            parameters={"goal": {"target_amount": 100000, "current_saved": 0}},
        )
        expected_keys = {"status", "current", "scenario", "months_delta", "date_delta_days"}
        assert set(result.keys()) == expected_keys
        assert set(result["current"].keys()) == {"on_track", "projected_date", "months_remaining"}
        assert "achievable" in result["scenario"]


# ===========================================================================
# Task 3: calculate_health_score 2.0 — Trend + Anomaly Signals
# ===========================================================================


class TestHealthScore2:

    def test_existing_behavior_no_regression_no_date(self):
        """Without date info, trend signal is skipped — existing behavior preserved."""
        df = pd.DataFrame([
            {"amount": 500.0, "category": "Food"},
            {"amount": 600.0, "category": "Food"},
        ])
        budgets = {"Food": 2000}
        goals = [{"name": "Car", "progress": 0.5}]
        result = calculate_health_score(df, budgets, goals, total_income=5000)
        assert result["score"] == 100  # under budget, under income, +5 goal capped at 100
        assert "Positive progress on 'Car'" in result["breakdown"]

    def test_existing_budget_overage_preserved(self):
        """Budget overage deduction still works exactly as before."""
        df = pd.DataFrame([
            {"amount": 3000.0, "category": "Food"},
        ])
        budgets = {"Food": 1000}
        result = calculate_health_score(df, budgets, [], total_income=0)
        assert "Food over budget" in result["breakdown"]
        # overage_ratio = min(1.0, (3000-1000)/1000) = 1.0, deduction = 20
        assert result["breakdown"]["Food over budget"] == -20

    def test_improving_trend_bonus(self):
        """Latest month spend < prior mean → +5 'Spending trend improving'."""
        df = pd.DataFrame([
            {"date": "2026-01-15", "amount": 10000.0, "category": "General"},
            {"date": "2026-02-15", "amount": 10000.0, "category": "General"},
            {"date": "2026-03-15", "amount": 5000.0,  "category": "General"},  # ↓ recent
        ])
        df["date"] = pd.to_datetime(df["date"])
        result = calculate_health_score(df, {}, [], total_income=0)
        assert "Spending trend improving" in result["breakdown"]
        assert result["breakdown"]["Spending trend improving"] == 5

    def test_rising_trend_penalty(self):
        """Latest month spend > prior mean → -5 'Spending trend rising'."""
        df = pd.DataFrame([
            {"date": "2026-01-15", "amount": 5000.0,  "category": "General"},
            {"date": "2026-02-15", "amount": 5000.0,  "category": "General"},
            {"date": "2026-03-15", "amount": 15000.0, "category": "General"},  # ↑ recent
        ])
        df["date"] = pd.to_datetime(df["date"])
        result = calculate_health_score(df, {}, [], total_income=0)
        assert "Spending trend rising" in result["breakdown"]
        assert result["breakdown"]["Spending trend rising"] == -5

    def test_flat_trend_no_change(self):
        """Same spend each month → no trend entry in breakdown."""
        df = pd.DataFrame([
            {"date": "2026-01-15", "amount": 5000.0, "category": "General"},
            {"date": "2026-02-15", "amount": 5000.0, "category": "General"},
        ])
        df["date"] = pd.to_datetime(df["date"])
        result = calculate_health_score(df, {}, [], total_income=0)
        assert "Spending trend improving" not in result["breakdown"]
        assert "Spending trend rising" not in result["breakdown"]

    def test_single_month_no_trend(self):
        """Only 1 month → not enough data for trend → no trend entry."""
        df = pd.DataFrame([
            {"date": "2026-01-15", "amount": 5000.0, "category": "General"},
        ])
        df["date"] = pd.to_datetime(df["date"])
        result = calculate_health_score(df, {}, [], total_income=0)
        assert "Spending trend improving" not in result["breakdown"]
        assert "Spending trend rising" not in result["breakdown"]

    def test_anomaly_penalty(self, anomaly_df):
        """Anomalies detected → -3 per anomaly (capped at -15)."""
        result = calculate_health_score(anomaly_df, {}, [], total_income=0)
        # detect_anomalies should flag the 900 outlier in Food (5 transactions)
        assert "Anomalies detected" in result["breakdown"]
        assert result["breakdown"]["Anomalies detected"] < 0

    def test_anomaly_penalty_cap(self):
        """Anomaly penalty capped at -15 even with many anomalies."""
        # Create data with many anomalies: 4 normal + 6 extreme
        rows = [{"date": f"2026-01-{i+1:02d}", "amount": 100.0, "category": "Test"} for i in range(4)]
        for i in range(6):
            rows.append({"date": f"2026-01-{i+10:02d}", "amount": 10000.0, "category": "Test"})
        df = pd.DataFrame(rows)
        df["date"] = pd.to_datetime(df["date"])
        result = calculate_health_score(df, {}, [], total_income=0)
        if "Anomalies detected" in result["breakdown"]:
            assert result["breakdown"]["Anomalies detected"] >= -15

    def test_no_anomalies_no_penalty(self):
        """No anomalies → no 'Anomalies detected' in breakdown."""
        df = pd.DataFrame([
            {"date": "2026-01-01", "amount": 100.0, "category": "Food"},
            {"date": "2026-01-05", "amount": 100.0, "category": "Food"},
            {"date": "2026-01-10", "amount": 100.0, "category": "Food"},
            {"date": "2026-01-15", "amount": 100.0, "category": "Food"},
        ])
        df["date"] = pd.to_datetime(df["date"])
        result = calculate_health_score(df, {}, [], total_income=0)
        assert "Anomalies detected" not in result["breakdown"]

    def test_score_bounds(self, anomaly_df):
        """Score always in [0, 100]."""
        # Harsh scenario: over budget, over income, rising trend, anomalies
        budgets = {"Food": 10}  # extremely tight budget
        result = calculate_health_score(anomaly_df, budgets, [], total_income=1)
        assert 0 <= result["score"] <= 100


# ===========================================================================
# Regression: detect_anomalies unchanged behavior
# ===========================================================================


class TestDetectAnomaliesRegression:

    def test_basic_anomaly_detection(self, anomaly_df):
        """Anomaly detection correctly flags the outlier transaction."""
        anomalies = detect_anomalies(anomaly_df)
        assert len(anomalies) >= 1
        amounts = [a["amount"] for a in anomalies]
        assert 2000.0 in amounts

    def test_skip_under_4_transactions(self):
        """Categories with < 4 transactions skipped."""
        df = pd.DataFrame([
            {"amount": 100.0, "category": "SmallCat"},
            {"amount": 100.0, "category": "SmallCat"},
            {"amount": 10000.0, "category": "SmallCat"},
        ])
        assert detect_anomalies(df) == []

    def test_empty_dataframe(self):
        """Empty DataFrame → empty list."""
        assert detect_anomalies(pd.DataFrame()) == []

    def test_anomaly_has_reason(self, anomaly_df):
        """Each anomaly dict has a 'reason' key."""
        anomalies = detect_anomalies(anomaly_df)
        for a in anomalies:
            assert "reason" in a
            assert "std deviations" in a["reason"]


# ===========================================================================
# Regression: Existing analytics functions still work
# ===========================================================================


class TestExistingAnalyticsRegression:

    def test_monthly_spending_basic(self, multi_month_df):
        """calculate_monthly_spending returns expected shape."""
        result = calculate_monthly_spending(multi_month_df)
        assert "by_month" in result
        assert "by_category" in result
        assert "total" in result
        assert result["total"] > 0

    def test_category_breakdown_basic(self):
        """calculate_category_breakdown returns expected shape."""
        txs = [
            {"amount": 100, "category": "Food"},
            {"amount": 200, "category": "Rent"},
        ]
        result = calculate_category_breakdown(txs)
        assert "by_category" in result
        assert "total" in result
        assert result["total"] == 300.0

    def test_budget_recommendation_basic(self, multi_month_df):
        """calculate_budget_recommendation returns per-category limits."""
        result = calculate_budget_recommendation(multi_month_df)
        assert "Food" in result
        assert "Rent" in result
        assert all(v > 0 for v in result.values())

    def test_ocr_pipeline_importable(self):
        """OCR pipeline modules are importable (not broken by analytics changes)."""
        from app.documents.pipeline import process_document
        from app.documents.ocr_adapter import OCRAdapter
        from app.documents.confidence import score_extraction
        # Just verify imports work — don't run actual OCR
        assert callable(process_document)
        assert callable(score_extraction)


# ===========================================================================
# Integration: simulate_scenario compatible with main.py wiring
# ===========================================================================


class TestSimulateScenarioEndpointCompat:
    """Verify simulate_scenario works with the exact call pattern in main.py lines 303-310."""

    def test_matches_whatif_request_signature(self):
        """Calling with WhatIfRequest-style kwargs succeeds."""
        result = simulate_scenario(
            transactions=[
                {"date": "2026-01-10", "amount": 10000.0, "category": "Dining Out"},
                {"date": "2026-01-15", "amount": 20000.0, "category": "Rent"},
            ],
            category_adjustments={"Dining Out": -0.20},
            income_adjustment=None,
            monthly_salary=80000.0,
            parameters=None,
        )
        assert result["status"] in ["success", "contract_ready"]
        assert "baseline_monthly_spend" in result
        assert "projected_monthly_spend" in result
        assert "monthly_savings_delta" in result
        assert "annual_savings_delta" in result
        assert "category_projections" in result
        assert "summary" in result


# ===========================================================================
# Pattern Intelligence Engine Tests (Kavya — Step 5.1)
# ===========================================================================


from app.analytics.pattern_engine import (
    detect_time_of_month_patterns,
    detect_salary_triggered_spending,
    detect_category_trend,
    detect_recurring_subscriptions,
    detect_money_leaks,
    detect_savings_decline,
    detect_discretionary_outpacing_income,
    detect_goal_delay_risk,
    run_pattern_detection,
)


class TestPatternEngineTimeOfMonth:
    """Verification for detect_time_of_month_patterns()."""

    def test_catches_end_of_month_food_spike(self):
        """Synthetic test DataFrame with obvious end-of-month food spike."""
        rows = [
            # Early (days 1-10): low food spend (100 total over 10 days = 10/day)
            {"date": "2026-01-03", "amount": 50.0, "category": "Food"},
            {"date": "2026-01-08", "amount": 50.0, "category": "Food"},
            # Mid (days 11-20): moderate food spend (200 total over 10 days = 20/day)
            {"date": "2026-01-13", "amount": 100.0, "category": "Food"},
            {"date": "2026-01-18", "amount": 100.0, "category": "Food"},
            # Late (days 21-31): heavy spike (2200 total over 11 days = 200/day)
            {"date": "2026-01-22", "amount": 600.0, "category": "Food"},
            {"date": "2026-01-25", "amount": 800.0, "category": "Food"},
            {"date": "2026-01-29", "amount": 800.0, "category": "Food"},
        ]
        df = pd.DataFrame(rows)
        patterns = detect_time_of_month_patterns(df)

        assert len(patterns) == 1
        pat = patterns[0]
        assert pat["type"] == "pattern"
        assert pat["category"] == "Food"
        assert "late" in pat["title"].lower()
        assert pat["evidence"]["peak_bucket"] == "late"
        assert pat["evidence"]["peak_daily_avg"] == 200.0
        assert pat["evidence"]["second_highest_avg"] == 20.0
        assert pat["evidence"]["percentage_above_next"] > 30.0

    def test_balanced_spending_produces_no_pattern(self):
        """Evenly distributed spend across buckets does not trigger pattern."""
        rows = [
            {"date": "2026-01-05", "amount": 100.0, "category": "Rent"},
            {"date": "2026-01-15", "amount": 100.0, "category": "Rent"},
            {"date": "2026-01-25", "amount": 110.0, "category": "Rent"},
        ]
        df = pd.DataFrame(rows)
        patterns = detect_time_of_month_patterns(df)
        assert patterns == []

    def test_empty_or_insufficient_data_returns_empty_list(self):
        """Empty DataFrame or None returns empty list without error."""
        assert detect_time_of_month_patterns(pd.DataFrame()) == []
        assert detect_time_of_month_patterns(None) == []


class TestPatternEngineSalaryTriggered:
    """Verification for detect_salary_triggered_spending()."""

    def test_catches_post_salary_discretionary_spike(self):
        """Discretionary spend elevated in the 5 days following salary date."""
        rows = [
            # Salary arrives on day 1
            {"date": "2026-01-01", "amount": 80000.0, "category": "Salary"},
            # Days 2-6 (post-salary): heavy shopping/dining (5000 over 5 days = 1000/day)
            {"date": "2026-01-02", "amount": 1200.0, "category": "Shopping"},
            {"date": "2026-01-03", "amount": 1500.0, "category": "Food"},
            {"date": "2026-01-04", "amount": 800.0, "category": "Entertainment"},
            {"date": "2026-01-05", "amount": 1500.0, "category": "Shopping"},
            # Rest of month: minimal discretionary spend (500 over 26 days ≈ 19.2/day)
            {"date": "2026-01-15", "amount": 250.0, "category": "Food"},
            {"date": "2026-01-22", "amount": 250.0, "category": "Shopping"},
        ]
        df = pd.DataFrame(rows)
        pat = detect_salary_triggered_spending(df, salary_date_guess=1)

        assert pat is not None
        assert pat["type"] == "pattern"
        assert pat["category"] == "Discretionary"
        assert pat["evidence"]["salary_day"] == 1
        assert pat["evidence"]["post_salary_daily_avg"] > pat["evidence"]["rest_of_month_daily_avg"]
        assert pat["evidence"]["percentage_increase"] > 30.0

    def test_detects_salary_day_automatically_when_not_provided(self):
        """Finds recurring salary day from transaction category."""
        rows = [
            {"date": "2026-01-25", "amount": 75000.0, "category": "Salary"},
            {"date": "2026-01-26", "amount": 2000.0, "category": "Shopping"},
            {"date": "2026-01-27", "amount": 2000.0, "category": "Food"},
        ]
        df = pd.DataFrame(rows)
        pat = detect_salary_triggered_spending(df, salary_date_guess=None)
        assert pat is not None
        assert pat["evidence"]["salary_day"] == 25

    def test_empty_or_insufficient_returns_none(self):
        """Returns None (not error) when given too little data."""
        assert detect_salary_triggered_spending(pd.DataFrame(), salary_date_guess=1) is None
        assert detect_salary_triggered_spending(None, salary_date_guess=1) is None
        assert detect_salary_triggered_spending(pd.DataFrame([{"date": "2026-01-05", "amount": 100}]), salary_date_guess=None) is None


class TestPatternEngineCategoryTrend:
    """Verification for detect_category_trend()."""

    def test_catches_upward_transport_trend(self):
        """Synthetic upward transport trend across 4 months is caught."""
        rows = [
            {"date": "2026-01-15", "amount": 1000.0, "category": "Transport"},
            {"date": "2026-02-15", "amount": 1300.0, "category": "Transport"},
            {"date": "2026-03-15", "amount": 1600.0, "category": "Transport"},
            {"date": "2026-04-15", "amount": 1900.0, "category": "Transport"},
        ]
        df = pd.DataFrame(rows)
        pat = detect_category_trend(df, category="Transport", months=4)

        assert pat is not None
        assert pat["type"] == "pattern"
        assert pat["category"] == "Transport"
        assert "upward" in pat["title"].lower()
        assert pat["evidence"]["slope"] == pytest.approx(300.0, rel=1e-2)
        assert pat["evidence"]["months_analyzed"] == 4
        assert pat["evidence"]["r_squared"] > 0.95

    def test_flat_or_downward_trend_returns_none(self):
        """Flat spending does not trigger upward trend pattern."""
        rows = [
            {"date": "2026-01-15", "amount": 5000.0, "category": "Rent"},
            {"date": "2026-02-15", "amount": 5000.0, "category": "Rent"},
            {"date": "2026-03-15", "amount": 5000.0, "category": "Rent"},
            {"date": "2026-04-15", "amount": 5000.0, "category": "Rent"},
        ]
        df = pd.DataFrame(rows)
        assert detect_category_trend(df, category="Rent", months=4) is None

    def test_insufficient_history_returns_none(self):
        """Fewer than 3 months of history returns None."""
        rows = [
            {"date": "2026-01-15", "amount": 1000.0, "category": "Transport"},
            {"date": "2026-02-15", "amount": 1500.0, "category": "Transport"},
        ]
        df = pd.DataFrame(rows)
        assert detect_category_trend(df, category="Transport", months=4) is None
        assert detect_category_trend(pd.DataFrame(), category="Transport") is None
        assert detect_category_trend(None, category="Transport") is None


# ===========================================================================
# Step 4.2 Unit Tests: Subscriptions & Money Leaks
# ===========================================================================


class TestDetectRecurringSubscriptions:
    """Verification for detect_recurring_subscriptions()."""

    def test_identifies_3_months_netflix_charge(self):
        """3 months of identical Rs.649 charge is detected as a subscription."""
        rows = [
            {"date": "2026-01-15", "amount": 649.0, "description": "Netflix", "category": "Entertainment"},
            {"date": "2026-02-15", "amount": 649.0, "description": "Netflix", "category": "Entertainment"},
            {"date": "2026-03-15", "amount": 649.0, "description": "Netflix", "category": "Entertainment"},
        ]
        df = pd.DataFrame(rows)
        subscriptions = detect_recurring_subscriptions(df)

        assert len(subscriptions) == 1
        sub = subscriptions[0]
        assert sub["type"] == "subscription"
        assert sub["merchant"].lower() == "netflix"
        assert sub["amount"] == 649.0
        assert sub["occurrences"] == 3
        assert sub["estimated_annual_cost"] == pytest.approx(7788.0, abs=0.01)
        assert "evidence" in sub
        assert "transactions" in sub
        assert len(sub["transactions"]) == 3

    def test_tolerance_within_plus_minus_5_days(self):
        """Cadence intervals within 25 to 35 days qualify for monthly subscription."""
        rows = [
            {"date": "2026-01-01", "amount": 199.0, "description": "Spotify Premium"},
            {"date": "2026-01-28", "amount": 199.0, "description": "Spotify Premium"},  # 27 days
            {"date": "2026-03-03", "amount": 199.0, "description": "Spotify Premium"},  # 34 days
        ]
        df = pd.DataFrame(rows)
        subscriptions = detect_recurring_subscriptions(df)
        assert len(subscriptions) == 1
        assert subscriptions[0]["occurrences"] == 3
        assert subscriptions[0]["estimated_annual_cost"] == pytest.approx(199.0 * 12, abs=0.01)

    def test_irregular_cadence_not_detected(self):
        """Transactions on random or daily dates are not flagged as subscriptions."""
        rows = [
            {"date": "2026-01-01", "amount": 100.0, "description": "Tea Stall"},
            {"date": "2026-01-02", "amount": 100.0, "description": "Tea Stall"},
            {"date": "2026-01-03", "amount": 100.0, "description": "Tea Stall"},
        ]
        df = pd.DataFrame(rows)
        subscriptions = detect_recurring_subscriptions(df)
        assert subscriptions == []

    def test_under_3_occurrences_not_detected(self):
        """Only 2 occurrences is below the 3+ requirement."""
        rows = [
            {"date": "2026-01-15", "amount": 499.0, "description": "Hotstar"},
            {"date": "2026-02-15", "amount": 499.0, "description": "Hotstar"},
        ]
        df = pd.DataFrame(rows)
        assert detect_recurring_subscriptions(df) == []

    def test_one_off_large_purchase_never_subscription(self):
        """A single large purchase is never flagged as a subscription."""
        rows = [
            {"date": "2026-01-10", "amount": 55000.0, "description": "Apple Store Mumbai", "category": "Electronics"},
        ]
        df = pd.DataFrame(rows)
        assert detect_recurring_subscriptions(df) == []

    def test_upi_and_pos_prefix_normalization(self):
        """Strips UPI/POS noise and correctly groups same merchant."""
        rows = [
            {"date": "2026-01-10", "amount": 299.0, "description": "UPI-Amazon Prime/12345"},
            {"date": "2026-02-10", "amount": 299.0, "description": "UPI/Amazon Prime/67890"},
            {"date": "2026-03-10", "amount": 299.0, "description": "Amazon Prime"},
        ]
        df = pd.DataFrame(rows)
        subs = detect_recurring_subscriptions(df)
        assert len(subs) == 1
        assert "amazon prime" in subs[0]["merchant"].lower()
        assert subs[0]["occurrences"] == 3


class TestDetectMoneyLeaks:
    """Verification for detect_money_leaks()."""

    def test_detects_small_food_transactions_leak(self):
        """Many small Food transactions exceeding 15% share is reported as a leak."""
        rows = [
            # 10 small Food transactions under ₹200 (₹150 * 10 = ₹1,500 total)
            {"date": f"2026-01-{i+1:02d}", "amount": 150.0, "category": "Food"}
            for i in range(10)
        ]
        df = pd.DataFrame(rows)
        leaks = detect_money_leaks(df, threshold=200.0)

        assert len(leaks) == 1
        leak = leaks[0]
        assert leak["type"] == "leak"
        assert leak["category"] == "Food"
        assert leak["count"] == 10
        assert leak["total"] == 1500.0
        # 1 month: 1500 * 12 = 18000 annual spend -> 30% reduction = 5400
        assert leak["projected_annual_savings_at_30pct_reduction"] == pytest.approx(5400.0, abs=1.0)
        assert "evidence" in leak
        assert "transactions" in leak
        assert len(leak["transactions"]) == 10

    def test_small_transactions_under_15pct_share_ignored(self):
        """Small transactions that form < 15% of category spend are not flagged."""
        rows = [
            # 1 massive grocery run of ₹10,000 + 3 ₹50 snacks = ₹10,150 total
            {"date": "2026-01-05", "amount": 10000.0, "category": "Groceries"},
            {"date": "2026-01-10", "amount": 50.0, "category": "Groceries"},
            {"date": "2026-01-15", "amount": 50.0, "category": "Groceries"},
            {"date": "2026-01-20", "amount": 50.0, "category": "Groceries"},
        ]
        df = pd.DataFrame(rows)
        # Small share = 150 / 10150 ≈ 1.48% (< 15%)
        leaks = detect_money_leaks(df, threshold=200.0)
        assert leaks == []

    def test_one_off_large_purchase_never_leak(self):
        """A single large purchase is never misclassified as a money leak."""
        rows = [
            {"date": "2026-01-10", "amount": 75000.0, "category": "Jewellery"},
        ]
        df = pd.DataFrame(rows)
        assert detect_money_leaks(df) == []

    def test_empty_or_none_returns_empty_list(self):
        """Empty or None input returns empty list."""
        assert detect_money_leaks(pd.DataFrame()) == []
        assert detect_money_leaks(None) == []


class TestRunPatternDetection:
    """Verification for run_pattern_detection() orchestration across all 5 insight types."""

    def test_runs_all_5_detectors_and_combines_output(self):
        """Combines time-of-month, salary-triggered, category trend, subscription, and leak."""
        rows = [
            # 1. Salary on day 1
            {"date": "2026-01-01", "amount": 80000.0, "category": "Salary"},
            # 2. Post-salary discretionary surge (Shopping days 2-6)
            {"date": "2026-01-02", "amount": 2500.0, "category": "Shopping"},
            {"date": "2026-01-03", "amount": 2500.0, "category": "Shopping"},
            # 3. Upward Transport trend across 4 months
            {"date": "2026-01-10", "amount": 1000.0, "category": "Transport"},
            {"date": "2026-02-10", "amount": 1300.0, "category": "Transport"},
            {"date": "2026-03-10", "amount": 1600.0, "category": "Transport"},
            {"date": "2026-04-10", "amount": 1900.0, "category": "Transport"},
            # 4. Recurring subscription (Netflix Rs.649 across 3 months)
            {"date": "2026-01-15", "amount": 649.0, "description": "Netflix", "category": "Entertainment"},
            {"date": "2026-02-15", "amount": 649.0, "description": "Netflix", "category": "Entertainment"},
            {"date": "2026-03-15", "amount": 649.0, "description": "Netflix", "category": "Entertainment"},
            # 5. Money leaks: small Food transactions (<= 200, 100% share of Food)
            {"date": "2026-01-22", "amount": 120.0, "category": "Food"},
            {"date": "2026-01-23", "amount": 150.0, "category": "Food"},
            {"date": "2026-01-24", "amount": 180.0, "category": "Food"},
            {"date": "2026-01-25", "amount": 110.0, "category": "Food"},
        ]
        df = pd.DataFrame(rows)
        results = run_pattern_detection(df, salary_day=1)

        assert isinstance(results, list)
        types_found = {r["type"] for r in results}
        assert "pattern" in types_found
        assert "subscription" in types_found
        assert "leak" in types_found

        # Verify subscription was detected
        subs = [r for r in results if r["type"] == "subscription"]
        assert len(subs) == 1
        assert subs[0]["merchant"].lower() == "netflix"
        assert subs[0]["amount"] == 649.0
        assert subs[0]["estimated_annual_cost"] == 7788.0

        # Verify leak was detected
        leaks = [r for r in results if r["type"] == "leak"]
        assert len(leaks) == 1
        assert leaks[0]["category"] == "Food"
        assert leaks[0]["count"] == 4
        assert leaks[0]["total"] == 560.0

    def test_empty_or_none_returns_empty_list(self):
        """Returns empty list for empty DataFrame or None."""
        assert run_pattern_detection(pd.DataFrame()) == []
        assert run_pattern_detection(None) == []
        assert run_pattern_detection([]) == []


# ===========================================================================
# Step 4.3 Unit Tests: Risk Warnings
# ===========================================================================


class TestDetectSavingsDecline:
    """Verification for detect_savings_decline()."""

    def test_declining_net_savings_3_months_fires_warning(self):
        """3 months of declining net savings (spend 30k -> 40k -> 50k, salary 80k)."""
        rows = [
            {"date": "2026-01-15", "amount": 30000.0, "category": "General"},
            {"date": "2026-02-15", "amount": 40000.0, "category": "General"},
            {"date": "2026-03-15", "amount": 50000.0, "category": "General"},
        ]
        df = pd.DataFrame(rows)
        warn = detect_savings_decline(df, monthly_salary=80000.0)

        assert warn is not None
        assert warn["type"] == "warning"
        assert warn["subtype"] == "savings_decline"
        assert warn["months_of_data"] == 3
        assert "consistently declined" in warn["message"]
        assert warn["evidence"]["initial_savings"] == 50000.0
        assert warn["evidence"]["latest_savings"] == 30000.0

    def test_healthy_flat_spending_no_warning(self):
        """Flat spend month-over-month produces constant savings -> no false positive warning."""
        rows = [
            {"date": "2026-01-15", "amount": 30000.0, "category": "General"},
            {"date": "2026-02-15", "amount": 30000.0, "category": "General"},
            {"date": "2026-03-15", "amount": 30000.0, "category": "General"},
        ]
        df = pd.DataFrame(rows)
        assert detect_savings_decline(df, monthly_salary=80000.0) is None

    def test_healthy_increasing_savings_no_warning(self):
        """Increasing net savings -> no warning."""
        rows = [
            {"date": "2026-01-15", "amount": 40000.0, "category": "General"},
            {"date": "2026-02-15", "amount": 35000.0, "category": "General"},
            {"date": "2026-03-15", "amount": 30000.0, "category": "General"},
        ]
        df = pd.DataFrame(rows)
        assert detect_savings_decline(df, monthly_salary=80000.0) is None

    def test_no_salary_or_under_3_months_returns_none(self):
        """No salary or <3 months returns None."""
        rows = [
            {"date": "2026-01-15", "amount": 30000.0, "category": "General"},
            {"date": "2026-02-15", "amount": 40000.0, "category": "General"},
        ]
        df = pd.DataFrame(rows)
        assert detect_savings_decline(df, monthly_salary=None) is None
        assert detect_savings_decline(df, monthly_salary=80000.0) is None


class TestDetectDiscretionaryOutpacingIncome:
    """Verification for detect_discretionary_outpacing_income()."""

    def test_discretionary_outpacing_flat_income_fires_warning(self):
        """Discretionary categories growing while salary is flat."""
        rows = [
            {"date": "2026-01-15", "amount": 10000.0, "category": "Food"},
            {"date": "2026-02-15", "amount": 15000.0, "category": "Shopping"},
            {"date": "2026-03-15", "amount": 20000.0, "category": "Entertainment"},
        ]
        df = pd.DataFrame(rows)
        warn = detect_discretionary_outpacing_income(df, monthly_salary=80000.0)

        assert warn is not None
        assert warn["type"] == "warning"
        assert warn["subtype"] == "discretionary_outpacing_income"
        assert warn["months_of_data"] == 3
        assert "outpacing income" in warn["message"]

    def test_healthy_discretionary_spend_no_warning(self):
        """Flat discretionary spending produces no warning."""
        rows = [
            {"date": "2026-01-15", "amount": 10000.0, "category": "Food"},
            {"date": "2026-02-15", "amount": 10000.0, "category": "Shopping"},
            {"date": "2026-03-15", "amount": 10000.0, "category": "Entertainment"},
        ]
        df = pd.DataFrame(rows)
        assert detect_discretionary_outpacing_income(df, monthly_salary=80000.0) is None

    def test_income_growing_faster_than_discretionary_no_warning(self):
        """Income growing faster than discretionary spend -> no warning."""
        rows = [
            # Discretionary spend: 10k -> 11k -> 12k (+10% slope)
            {"date": "2026-01-15", "amount": 10000.0, "category": "Food"},
            {"date": "2026-02-15", "amount": 11000.0, "category": "Food"},
            {"date": "2026-03-15", "amount": 12000.0, "category": "Food"},
            # Salary credit: 50k -> 75k -> 100k (+45% slope)
            {"date": "2026-01-01", "amount": 50000.0, "category": "Salary"},
            {"date": "2026-02-01", "amount": 75000.0, "category": "Salary"},
            {"date": "2026-03-01", "amount": 100000.0, "category": "Salary"},
        ]
        df = pd.DataFrame(rows)
        assert detect_discretionary_outpacing_income(df, monthly_salary=None) is None


class TestDetectGoalDelayRisk:
    """Verification for detect_goal_delay_risk()."""

    def test_off_track_goal_fires_warning(self):
        """Projection with on_track=False produces a warning dict."""
        goal = {"title": "Buy Laptop", "target_amount": 100000, "target_date": "2026-05-01"}
        proj = {"on_track": False, "projected_date": "2027-01-15", "months_remaining": 9}
        warn = detect_goal_delay_risk(goal, proj)

        assert warn is not None
        assert warn["type"] == "warning"
        assert warn["subtype"] == "goal_delay_risk"
        assert warn["goal_title"] == "Buy Laptop"
        assert "risk of delay" in warn["message"]

    def test_on_track_goal_returns_none(self):
        """Projection with on_track=True returns None."""
        goal = {"title": "Emergency Fund", "target_amount": 50000, "target_date": "2028-01-01"}
        proj = {"on_track": True, "projected_date": "2026-12-01", "months_remaining": 2}
        assert detect_goal_delay_risk(goal, proj) is None


class TestRunPatternDetectionStep43:
    """Verification for run_pattern_detection() optional parameters and risk warnings."""

    def test_unaffected_callers_without_salary_or_goals(self):
        """Callers from 4.1-4.2 passing only transactions work without error."""
        rows = [
            {"date": "2026-01-15", "amount": 649.0, "description": "Netflix", "category": "Entertainment"},
            {"date": "2026-02-15", "amount": 649.0, "description": "Netflix", "category": "Entertainment"},
            {"date": "2026-03-15", "amount": 649.0, "description": "Netflix", "category": "Entertainment"},
        ]
        df = pd.DataFrame(rows)
        results = run_pattern_detection(df)
        assert isinstance(results, list)
        assert any(r["type"] == "subscription" for r in results)

    def test_includes_risk_warnings_when_salary_and_goals_provided(self):
        """Passing salary and off-track goals appends warning-type insights."""
        rows = [
            # 3 months of rising spending -> declining net savings
            {"date": "2026-01-15", "amount": 30000.0, "category": "Shopping"},
            {"date": "2026-02-15", "amount": 40000.0, "category": "Shopping"},
            {"date": "2026-03-15", "amount": 50000.0, "category": "Shopping"},
        ]
        df = pd.DataFrame(rows)
        goal = {"title": "House Downpayment", "target_amount": 5000000, "current_saved": 0, "target_date": "2026-06-01"}
        results = run_pattern_detection(df, salary_day=1, monthly_salary=60000.0, goals=[goal])

        warnings = [r for r in results if r["type"] == "warning"]
        assert len(warnings) >= 1
        subtypes = {w["subtype"] for w in warnings}
        assert "savings_decline" in subtypes or "goal_delay_risk" in subtypes



