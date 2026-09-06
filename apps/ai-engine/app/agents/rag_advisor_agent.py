"""RAGAdvisorAgent: Retrieves domain knowledge and provides grounded financial advice."""
from app.agents.base_agent import BaseAgent
from app.rag.domains import route_to_domain
from app.rag.ingest import search_domain
from app.services.llm_client import generate


class RAGAdvisorAgent(BaseAgent):
    name = "rag_advisor_agent"

    def run(self, state: dict) -> dict:
        message = state.get("message", "")
        domain = state.get("domain") or route_to_domain(message)

        chunks = search_domain(domain=domain, query=message, top_k=3)
        retrieved_texts = [c["content"] for c in chunks]

        context = "\n---\n".join(retrieved_texts) if retrieved_texts else "No matching knowledge base entries found."

        prompt = (
            "User Question: " + str(message) + "\n\n"
            "Retrieved Financial Advice Knowledge (" + str(domain) + "):\n" + str(context) + "\n\n"
            "Answer the user's question accurately, directly grounding your advice in the retrieved knowledge above."
        )
        answer = generate(prompt, system="You are the RAG Financial Advisor Agent for FinSage AI.")

        state["answer"] = answer
        state["citations"] = retrieved_texts
        state.setdefault("agent_path", []).append(self.name)
        return state
