"""Tax advice tools wrapping deterministic calculations and RAG-grounded insights."""
from typing import Any, Dict, Optional
from langchain_core.tools import tool
from app.rag.ingest import search_domain
from app.services.llm_client import generate

try:
    from app.analytics.tax_calculator import calculate_tax_savings
except ImportError:
    # Dependency: Kavya's app/analytics/tax_calculator.py (pending merge)
    def calculate_tax_savings(income: float, current_80c_investments: float = 0.0) -> Dict[str, Any]:
        """Deterministic tax savings calculation under Section 80C of the Indian Income Tax Act.
        Section 80C deduction cap is Rs 1,50,000.
        """
        max_80c = 150000.0
        current_invested = min(max_80c, max(0.0, float(current_80c_investments or 0.0)))
        remaining_80c = max(0.0, max_80c - current_invested)

        inc = float(income or 0.0)
        if inc > 1500000:
            marginal_rate = 0.30
        elif inc > 1000000:
            marginal_rate = 0.20
        elif inc > 700000:
            marginal_rate = 0.10
        elif inc > 500000:
            marginal_rate = 0.05
        else:
            marginal_rate = 0.0

        potential_savings = round(remaining_80c * marginal_rate, 2)

        return {
            "income": inc,
            "current_80c_investments": current_invested,
            "max_80c_limit": max_80c,
            "remaining_80c_limit": remaining_80c,
            "potential_tax_savings": potential_savings,
            "marginal_tax_rate": marginal_rate,
            "eligible_80c_options": ["PPF", "ELSS", "EPF", "Tax-Saver FD", "NPS (Tier 1)"],
        }


@tool
def get_tax_savings_advice(income: float, current_80c_investments: float = 0.0) -> Dict[str, Any]:
    """Calculates deterministic tax savings under Indian tax regime (Section 80C)
    and provides a RAG-grounded explanation based on verified Indian tax knowledge.
    """
    raw_numbers = calculate_tax_savings(income=income, current_80c_investments=current_80c_investments)

    # Ground explanation using search_domain against indian_tax_finance
    search_query = "Section 80C tax deduction PPF ELSS tax regime savings"
    chunks = search_domain(domain="indian_tax_finance", query=search_query, top_k=3)
    retrieved_texts = [c["content"] for c in chunks if isinstance(c, dict) and "content" in c]
    context = "\n---\n".join(retrieved_texts) if retrieved_texts else "Section 80C offers deductions up to Rs 1.5 Lakh via PPF and ELSS."

    inc = raw_numbers.get("income", income)
    curr_80c = raw_numbers.get("current_80c_investments", current_80c_investments)
    rem_80c = raw_numbers.get("remaining_80c_limit", max(0.0, 150000.0 - float(curr_80c)))
    pot_savings = raw_numbers.get("potential_tax_savings", 0.0)

    prompt = (
        f"User Annual Income: Rs {inc:,.2f}\n"
        f"Current Section 80C Investments: Rs {curr_80c:,.2f}\n"
        f"Remaining Section 80C Room: Rs {rem_80c:,.2f}\n"
        f"Potential Tax Savings: Rs {pot_savings:,.2f}\n\n"
        f"Retrieved Tax Knowledge:\n{context}\n\n"
        "Explain these tax-saving numbers in 2-3 clear, grounded sentences. "
        "Reference available options such as PPF (for guaranteed returns and 15-year lock-in) "
        "and ELSS (for market returns with shortest 3-year lock-in) to utilize the remaining Section 80C room. "
        "Do not alter or recalculate the figures."
    )
    explanation = generate(prompt, system="You are the Indian Tax & Finance Advisor for FinSage AI.")

    return {
        "raw_numbers": raw_numbers,
        "explanation": explanation,
        "income": inc,
        "current_80c_investments": curr_80c,
        "remaining_80c_limit": rem_80c,
        "potential_tax_savings": pot_savings,
        "citations": retrieved_texts,
    }
