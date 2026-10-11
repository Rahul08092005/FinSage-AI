"""
FinSage AI - Agent Smoke Test
=============================
Checks that every agent in apps/ai-engine/app/agents/ actually works, and that
the Supervisor routes messages to the right place.

WHERE TO PUT IT:   apps/ai-engine/tests/agent_smoke_test.py   (new file, nothing else changes)

HOW TO RUN (from apps/ai-engine, with your venv activated):
    python tests/agent_smoke_test.py              # LAYER 1: offline, LLM is stubbed (tests your code logic)
    python tests/agent_smoke_test.py --live       # LAYER 2: real LLM calls (tests keys, models, fallbacks)

Status meanings:
    PASS  agent ran and produced the expected output
    WARN  agent ran but something is suspicious (e.g. LLM silently fell back to a mock string)
    FAIL  agent crashed or returned wrong/empty output
"""
import argparse
import json
import os
import sys
import traceback
from unittest.mock import patch

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # apps/ai-engine
sys.path.insert(0, ROOT)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(ROOT, ".env"))
except Exception:
    pass

# ----------------------------------------------------------------------------
# Sample data
# ----------------------------------------------------------------------------
TX = [
    {"date": "2026-08-03", "amount": 450.0, "category": "Food & Dining", "description": "Zomato"},
    {"date": "2026-08-05", "amount": 3500.0, "category": "Travel", "description": "Fuel"},
    {"date": "2026-08-10", "amount": 12000.0, "category": "Rent", "description": "House rent"},
    {"date": "2026-09-02", "amount": 800.0, "category": "Groceries", "description": "BigBasket"},
    {"date": "2026-09-14", "amount": 1499.0, "category": "Subscriptions", "description": "Netflix"},
    {"date": "2026-09-20", "amount": 2200.0, "category": "Shopping", "description": "Amazon"},
]
TX_JSON = json.dumps(TX)
GOALS_JSON = json.dumps([
    {"name": "Emergency Fund", "target_amount": 100000.0, "current_saved": 30000.0},
])

LLM_FALLBACK_MARKERS = (
    "[mock",                                   # all mock responses in llm_client.py
    "I am analyzing your financial records",   # groq: every candidate model failed
)

RESULTS = []  # (agent, check, status, detail)


def record(agent, check, status, detail=""):
    RESULTS.append((agent, check, status, detail))
    icon = {"PASS": "[PASS]", "WARN": "[WARN]", "FAIL": "[FAIL]"}[status]
    print(f"{icon} {agent:<18} {check:<38} {detail}")


# ----------------------------------------------------------------------------
# LLM stub / recorder
# ----------------------------------------------------------------------------
class LLMRecorder:
    """Replaces `generate` inside each agent module. Records prompts.
    offline -> returns a stub string.  live -> calls the real LLM."""

    def __init__(self, live):
        self.live = live
        self.prompts = []
        from app.services import llm_client
        self._real = llm_client.generate

    def __call__(self, prompt, system=None):
        self.prompts.append(str(prompt))
        if self.live:
            return self._real(prompt, system)
        return "STUB_LLM_ANSWER: ok"


MODULES_USING_GENERATE = [
    "app.agents.analytics_agent",
    "app.agents.budget_agent",
    "app.agents.document_agent",
    "app.agents.expense_agent",
    "app.agents.goal_agent",
    "app.agents.guru_agent",
    "app.agents.rag_advisor_agent",
    "app.agents.report_agent",
    "app.graph.supervisor",
]


def patch_llm(rec):
    return [patch(f"{m}.generate", rec) for m in MODULES_USING_GENERATE]


class MultiPatch:
    def __init__(self, patches):
        self.patches = patches

    def __enter__(self):
        for p in self.patches:
            p.start()

    def __exit__(self, *a):
        for p in self.patches:
            p.stop()


# ----------------------------------------------------------------------------
# Check helpers
# ----------------------------------------------------------------------------
def check_answer(agent, state, live, expect_path=None):
    ans = state.get("answer")
    if not ans or not str(ans).strip():
        record(agent, "non-empty answer", "FAIL", "answer is empty")
        return False
    if live and any(m in str(ans) for m in LLM_FALLBACK_MARKERS):
        record(agent, "answer is from real LLM", "WARN",
               "LLM returned a mock/fallback string -> check API key, LLM_PROVIDER, model names")
    else:
        record(agent, "non-empty answer", "PASS", f"{len(str(ans))} chars")
    if expect_path:
        path = state.get("agent_path", [])
        if expect_path in path:
            record(agent, f"agent_path has '{expect_path}'", "PASS", str(path))
        else:
            record(agent, f"agent_path has '{expect_path}'", "FAIL", f"got {path}")
    return True


def check_trace(agent, state):
    t = state.get("reasoning_trace")
    ok = isinstance(t, dict) and t.get("evidence") and t.get("calculation") and t.get("confidence")
    record(agent, "reasoning_trace populated", "PASS" if ok else "FAIL", str(t)[:90] if not ok else t["confidence"])


def run_agent(label, fn):
    """Run fn(); never let one agent crash the whole script."""
    try:
        return fn()
    except Exception as e:
        record(label, "ran without exception", "FAIL", f"{type(e).__name__}: {e}")
        if os.getenv("SMOKE_TRACE"):
            traceback.print_exc()
        return None


# ----------------------------------------------------------------------------
# Individual agent tests
# ----------------------------------------------------------------------------
def test_expense(live):
    from app.agents.expense_agent import ExpenseAgent
    s = run_agent("expense_agent", lambda: ExpenseAgent().run(
        {"message": "How much did I spend?", "transactions_json": TX_JSON}))
    if s:
        check_answer("expense_agent", s, live, "expense_agent")


def test_analytics(live):
    from app.agents.analytics_agent import AnalyticsAgent
    s = run_agent("analytics_agent", lambda: AnalyticsAgent().run(
        {"message": "Show category breakdown", "transactions_json": TX_JSON}))
    if s:
        check_answer("analytics_agent", s, live, "analytics_agent")


def test_budget(live):
    from app.agents.budget_agent import BudgetAgent
    s = run_agent("budget_agent", lambda: BudgetAgent().run(
        {"message": "Recommend a budget", "transactions_json": TX_JSON}))
    if s:
        check_answer("budget_agent", s, live, "budget_agent")
        check_trace("budget_agent", s)


def test_goal(live):
    from app.agents.goal_agent import GoalAgent
    s = run_agent("goal_agent", lambda: GoalAgent().run(
        {"message": "How is my goal going?", "goals_json": GOALS_JSON, "transactions_json": TX_JSON}))
    if s:
        check_answer("goal_agent", s, live, "goal_agent")
        check_trace("goal_agent", s)


def test_report(live):
    from app.agents.report_agent import ReportAgent
    s = run_agent("report_agent", lambda: ReportAgent().run(
        {"transactions_json": TX_JSON, "goals_json": GOALS_JSON, "income": 900000.0}))
    if s:
        ans = str(s.get("answer", ""))
        if len(ans) > 200 and "#" in ans:
            record("report_agent", "markdown report generated", "PASS", f"{len(ans)} chars")
        else:
            record("report_agent", "markdown report generated", "FAIL", f"too short / no headings ({len(ans)} chars)")
        check_trace("report_agent", s)
        if live and any(m in ans for m in LLM_FALLBACK_MARKERS):
            record("report_agent", "summary paragraph from real LLM", "WARN", "mock text inside report")


def test_rag(live):
    from app.agents.rag_advisor_agent import RAGAdvisorAgent
    s = run_agent("rag_advisor_agent", lambda: RAGAdvisorAgent().run(
        {"message": "What is the Section 80C deduction limit?"}))
    if s:
        check_answer("rag_advisor_agent", s, live, "rag_advisor_agent")
        cits = s.get("citations") or []
        record("rag_advisor_agent", "retrieved citations (RAG works)",
               "PASS" if cits else "FAIL",
               f"{len(cits)} chunks" if cits else "no chunks retrieved -> vector store / seeding problem")


def test_guru(live):
    from app.agents.guru_agent import GuruAgent
    s = run_agent("guru_agent", lambda: GuruAgent().run(
        {"message": "Compare Buffett and Bogle investment philosophy"}))
    if s:
        check_answer("guru_agent", s, live, "guru_agent")
        gp = s.get("guru_perspectives") or []
        record("guru_agent", "guru_perspectives (standard flow)",
               "PASS" if gp else "WARN", f"{len(gp)} perspectives")
    s2 = run_agent("guru_agent", lambda: GuruAgent().run(
        {"message": "Should I buy index funds vs individual stocks?",
         "transactions_json": TX_JSON, "goals_json": GOALS_JSON}))
    if s2:
        check_answer("guru_agent", s2, live, "guru_agent")
        vps = (s2.get("metrics") or {}).get("viewpoints") or []
        record("guru_agent", "dilemma flow returns viewpoints",
               "PASS" if vps else "WARN", f"{len(vps)} viewpoints")


def test_document(live, rec):
    from app.agents.document_agent import DocumentAgent
    import requests

    # 1) no document_id -> graceful message
    s0 = run_agent("document_agent", lambda: DocumentAgent().run({"message": "summarize"}))
    if s0:
        ok = "No document_id" in str(s0.get("answer", ""))
        record("document_agent", "handles missing document_id", "PASS" if ok else "FAIL", str(s0.get("answer"))[:60])

    # 2) BFF unreachable -> what does the agent do?
    rec.prompts.clear()
    with patch.object(requests, "get", side_effect=requests.ConnectionError("simulated BFF down")):
        s = run_agent("document_agent", lambda: DocumentAgent().run(
            {"message": "Summarize my receipt", "document_id": "doc-123"}))
    if s:
        check_answer("document_agent", s, live, "document_agent")
        if any("Grocery Store ($120)" in p for p in rec.prompts):
            record("document_agent", "BFF-down behaviour", "WARN",
                   "BFF unreachable -> agent summarises HARDCODED FAKE transactions in $ instead of reporting an error")


# ----------------------------------------------------------------------------
# Supervisor routing tests
# ----------------------------------------------------------------------------
ROUTING_CASES = [
    # (label, kwargs, expected agent_path entry)
    ("document id present",  dict(message="summarize", document_id="doc-1"),                          "document_agent"),
    ("tax question",         dict(message="How can I save tax under 80C?"),                           "get_tax_savings_advice"),
    ("budget question",      dict(message="Recommend a budget for me", transactions_json=TX_JSON),    "budgeting_tool"),
    ("goal question",        dict(message="Show my goal progress", goals_json=GOALS_JSON, transactions_json=TX_JSON), "goal_tool"),
    ("category breakdown",   dict(message="Give me a category breakdown", transactions_json=TX_JSON), "analytics_agent"),
    ("spending summary",     dict(message="How much did I spend this month?", transactions_json=TX_JSON), "expense_agent"),
    ("NL filter query",      dict(message="Which transactions above 1000?", transactions_json=TX_JSON), "ask_finsage"),
    ("guru philosophy",      dict(message="Compare Buffett and Bogle philosophy"),                    "guru_agent"),
    ("finance knowledge",    dict(message="Explain what is a mutual fund"),                           "rag_advisor_agent"),
]


def test_supervisor(live):
    from app.graph.supervisor import run_supervisor_graph
    for label, kwargs, expected in ROUTING_CASES:
        def go():
            return run_supervisor_graph(user_id="u1", session_id="s1", **kwargs)
        s = run_agent("supervisor", go)
        if not s:
            continue
        path = s.get("agent_path", [])
        has_answer = bool(str(s.get("answer", "")).strip())
        if expected in path and has_answer:
            record("supervisor", f"route: {label}", "PASS", f"-> {path}")
        elif expected in path:
            record("supervisor", f"route: {label}", "FAIL", "routed correctly but answer empty")
        else:
            record("supervisor", f"route: {label}", "FAIL", f"expected '{expected}', got {path}")

    # Default fallback (no keywords, no data)
    s = run_agent("supervisor", lambda: run_supervisor_graph(user_id="u1", session_id="s1", message="hello there"))
    if s:
        record("supervisor", "route: default fallback", "PASS" if str(s.get("answer", "")).strip() else "FAIL",
               str(s.get("agent_path")))


# ----------------------------------------------------------------------------
# Optional: HTTP-level test (server must be running on :8000)
# ----------------------------------------------------------------------------
def test_http(base):
    try:
        import requests
    except ImportError:
        record("http", "requests installed", "WARN", "pip install requests")
        return
    try:
        r = requests.get(f"{base}/health", timeout=5)
        record("http", "GET /health", "PASS" if r.status_code == 200 else "FAIL", r.text[:100])
    except Exception as e:
        record("http", "GET /health", "FAIL", f"server not reachable at {base}: {e}")
        return
    try:
        r = requests.post(f"{base}/internal/ai/orchestrate", timeout=60, json={
            "user_id": "u1", "session_id": "s1",
            "message": "How much did I spend?", "transactions_json": TX,
        })
        ok = r.status_code == 200 and r.json().get("answer")
        record("http", "POST /internal/ai/orchestrate", "PASS" if ok else "FAIL",
               f"{r.status_code} path={r.json().get('agent_path') if r.ok else r.text[:80]}")
    except Exception as e:
        record("http", "POST /internal/ai/orchestrate", "FAIL", str(e))


# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", action="store_true", help="use the real LLM instead of a stub")
    ap.add_argument("--http", metavar="URL", nargs="?", const="http://localhost:8000",
                    help="also test a running server (default http://localhost:8000)")
    args = ap.parse_args()

    print(f"\nFinSage agent smoke test  |  mode: {'LIVE LLM' if args.live else 'OFFLINE (LLM stubbed)'}"
          f"  |  LLM_PROVIDER={os.getenv('LLM_PROVIDER', 'groq')}\n")

    if args.live:
        prov = os.getenv("LLM_PROVIDER", "groq")
        key = os.getenv("GROQ_API_KEY" if prov == "groq" else "GEMINI_API_KEY", "")
        if not key or "your_" in key:
            record("llm", "API key present", "FAIL", f"no real key for provider '{prov}' in .env")
        else:
            record("llm", "API key present", "PASS", prov)

    rec = LLMRecorder(live=args.live)
    with MultiPatch(patch_llm(rec)):
        test_expense(args.live)
        test_analytics(args.live)
        test_budget(args.live)
        test_goal(args.live)
        test_report(args.live)
        test_rag(args.live)
        test_guru(args.live)
        test_document(args.live, rec)
        test_supervisor(args.live)

    if args.http:
        test_http(args.http)

    p = sum(1 for r in RESULTS if r[2] == "PASS")
    w = sum(1 for r in RESULTS if r[2] == "WARN")
    f = sum(1 for r in RESULTS if r[2] == "FAIL")
    print(f"\n==== SUMMARY: {p} passed, {w} warnings, {f} failed ====")
    for r in RESULTS:
        if r[2] != "PASS":
            print(f"  {r[2]}: {r[0]} / {r[1]} -> {r[3]}")
    sys.exit(1 if f else 0)


if __name__ == "__main__":
    main()
