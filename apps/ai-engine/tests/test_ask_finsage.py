"""Tests for 'Ask FinSage' Natural Language Query tool and Supervisor routing."""
import json
import unittest
from unittest.mock import patch

from app.tools.nl_query_tools import ask_finsage
from app.graph.supervisor import run_supervisor_graph


SAMPLE_TRANSACTIONS = [
    {"date": "2026-03-07", "amount": 450.0, "category": "Food"},       # Saturday
    {"date": "2026-03-08", "amount": 550.0, "category": "Food"},       # Sunday
    {"date": "2026-03-09", "amount": 300.0, "category": "Food"},       # Monday
    {"date": "2026-03-07", "amount": 1200.0, "category": "Shopping"},  # Saturday
    {"date": "2026-03-10", "amount": 5000.0, "category": "Rent"},      # Tuesday
]


class TestAskFinSageTool(unittest.TestCase):
    def test_weekend_food_filtering(self):
        """Ask FinSage accurately filters category 'Food' on 'weekend'."""
        result = ask_finsage.invoke({
            "question": "how much did I spend on food on weekends",
            "transactions_json": SAMPLE_TRANSACTIONS,
        })
        self.assertIn("answer", result)
        self.assertIn("filters_used", result)
        self.assertIn("total", result)
        self.assertIn("count", result)
        self.assertEqual(result["total"], 1000.0)
        self.assertEqual(result["count"], 2)
        self.assertEqual(len(result["matching_transactions"]), 2)
        filters = result["filters_used"]
        self.assertEqual(str(filters.get("category")).lower(), "food")
        self.assertIn(str(filters.get("day_of_week")).lower(), ("weekend", "weekends"))

    def test_vague_question_graceful_fallback(self):
        """Deliberately vague question falls back gracefully with no filters rather than crashing."""
        result = ask_finsage.invoke({
            "question": "tell me about my records and stuff",
            "transactions_json": SAMPLE_TRANSACTIONS,
        })
        self.assertIn("answer", result)
        self.assertEqual(result["total"], 7500.0)
        self.assertEqual(result["count"], 5)
        self.assertEqual(result["filters_used"], {})

    def test_unparseable_llm_output_graceful_fallback(self):
        """When LLM returns unparseable garbage, falls back to no filters and notes in answer."""
        with patch("app.tools.nl_query_tools.generate", return_value="<<<GARBAGE NOT JSON>>>"):
            result = ask_finsage.invoke({
                "question": "show me some data",
                "transactions_json": SAMPLE_TRANSACTIONS,
            })
            self.assertEqual(result["filters_used"], {})
            self.assertEqual(result["count"], 5)
            self.assertEqual(result["total"], 7500.0)
            self.assertIn("Could not parse", result["answer"])

    def test_empty_transactions(self):
        """Tool handles empty transactions without error."""
        result = ask_finsage.invoke({
            "question": "how much did I spend on food",
            "transactions_json": "[]",
        })
        self.assertEqual(result["total"], 0.0)
        self.assertEqual(result["count"], 0)
        self.assertEqual(result["matching_transactions"], [])


class TestSupervisorRouting(unittest.TestCase):
    def test_supervisor_routes_weekend_food_to_ask_finsage(self):
        """Question with specific filters routes to ask_finsage and returns accurate metrics."""
        tx_json = json.dumps(SAMPLE_TRANSACTIONS)
        state = run_supervisor_graph(
            user_id="user_test",
            session_id="session_test",
            message="how much did I spend on food on weekends",
            transactions_json=tx_json,
        )
        self.assertIn("ask_finsage", state.get("agent_path", []))
        metrics = state.get("metrics", {})
        self.assertEqual(metrics.get("total"), 1000.0)
        self.assertEqual(metrics.get("count"), 2)
        self.assertEqual(str(metrics.get("filters_used", {}).get("category")).lower(), "food")

    def test_supervisor_routes_vague_question_to_fallback(self):
        """General / vague question with transactions routes to ask_finsage fallback."""
        tx_json = json.dumps(SAMPLE_TRANSACTIONS)
        state = run_supervisor_graph(
            user_id="user_test",
            session_id="session_test",
            message="tell me about my stuff and records",
            transactions_json=tx_json,
        )
        self.assertIn("ask_finsage", state.get("agent_path", []))
        metrics = state.get("metrics", {})
        self.assertEqual(metrics.get("total"), 7500.0)
        self.assertEqual(metrics.get("count"), 5)

    def test_phase_1_to_5_spending_summary_unchanged(self):
        """General spending overview still routes to expense_agent."""
        tx_json = json.dumps(SAMPLE_TRANSACTIONS)
        state = run_supervisor_graph(
            user_id="user_test",
            session_id="session_test",
            message="What is my spending summary this month?",
            transactions_json=tx_json,
        )
        self.assertIn("expense_agent", state.get("agent_path", []))

    def test_phase_1_to_5_budget_recommendation_unchanged(self):
        """Budget recommendation query still routes to budgeting_tool."""
        tx_json = json.dumps(SAMPLE_TRANSACTIONS)
        state = run_supervisor_graph(
            user_id="user_test",
            session_id="session_test",
            message="Recommend a budget for how much should i spend",
            transactions_json=tx_json,
        )
        self.assertIn("budgeting_tool", state.get("agent_path", []))

    def test_phase_1_to_5_goal_tracking_unchanged(self):
        """Goal tracking query still routes to goal_tool."""
        tx_json = json.dumps(SAMPLE_TRANSACTIONS)
        state = run_supervisor_graph(
            user_id="user_test",
            session_id="session_test",
            message="Track my goal progress for saving",
            transactions_json=tx_json,
        )
        self.assertIn("goal_tool", state.get("agent_path", []))

    def test_phase_1_to_5_tax_advice_unchanged(self):
        """Tax advice query still routes to tax tool."""
        state = run_supervisor_graph(
            user_id="user_test",
            session_id="session_test",
            message="How can I save on taxes with 80c and PPF?",
            income=1200000.0,
            current_80c_investments=50000.0,
        )
        agent_path = state.get("agent_path", [])
        self.assertTrue(any("tax" in p.lower() for p in agent_path))


if __name__ == "__main__":
    unittest.main()
