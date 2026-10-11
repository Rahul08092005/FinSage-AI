import logging
from pathlib import Path
from unittest.mock import patch
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.analytics.spending import calculate_health_score
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_multi_month_within_budget_no_overage():
    """1. Multi-month, within budget each month -> no overage.
    3 months x Food 1,500 vs limit 2,000. Expect no 'Food over budget' key.
    """
    df = pd.DataFrame([
        {"date": "2026-01-15", "amount": 1500.0, "category": "Food"},
        {"date": "2026-02-15", "amount": 1500.0, "category": "Food"},
        {"date": "2026-03-15", "amount": 1500.0, "category": "Food"},
    ])
    budgets = {"Food": 2000}
    result = calculate_health_score(df, budgets, [], total_income=0)
    assert "Food over budget" not in result["breakdown"]


def test_latest_month_over_budget_uses_only_latest_month():
    """2. Latest month over budget -> overage uses only that month.
    Earlier months normal, latest month Food 3,000 vs limit 2,000 -> 'Food over budget' == -10.0.
    """
    df = pd.DataFrame([
        {"date": "2026-01-15", "amount": 1500.0, "category": "Food"},
        {"date": "2026-02-15", "amount": 1500.0, "category": "Food"},
        {"date": "2026-03-15", "amount": 3000.0, "category": "Food"},
    ])
    budgets = {"Food": 2000}
    result = calculate_health_score(df, budgets, [], total_income=0)
    assert "Food over budget" in result["breakdown"]
    assert result["breakdown"]["Food over budget"] == -10.0


def test_no_date_column_legacy_behaviour():
    """3. No date column -> legacy behaviour (all rows used)."""
    df = pd.DataFrame([
        {"amount": 3000.0, "category": "Food"},
    ])
    budgets = {"Food": 1000}
    result = calculate_health_score(df, budgets, [], total_income=0)
    assert "Food over budget" in result["breakdown"]
    assert result["breakdown"]["Food over budget"] == -20.0


def test_timezone_aware_strings():
    """4. Timezone-aware strings.
    transactionDate values like '2026-10-01T00:00:00.000Z' are accepted with no exception
    and bucket into the right month.
    """
    df = pd.DataFrame([
        {"transactionDate": "2026-09-30T23:59:59.000Z", "amount": 500.0, "category": "Food"},
        {"transactionDate": "2026-10-01T00:00:00.000Z", "amount": 1500.0, "category": "Food"},
    ])
    budgets = {"Food": 2000}
    result = calculate_health_score(df, budgets, [], total_income=0)
    # The latest month is October 2026 (1500 spend <= 2000 limit).
    # If September had been merged, 500 + 1500 = 2000.
    # Now verify with an overage in October only:
    df_over = pd.DataFrame([
        {"transactionDate": "2026-09-30T23:59:59.000Z", "amount": 500.0, "category": "Food"},
        {"transactionDate": "2026-10-01T00:00:00.000Z", "amount": 3000.0, "category": "Food"},
    ])
    result_over = calculate_health_score(df_over, budgets, [], total_income=0)
    assert "Food over budget" in result_over["breakdown"]
    assert result_over["breakdown"]["Food over budget"] == -10.0


def test_endpoint_prisma_json(client):
    """5. Endpoint-level test for POST /internal/analytics/health-score with Prisma-style JSON.
    transactions with transactionDate ISO strings and amount as strings or numbers,
    budgets as a list of {category, monthlyLimit: '6000'}, goals as a list without progress.
    """
    payload = {
        "transactions": [
            {"transactionDate": "2026-09-15T10:00:00.000Z", "amount": "4000", "category": "Food & Dining"},
            {"transactionDate": "2026-10-01T12:00:00.000Z", "amount": 7500, "category": "Food & Dining"},
        ],
        "budgets": [
            {"category": "Food & Dining", "monthlyLimit": "6000"}
        ],
        "goals": [
            {"id": "goal-1", "name": "Emergency Fund", "target": 50000}
        ],
        "total_income": 0.0,
    }

    response = client.post("/internal/analytics/health-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert "breakdown" in data

    # Compare directly with calculate_health_score result
    df_expected = pd.DataFrame(payload["transactions"])
    df_expected["date"] = pd.to_datetime(df_expected["transactionDate"])
    expected = calculate_health_score(df_expected, payload["budgets"], payload["goals"], payload["total_income"])
    assert data["score"] == expected["score"]
    assert data["breakdown"] == expected["breakdown"]


def test_endpoint_failure_is_logged(client, caplog):
    """6. Failure is logged.
    Force an exception inside the endpoint and assert fallback response is returned
    and an error was logged.
    """
    with patch("app.main.calculate_health_score", side_effect=RuntimeError("Simulated engine failure")):
        with caplog.at_level(logging.ERROR):
            payload = {
                "transactions": [{"amount": 100, "category": "Food"}],
                "budgets": {},
                "goals": [],
            }
            response = client.post("/internal/analytics/health-score", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["score"] == 85
            assert "budget_adherence" in data["breakdown"]
            assert any("Failed to calculate health score" in record.message for record in caplog.records)


def test_demo_dataset_regression():
    """7. Demo-dataset regression test.
    demo_transactions_jul_to_oct7.csv + 7 extra rows = 111 rows.
    Budgets: Food & Dining 6000, Groceries 6500, Entertainment 2000, Shopping 4000,
    Rent 25000, Utilities 3500, Travel 4000, Subscriptions 2500.
    Goals: none. total_income = 0.
    Expected:
      Monthly totals: Jul 51,254 / Aug 56,666 / Sep 49,875 / Oct 52,461.20
      Only Shopping is over budget in October (8,990 vs 4,000 -> -20)
      Spending trend improving +5 (52,461.20 < prior mean 52,598.33)
      Anomalies detected -3 (one anomaly: the Sony headphones)
      Final score: 82
    """
    fixture_path = Path(__file__).parent / "fixtures" / "demo_transactions_jul_to_oct7.csv"
    assert fixture_path.exists(), f"Fixture missing at {fixture_path}"
    df_base = pd.read_csv(fixture_path)
    assert len(df_base) == 104

    extra_rows = [
        {"date": "2026-10-07", "description": "Zomato lunch order", "amount": 450.0, "category": "Food & Dining"},
        {"date": "2026-10-08", "description": "BigBasket groceries", "amount": 1240.0, "category": "Groceries"},
        {"date": "2026-10-09", "description": "Uber to office", "amount": 285.0, "category": "Travel"},
        {"date": "2026-10-09", "description": "Amazon Sony WH-CH720N headphones", "amount": 8990.0, "category": "Shopping"},
        {"date": "2026-10-10", "description": "Bean & Bite lunch", "amount": 1180.20, "category": "Food & Dining"},
        {"date": "2026-10-10", "description": "PVR Cinemas movie tickets", "amount": 760.0, "category": "Entertainment"},
        {"date": "2026-10-11", "description": "fuel", "amount": 1350.0, "category": "Travel"},
    ]

    df = pd.concat([df_base, pd.DataFrame(extra_rows)], ignore_index=True)
    assert len(df) == 111

    # Verify monthly totals
    df_dated = df.copy()
    df_dated["dt"] = pd.to_datetime(df_dated["date"])
    monthly = df_dated.groupby(df_dated["dt"].dt.to_period("M"))["amount"].sum().to_dict()
    assert monthly[pd.Period("2026-07", "M")] == 51254.0
    assert monthly[pd.Period("2026-08", "M")] == 56666.0
    assert monthly[pd.Period("2026-09", "M")] == 49875.0
    assert monthly[pd.Period("2026-10", "M")] == 52461.20

    budgets = {
        "Food & Dining": 6000,
        "Groceries": 6500,
        "Entertainment": 2000,
        "Shopping": 4000,
        "Rent": 25000,
        "Utilities": 3500,
        "Travel": 4000,
        "Subscriptions": 2500,
    }

    result = calculate_health_score(df, budgets, [], total_income=0)

    assert result["score"] == 82
    assert result["breakdown"] == {
        "Shopping over budget": -20.0,
        "Spending trend improving": 5.0,
        "Anomalies detected": -3.0,
    }
