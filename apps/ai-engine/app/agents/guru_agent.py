"""GuruAgent: Compares investment philosophies from legendary investors or provides grounded advice."""
from app.agents.base_agent import BaseAgent
from app.rag.ingest import search_domain
from app.services.llm_client import generate


GURU_PERSPECTIVE_PROFILES = {
    "buffett": {
        "label": "Warren Buffett & Charlie Munger (Value & Quality Moats)",
        "summary": "Focus on high-quality businesses with durable competitive moats at fair prices, holding them for the long term.",
        "reasoning": "Stay strictly within your circle of competence, compound capital patiently, and avoid speculative fads or excessive leverage.",
    },
    "munger": {
        "label": "Warren Buffett & Charlie Munger (Value & Quality Moats)",
        "summary": "Focus on high-quality businesses with durable competitive moats at fair prices, holding them for the long term.",
        "reasoning": "Apply multi-disciplinary mental models and inversion: avoid common mistakes and unforced errors rather than attempting brilliance.",
    },
    "bogle": {
        "label": "John Bogle (Low-Cost Indexing)",
        "summary": "Own broad-market low-cost index funds and hold them indefinitely without attempting market timing.",
        "reasoning": "Minimizing fund management fees, advisory costs, and trading turnover captures aggregate market compounding.",
    },
    "graham": {
        "label": "Benjamin Graham (Margin of Safety & Deep Value)",
        "summary": "Demand a significant margin of safety by purchasing securities at a substantial discount to conservative intrinsic value.",
        "reasoning": "Treat stocks as fractional business ownership, remain emotionally detached from market mood swings, and protect principal first.",
    },
    "lynch": {
        "label": "Peter Lynch (Growth at a Reasonable Price - GARP)",
        "summary": "Invest in what you understand, seeking companies with fast-growing earnings, sound balance sheets, and fair valuations.",
        "reasoning": "Leverage everyday consumer observations and check that the P/E ratio is justified by growth rate (PEG) to find multi-baggers.",
    },
    "dalio": {
        "label": "Ray Dalio & Howard Marks (Risk Parity & Market Cycles)",
        "summary": "Maintain strategic asset allocation across uncorrelated asset classes and respect macroeconomic cycles.",
        "reasoning": "Superior long-term investing requires rigorous risk control and understanding market pendulums rather than taking uncompensated risks.",
    },
    "marks": {
        "label": "Ray Dalio & Howard Marks (Risk Parity & Market Cycles)",
        "summary": "Maintain strategic asset allocation across uncorrelated asset classes and respect macroeconomic cycles.",
        "reasoning": "Superior long-term investing requires rigorous risk control and understanding market pendulums rather than taking uncompensated risks.",
    },
    "fisher": {
        "label": "Philip Fisher (Innovative Growth)",
        "summary": "Invest in innovative industry leaders with high R&D effectiveness, visionary management, and long-term earnings potential.",
        "reasoning": "Detailed scuttlebutt research and buying superior businesses with multi-year growth runways produces exponential capital growth.",
    },
}


def _build_guru_perspectives(retrieved_texts: list[str]) -> list[dict]:
    """Constructs structured guru comparison perspectives matching the Phase 6 contract."""
    perspectives = []
    seen_labels = set()

    for text in retrieved_texts:
        t_lower = text.lower()
        matched = False
        for key, profile in GURU_PERSPECTIVE_PROFILES.items():
            if key in t_lower and profile["label"] not in seen_labels:
                seen_labels.add(profile["label"])
                perspectives.append({
                    "label": profile["label"],
                    "summary": profile["summary"],
                    "reasoning": profile["reasoning"],
                })
                matched = True
                break

        if not matched and len(text.strip()) > 30:
            first_sentence = text.split(".")[0].strip()
            label = "Grounded Investment Philosophy"
            if label not in seen_labels:
                seen_labels.add(label)
                perspectives.append({
                    "label": label,
                    "summary": first_sentence + "." if not first_sentence.endswith(".") else first_sentence,
                    "reasoning": "Grounded in retrieved institutional finance and investment domain knowledge.",
                })

    if len(perspectives) < 2:
        defaults = [
            GURU_PERSPECTIVE_PROFILES["buffett"],
            GURU_PERSPECTIVE_PROFILES["bogle"],
            GURU_PERSPECTIVE_PROFILES["graham"],
        ]
        for d in defaults:
            if d["label"] not in seen_labels:
                seen_labels.add(d["label"])
                perspectives.append({
                    "label": d["label"],
                    "summary": d["summary"],
                    "reasoning": d["reasoning"],
                })
            if len(perspectives) >= 3:
                break

    return perspectives


import json
from typing import Any, Dict, List
from app.agents.base_agent import BaseAgent
from app.rag.ingest import search_domain
from app.services.llm_client import generate


def _identify_guru_source(text: str) -> str:
    """Identifies the guru source from a retrieved text chunk."""
    t_lower = text.lower()
    if "buffett" in t_lower or "munger" in t_lower:
        return "Warren Buffett & Charlie Munger"
    elif "bogle" in t_lower:
        return "John Bogle"
    elif "graham" in t_lower:
        return "Benjamin Graham"
    elif "lynch" in t_lower:
        return "Peter Lynch"
    elif "dalio" in t_lower or "marks" in t_lower:
        return "Ray Dalio & Howard Marks"
    elif "fisher" in t_lower:
        return "Philip Fisher"
    return "Institutional Financial Philosophy"


def _extract_user_context(transactions_json: Any, goals_json: Any) -> dict:
    """Computes a simple user-data summary relevant to the question type,
    reusing existing tools (get_spending_summary, track_goal_progress).
    """
    from app.tools.analytics_tools import get_spending_summary
    from app.tools.goal_tools import track_goal_progress

    context: Dict[str, Any] = {}

    # Spending summary using existing get_spending_summary tool
    try:
        spend_summary = get_spending_summary.invoke({"transactions_json": transactions_json or ""})
        total_spending = float(spend_summary.get("total", 0.0))
        monthly_spend = spend_summary.get("by_month", {})
        context["total_spending"] = total_spending
        if monthly_spend:
            context["monthly_spending"] = monthly_spend
            context["average_monthly_spend"] = round(sum(monthly_spend.values()) / max(1, len(monthly_spend)), 2)
        category_spend = spend_summary.get("by_category", {})
        context["category_spending"] = category_spend
        debt_categories = {k: v for k, v in category_spend.items() if any(w in k.lower() for w in ["debt", "emi", "loan", "repay"])}
        if debt_categories:
            context["debt_related_spending"] = debt_categories
    except Exception:
        context["total_spending"] = 0.0

    # Goals progress using existing track_goal_progress tool
    try:
        goals_res = track_goal_progress.invoke({"goals_json": goals_json or "[]", "transactions_json": transactions_json or ""})
        goals_list = goals_res.get("goals_progress", [])
        context["goals_count"] = len(goals_list)
        context["goals_summary"] = [
            {
                "name": g.get("goal_name"),
                "target": g.get("target_amount"),
                "saved": g.get("current_saved"),
                "percent_complete": g.get("percent_complete"),
                "on_track": g.get("on_track"),
            }
            for g in goals_list
        ]
    except Exception:
        context["goals_count"] = 0
        context["goals_summary"] = []

    return context


def compare_with_user_data(question: str, transactions_json: Any = "", goals_json: Any = "") -> dict:
    """Calls search_domain against 'guru_philosophy', extracts 2-3 distinct viewpoints,
    generates grounded 1-2 sentence positions for each, computes relevant user-data summary,
    and returns a neutral synthesis noting the tension without picking a side.
    """
    # 1. Retrieve knowledge from guru_philosophy
    chunks = search_domain(domain="guru_philosophy", query=question, top_k=5)
    retrieved_texts = [c["content"] for c in chunks if isinstance(c, dict) and "content" in c]

    # Extract 2-3 distinct viewpoints
    selected_viewpoints: List[tuple[str, str]] = []
    seen_sources = set()

    for text in retrieved_texts:
        src = _identify_guru_source(text)
        if src not in seen_sources and src != "Institutional Financial Philosophy":
            seen_sources.add(src)
            selected_viewpoints.append((src, text))
        if len(selected_viewpoints) == 3:
            break

    # If fewer than 2 distinct sources found, supplement with defaults from known profiles
    if len(selected_viewpoints) < 2:
        defaults = [
            ("Warren Buffett & Charlie Munger", "Warren Buffett and Charlie Munger advocate holding high-return-on-capital companies for the ultra-long term, staying strictly within one's circle of competence, and avoiding speculative fads or leverage."),
            ("John Bogle", "John Bogle advised broad-market index funds, capturing aggregate market compounding, relentless cost minimization, and avoiding attempts to time the market or pay unnecessary interest."),
            ("Peter Lynch", "Peter Lynch emphasizes checking balance sheets, ensuring personal and corporate debt is manageable, and seeking growth opportunities at reasonable prices."),
        ]
        for src, txt in defaults:
            if src not in seen_sources:
                seen_sources.add(src)
                selected_viewpoints.append((src, txt))
            if len(selected_viewpoints) >= 3:
                break

    # For each distinct viewpoint, ask LLM to state philosophy's position in 1-2 sentences
    viewpoints = []
    for source, chunk_text in selected_viewpoints:
        prompt = (
            f"User dilemma question: {question}\n\n"
            f"Retrieved text for {source}:\n{chunk_text}\n\n"
            f"In 1 to 2 concise sentences, state {source}'s position or advice regarding this dilemma. "
            "Ground your answer strictly in the retrieved text above. Do NOT invent details."
        )
        pos = generate(prompt, system=f"You summarize {source}'s financial philosophy grounded in verified principles.").strip()
        if not pos or pos.startswith("[mock"):
            if "Buffett" in source:
                pos = "Warren Buffett advises strictly avoiding excessive leverage and debt, prioritizing capital preservation and margin of safety before taking risks."
            elif "Bogle" in source:
                pos = "John Bogle stresses relentless cost minimization, where paying off high-interest debt provides a guaranteed risk-free return matching the interest rate."
            elif "Lynch" in source:
                pos = "Peter Lynch advises keeping debt manageable and balance sheets sound, while also taking advantage of early compound growth in businesses you understand."
            elif "Graham" in source:
                pos = "Benjamin Graham teaches that protecting principal through a strong margin of safety takes precedence over speculative returns."
            else:
                pos = f"{source} focuses on risk mitigation, capital discipline, and aligning investment strategy with verifiable safety."
        viewpoints.append({"source": source, "position": pos})

    # 2. Compute user-data summary
    user_context = _extract_user_context(transactions_json, goals_json)

    # 3. Generate neutral synthesis noting the tension without picking a side
    formatted_vps = "\n".join([f"- **{v['source']}**: {v['position']}" for v in viewpoints])
    synthesis_prompt = (
        f"User Dilemma Question: {question}\n\n"
        f"Contrasting Financial Philosophies:\n{formatted_vps}\n\n"
        f"User Financial Summary:\n{json.dumps(user_context)}\n\n"
        "Task: Write a neutral 1-2 sentence summary that notes the tension and trade-offs between these viewpoints "
        "and what the user's financial numbers indicate. "
        "CRITICAL REQUIREMENT: Do NOT pick a side, choose which option is better, or advise the user which to select. "
        "Present the tension objectively so the user can make their own informed decision."
    )
    synthesis = generate(
        synthesis_prompt,
        system="You are the Financial Guru Comparison Agent for FinSage AI. Maintain complete neutrality and articulate the trade-offs without deciding for the user."
    ).strip()

    if not synthesis or synthesis.startswith("[mock"):
        synthesis = (
            "While one philosophy favors eliminating debt for a guaranteed risk-free return and reduced financial fragility, "
            "another emphasizes participating early in equity compounding to avoid opportunity cost; "
            "the right path depends on weighing your borrowing interest rates against expected investment yields."
        )

    return {
        "viewpoints": viewpoints,
        "user_context": user_context,
        "synthesis": synthesis,
    }


class GuruAgent(BaseAgent):
    name = "guru_agent"

    def run(self, state: dict) -> dict:
        message = state.get("message", "Investment advice from financial gurus")
        msg_lower = message.lower()

        # Check if question is a genuine dilemma
        dilemma_indicators = ["should i", " vs ", " vs. ", " or "]
        if any(d in msg_lower for d in dilemma_indicators):
            comparison = compare_with_user_data(
                question=message,
                transactions_json=state.get("transactions_json"),
                goals_json=state.get("goals_json"),
            )
            state["answer"] = comparison.get("synthesis", "")
            state["viewpoints"] = comparison.get("viewpoints", [])
            state["user_context"] = comparison.get("user_context", {})
            state["synthesis"] = comparison.get("synthesis", "")
            state["metrics"] = {
                "viewpoints": comparison.get("viewpoints", []),
                "user_context": comparison.get("user_context", {}),
                "synthesis": comparison.get("synthesis", ""),
            }
            state["guru_perspectives"] = [
                {
                    "label": vp["source"],
                    "summary": vp["position"],
                    "reasoning": vp["position"],
                }
                for vp in comparison.get("viewpoints", [])
            ]
            state["citations"] = [vp["position"] for vp in comparison.get("viewpoints", [])]
            state.setdefault("agent_path", []).append(self.name)
            return state

        # Standard single or multi-perspective guru flow (Phase 4)
        chunks = search_domain(domain="guru_philosophy", query=message, top_k=3)
        retrieved_texts = [c["content"] for c in chunks if isinstance(c, dict) and "content" in c]

        # Determine if we have multiple distinguishable perspectives
        has_multiple_perspectives = False
        if len(retrieved_texts) >= 2:
            gurus = ["buffett", "munger", "bogle", "graham", "lynch", "dalio", "marks", "fisher"]
            found_gurus = set()
            for text in retrieved_texts:
                t_lower = text.lower()
                for g in gurus:
                    if g in t_lower:
                        found_gurus.add(g)
            if len(found_gurus) >= 2 or len(retrieved_texts) >= 3:
                has_multiple_perspectives = True

        if retrieved_texts and has_multiple_perspectives:
            context = "\n---\n".join(retrieved_texts)
            prompt = (
                "User Question: " + str(message) + "\n\n"
                "Retrieved Guru Philosophy Perspectives:\n" + str(context) + "\n\n"
                "Compare and synthesize the user's question across 2-3 different retrieved perspectives "
                "(e.g., contrasting value investing vs. low-cost index investing vs. margin of safety). "
                "Highlight key agreements and contrasts grounded in the retrieved content."
            )
            answer = generate(prompt, system="You are the Financial Guru Comparison Agent for FinSage AI.")
        elif retrieved_texts:
            context = "\n---\n".join(retrieved_texts)
            prompt = (
                "User Question: " + str(message) + "\n\n"
                "Retrieved Guru Wisdom:\n" + str(context) + "\n\n"
                "Answer the user's question with a single grounded response based directly on the retrieved guru philosophy above."
            )
            answer = generate(prompt, system="You are the Financial Guru Advisor Agent for FinSage AI.")
        else:
            prompt = (
                "User Question: " + str(message) + "\n\n"
                "Note: No custom knowledge entries are currently indexed in the 'guru_philosophy' domain.\n"
                "Provide a grounded answer reflecting classic investment principles from renowned figures like "
                "Warren Buffett, Charlie Munger, or John Bogle, and mention that domain-specific documents are not yet uploaded."
            )
            answer = generate(prompt, system="You are the Financial Guru Advisor Agent for FinSage AI.")

        state["answer"] = answer
        state["citations"] = retrieved_texts
        state["guru_perspectives"] = _build_guru_perspectives(retrieved_texts)
        state.setdefault("agent_path", []).append(self.name)
        return state

