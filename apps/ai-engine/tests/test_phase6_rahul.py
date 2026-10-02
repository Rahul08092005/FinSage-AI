"""Phase 6 Unit and Integration Tests — Rahul (AI, RAG & Multi-Agent System Owner)."""
import json
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.rag.ingest import seed_guru_philosophy_knowledge, seed_demo_knowledge, search_domain
from app.agents.guru_agent import GuruAgent
from app.tools.forecast_tools import get_expense_forecast
from app.tools.goal_tools import track_goal_progress
from app.graph.supervisor import run_supervisor_graph


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


# ===========================================================================
# Task 1 & 3: GuruAgent Wiring, Routing & Structured Response Contract
# ===========================================================================


def test_guru_agent_wiring_via_orchestrate(client):
    """Test that guru-related queries route through supervisor to GuruAgent."""
    seed_guru_philosophy_knowledge()

    payload = {
        "user_id": "test-user-1",
        "session_id": "sess-1",
        "message": "How would Buffett and Bogle compare on my investment approach?",
    }
    response = client.post("/internal/ai/orchestrate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Verify GuruAgent is in agent_path
    assert "guru_agent" in data["agent_path"]
    assert "supervisor" in data["agent_path"]

    # Verify structured guru_perspectives contract
    perspectives = data.get("guru_perspectives")
    assert perspectives is not None
    assert isinstance(perspectives, list)
    assert len(perspectives) >= 2

    # Verify perspective schema fields: label, summary, reasoning
    for p in perspectives:
        assert "label" in p and isinstance(p["label"], str) and len(p["label"]) > 0
        assert "summary" in p and isinstance(p["summary"], str) and len(p["summary"]) > 0
        assert "reasoning" in p and isinstance(p["reasoning"], str) and len(p["reasoning"]) > 0


def test_guru_agent_keyword_variations():
    """Verify various guru keywords route correctly to GuruAgent."""
    test_queries = [
        "What is Charlie Munger's mental model philosophy?",
        "Explain Benjamin Graham's margin of safety",
        "What is Peter Lynch's investment philosophy?",
        "Which investor philosophy aligns with index investing?",
        "Compare philosophy of value investing and all-weather portfolio",
        "What would Dalio say about market cycles?",
    ]
    for q in test_queries:
        res = run_supervisor_graph(user_id="u1", session_id="s1", message=q)
        assert "guru_agent" in res.get("agent_path", []), f"Failed for query: {q}"
        assert res.get("guru_perspectives") is not None
        assert len(res.get("guru_perspectives", [])) >= 2


def test_guru_agent_explicit_domain_routing():
    """Verify that passing domain='guru_philosophy' routes to GuruAgent."""
    res = run_supervisor_graph(
        user_id="u1",
        session_id="s1",
        message="Advise me on asset allocation",
        domain="guru_philosophy",
    )
    assert "guru_agent" in res.get("agent_path", [])
    assert res.get("guru_perspectives") is not None


# ===========================================================================
# Task 2: guru_philosophy RAG Domain Seeding
# ===========================================================================


def test_seed_guru_philosophy_knowledge():
    """Verify seeding adds 5 distinct investor philosophy chunks."""
    res = seed_guru_philosophy_knowledge()
    assert res["status"] == "success"
    assert res["domain"] == "guru_philosophy"
    assert res["chunks_stored"] == 5

    # Check search retrieval in guru_philosophy
    chunks = search_domain("guru_philosophy", "Buffett and Bogle index funds value investing")
    assert len(chunks) >= 2

    retrieved_content = " ".join([c["content"].lower() for c in chunks])
    gurus_found = [g for g in ["buffett", "bogle", "graham", "lynch", "munger", "dalio"] if g in retrieved_content]
    assert len(gurus_found) >= 2, f"Expected >= 2 gurus in retrieved chunks, got {gurus_found}"


def test_seed_demo_knowledge_seeds_all_domains():
    """Verify seed_demo_knowledge seeds financial_knowledge, indian_tax_finance, and guru_philosophy."""
    res = seed_demo_knowledge()
    assert res["status"] == "success"
    assert res["chunks_stored"] >= 11  # 2 fk + 4 tax + 5 guru


# ===========================================================================
# Task 4: Predictive Financial Modeling Endpoints & Forecast Tools
# ===========================================================================


def test_forecast_tools_execution():
    """Verify get_expense_forecast tool parses data and computes forecast."""
    transactions = [
        {"transactionDate": "2026-01-15", "amount": 1000.0, "category": "Food"},
        {"transactionDate": "2026-02-15", "amount": 1200.0, "category": "Food"},
        {"transactionDate": "2026-03-15", "amount": 1400.0, "category": "Food"},
        {"transactionDate": "2026-03-10", "amount": 3000.0, "category": "Rent"},
    ]
    res = get_expense_forecast.invoke({
        "transactions_json": json.dumps(transactions),
        "months_ahead": 1,
    })
    assert "forecast" in res
    assert res["months_ahead"] == 1
    assert "Food" in res["forecast"]
    assert "Rent" in res["forecast"]
    assert res["total_projected"] > 0


def test_analytics_forecast_endpoint(client):
    """Test POST /internal/analytics/forecast with structured body."""
    transactions = [
        {"date": "2026-01-10", "amount": 2500.0, "category": "Groceries"},
        {"date": "2026-02-10", "amount": 2600.0, "category": "Groceries"},
        {"date": "2026-03-10", "amount": 2700.0, "category": "Groceries"},
    ]
    # Test structured request
    payload = {"transactions": transactions, "months_ahead": 2}
    resp = client.post("/internal/analytics/forecast", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "forecast" in data
    assert data["months_ahead"] == 2
    assert "Groceries" in data["forecast"]
    assert data["total_projected"] > 0

    # Test raw list request
    resp_list = client.post("/internal/analytics/forecast", json=transactions)
    assert resp_list.status_code == 200
    assert "forecast" in resp_list.json()


def test_analytics_what_if_endpoint(client):
    """Test POST /internal/analytics/what-if endpoint returns valid scenario simulation."""
    transactions = [
        {"date": "2026-01-10", "amount": 10000.0, "category": "Dining Out"},
        {"date": "2026-01-15", "amount": 20000.0, "category": "Rent"},
    ]
    payload = {
        "transactions": transactions,
        "category_adjustments": {"Dining Out": -0.20},
        "monthly_salary": 80000.0,
        "scenario_type": "expense_reduction",
    }
    resp = client.post("/internal/analytics/what-if", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["success", "contract_ready"]
    assert "baseline_monthly_spend" in data
    assert "projected_monthly_spend" in data
    assert "monthly_savings_delta" in data
    assert "annual_savings_delta" in data
    assert "category_projections" in data
    assert "summary" in data


# ===========================================================================
# Task 5: Goal Projection Accuracy with Kavya's calculate_goal_projection
# ===========================================================================


def test_goal_projection_accuracy():
    """Verify track_goal_progress uses calculate_goal_projection and factors in monthly_salary."""
    goals = [
        {
            "name": "House Downpayment",
            "target_amount": 600000.0,
            "current_saved": 100000.0,
            "target_date": "2028-12-31",
        }
    ]
    transactions = [
        {"date": "2026-01-15", "amount": 25000.0, "category": "General"},
        {"date": "2026-02-15", "amount": 25000.0, "category": "General"},
    ]
    # Salary = 75,000, spend = 25,000 => net monthly savings = 50,000
    # Remaining = 500,000 => months_remaining = 10
    res = track_goal_progress.invoke({
        "goals_json": json.dumps(goals),
        "transactions_json": json.dumps(transactions),
        "monthly_salary": 75000.0,
    })
    progress = res["goals_progress"][0]
    assert progress["goal_name"] == "House Downpayment"
    assert progress["percent_complete"] == round((100000.0 / 600000.0) * 100.0, 2)
    assert progress["months_remaining"] == 10
    assert progress["on_track"] is True
    assert "projected_completion_date" in progress


# ===========================================================================
# Regression Suite: All 7 Pre-Existing Supervisor Branches
# ===========================================================================


def test_supervisor_branch_1_document_id():
    """Branch 1: DocumentAgent when document_id is present."""
    state = {
        "user_id": "u1",
        "session_id": "s1",
        "message": "check my receipt",
        "document_id": "doc-12345",
    }
    res = run_supervisor_graph(**state)
    assert "document_agent" in res.get("agent_path", [])


def test_supervisor_branch_2_tax_sip():
    """Branch 2: Tax advice tool when tax keywords present."""
    res = run_supervisor_graph(
        user_id="u1",
        session_id="s1",
        message="How can I save on taxes with 80c and PPF?",
        income=1200000.0,
        current_80c_investments=50000.0,
    )
    assert "get_tax_savings_advice" in res.get("agent_path", [])
    assert res.get("metrics") is not None
    assert any(k in res.get("metrics", {}) for k in ["remaining_80c_limit", "savings", "tax_before_80c"])


def test_supervisor_branch_3_budget():
    """Branch 3: Budgeting tool when budget keywords present."""
    txs = [{"date": "2026-03-01", "amount": 500.0, "category": "Food"}]
    res = run_supervisor_graph(
        user_id="u1",
        session_id="s1",
        message="Can you recommend a budget limit for me?",
        transactions_json=json.dumps(txs),
    )
    assert "budgeting_tool" in res.get("agent_path", [])


def test_supervisor_branch_4_goal():
    """Branch 4: Goal tracking when goal keywords present."""
    goals = [{"name": "Car", "target_amount": 500000, "current_saved": 50000}]
    res = run_supervisor_graph(
        user_id="u1",
        session_id="s1",
        message="What is the progress on my savings goal?",
        goals_json=json.dumps(goals),
        income=600000.0,
    )
    assert "goal_tool" in res.get("agent_path", [])


def test_supervisor_branch_5_analytics():
    """Branch 5: AnalyticsAgent when analytics keywords present and transactions provided."""
    txs = [{"date": "2026-03-01", "amount": 500.0, "category": "Food"}]
    res = run_supervisor_graph(
        user_id="u1",
        session_id="s1",
        message="Give me a category split breakdown of my spending",
        transactions_json=json.dumps(txs),
    )
    assert "analytics_agent" in res.get("agent_path", [])


def test_supervisor_branch_6_expense_summary():
    """Branch 6: ExpenseAgent when spending keywords present and transactions provided."""
    txs = [{"date": "2026-03-01", "amount": 1500.0, "category": "Shopping"}]
    res = run_supervisor_graph(
        user_id="u1",
        session_id="s1",
        message="How much did I spend this month on transactions?",
        transactions_json=json.dumps(txs),
    )
    assert "expense_agent" in res.get("agent_path", [])


def test_supervisor_branch_7_finance_knowledge():
    """Branch 8 (formerly 7): RAGAdvisorAgent when finance knowledge query without transactions."""
    res = run_supervisor_graph(
        user_id="u1",
        session_id="s1",
        message="What is an emergency fund?",
        transactions_json=None,
    )
    assert "rag_advisor_agent" in res.get("agent_path", [])


def test_supervisor_fallback_direct():
    """Default fallback: Supervisor direct response when no branch keywords match."""
    res = run_supervisor_graph(
        user_id="u1",
        session_id="s1",
        message="Hello, can you help me today?",
        transactions_json=None,
    )
    assert res.get("agent_path") == ["supervisor"]
    assert len(res.get("answer", "")) > 0
