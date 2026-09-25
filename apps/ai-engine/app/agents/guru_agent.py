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


class GuruAgent(BaseAgent):
    name = "guru_agent"

    def run(self, state: dict) -> dict:
        message = state.get("message", "Investment advice from financial gurus")

        chunks = search_domain(domain="guru_philosophy", query=message, top_k=3)
        retrieved_texts = [c["content"] for c in chunks if isinstance(c, dict) and "content" in c]

        # Determine if we have multiple distinguishable perspectives
        has_multiple_perspectives = False
        if len(retrieved_texts) >= 2:
            # Check for mentions of multiple distinct investors/approaches
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

