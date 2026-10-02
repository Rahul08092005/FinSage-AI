"""Unit and integration tests for ReasoningTrace across budget, goal, and report agents."""
import json
import unittest
from fastapi.testclient import TestClient

from app.schemas.advisor import ReasoningTrace, OrchestrateResponse
from app.agents.budget_agent import BudgetAgent
from app.agents.goal_agent import GoalAgent
from app.agents.report_agent import ReportAgent
from app.main import app


SAMPLE_TRANSACTIONS = [
    {"date": "2026-03-01", "amount": 1000.0, "category": "Food"},
    {"date": "2026-03-05", "amount": 2000.0, "category": "Food"},
    {"date": "2026-03-10", "amount": 3000.0, "category": "Rent"},
]

SAMPLE_GOALS = [
    {"name": "Emergency Fund", "target_amount": 50000.0, "current_saved": 20000.0}
]


class TestReasoningTraceSchema(unittest.TestCase):
    def test_reasoning_trace_schema_valid(self):
        """ReasoningTrace instantiates with valid evidence, calculation, and confidence."""
        trace = ReasoningTrace(
            evidence=["3 months analyzed", "Total spend: Rs.14,600"],
            calculation="3-month average Rs.14,600, current Rs.17,000, difference Rs.2,400",
            confidence="high",
        )
        self.assertEqual(len(trace.evidence), 2)
        self.assertEqual(trace.confidence, "high")
        self.assertIn("difference Rs.2,400", trace.calculation)

    def test_orchestrate_response_optional_reasoning_trace(self):
        """OrchestrateResponse allows reasoning_trace to be omitted (None)."""
        resp_without = OrchestrateResponse(answer="Summary answer")
        self.assertIsNone(resp_without.reasoning_trace)

        resp_with = OrchestrateResponse(
            answer="Budget advice",
            reasoning_trace=ReasoningTrace(
                evidence=["Rs.6,000 historical spend"],
                calculation="Rs.6,000 * 0.9 = Rs.5,400",
                confidence="medium",
            )
        )
        self.assertIsNotNone(resp_with.reasoning_trace)
        self.assertEqual(resp_with.reasoning_trace.confidence, "medium")


class TestAgentReasoningTraces(unittest.TestCase):
    def test_budget_agent_reasoning_trace(self):
        """BudgetAgent includes populated reasoning_trace based on real calculations."""
        agent = BudgetAgent()
        state = agent.run({
            "transactions_json": json.dumps(SAMPLE_TRANSACTIONS),
            "message": "Recommend a budget for me",
        })
        trace = state.get("reasoning_trace")
        self.assertIsNotNone(trace)
        self.assertIsInstance(trace.get("evidence"), list)
        self.assertTrue(len(trace.get("evidence")) > 0)
        self.assertIn("Rs.6,000.00", trace.get("calculation", ""))
        self.assertIn(trace.get("confidence"), ["high", "medium", "low"])

    def test_goal_agent_reasoning_trace(self):
        """GoalAgent includes populated reasoning_trace based on real calculations."""
        agent = GoalAgent()
        state = agent.run({
            "goals_json": json.dumps(SAMPLE_GOALS),
            "transactions_json": json.dumps(SAMPLE_TRANSACTIONS),
            "message": "Track my goal progress",
        })
        trace = state.get("reasoning_trace")
        self.assertIsNotNone(trace)
        self.assertIsInstance(trace.get("evidence"), list)
        self.assertTrue(len(trace.get("evidence")) > 0)
        self.assertIn("Emergency Fund", trace.get("calculation", ""))
        self.assertIn(trace.get("confidence"), ["high", "medium", "low"])

    def test_report_agent_reasoning_trace(self):
        """ReportAgent includes populated reasoning_trace based on real calculations."""
        agent = ReportAgent()
        state = agent.run({
            "transactions_json": json.dumps(SAMPLE_TRANSACTIONS),
            "goals_json": json.dumps(SAMPLE_GOALS),
            "income": 1200000.0,
            "current_80c_investments": 50000.0,
            "health_score": 88,
        })
        trace = state.get("reasoning_trace")
        self.assertIsNotNone(trace)
        self.assertIsInstance(trace.get("evidence"), list)
        self.assertTrue(len(trace.get("evidence")) > 0)
        self.assertIn("Monthly income", trace.get("calculation", ""))
        self.assertEqual(trace.get("confidence"), "high")


class TestOrchestrateReasoningTraceAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_orchestrate_budgeting_includes_reasoning_trace(self):
        """Calling orchestrate with budgeting question returns populated reasoning_trace matching numbers."""
        res = self.client.post("/internal/ai/orchestrate", json={
            "user_id": "test_user",
            "session_id": "test_sess",
            "message": "Recommend a monthly budget for how much should i spend",
            "transactions_json": SAMPLE_TRANSACTIONS,
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        trace = data.get("reasoning_trace")
        self.assertIsNotNone(trace)
        self.assertIsInstance(trace.get("evidence"), list)
        self.assertGreater(len(trace["evidence"]), 0)
        # Verify calculation matches the real numbers: Rs.6,000 total -> Rs.5,400 budget limit
        self.assertIn("6,000", trace.get("calculation", ""))
        self.assertIn("5,400", trace.get("calculation", ""))
        self.assertIn(trace.get("confidence"), ["high", "medium", "low"])

    def test_orchestrate_simple_spending_omits_reasoning_trace(self):
        """Calling orchestrate with spending summary leaves reasoning_trace null/omitted."""
        res = self.client.post("/internal/ai/orchestrate", json={
            "user_id": "test_user",
            "session_id": "test_sess",
            "message": "What is my spending summary this month?",
            "transactions_json": SAMPLE_TRANSACTIONS,
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsNone(data.get("reasoning_trace"))

    def test_orchestrate_goal_tracking_includes_reasoning_trace(self):
        """Calling orchestrate with goal tracking question returns populated reasoning_trace."""
        res = self.client.post("/internal/ai/orchestrate", json={
            "user_id": "test_user",
            "session_id": "test_sess",
            "message": "Track my goal progress for saving",
            "transactions_json": SAMPLE_TRANSACTIONS,
            "goals_json": json.dumps(SAMPLE_GOALS),
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        trace = data.get("reasoning_trace")
        self.assertIsNotNone(trace)
        self.assertIn("Emergency Fund", trace.get("calculation", ""))


if __name__ == "__main__":
    unittest.main()
