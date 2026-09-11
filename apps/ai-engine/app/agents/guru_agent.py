"""GuruAgent: Compares investment philosophies from legendary investors or provides grounded advice."""
from app.agents.base_agent import BaseAgent
from app.rag.ingest import search_domain
from app.services.llm_client import generate


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
        state.setdefault("agent_path", []).append(self.name)
        return state
