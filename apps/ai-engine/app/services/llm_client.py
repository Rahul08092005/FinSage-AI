"""Provider-agnostic LLM wrapper with robust fallback."""
import os

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")


def generate(prompt: str, system: str | None = None) -> str:
    """Calls whichever LLM provider is configured and returns plain text.
    Falls back gracefully to mock responses if API keys or libraries are unavailable.
    """
    if LLM_PROVIDER == "groq":
        return _call_groq(prompt, system)
    elif LLM_PROVIDER == "gemini":
        return _call_gemini(prompt, system)
    return "[mock response] " + str(prompt)[:120]


def _call_groq(prompt: str, system: str | None) -> str:
    from groq import Groq

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "[mock groq response — set GROQ_API_KEY in .env to go live] " + str(prompt)[:120]

    try:
        client = Groq(api_key=api_key)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        model = os.getenv("GROQ_MODEL", "groq/compound-mini")
        candidate_models = [model, "openai/gpt-oss-20b", "llama-3.1-8b-instant"]
        for m in candidate_models:
            try:
                completion = client.chat.completions.create(
                    model=m,
                    messages=messages,
                )
                return completion.choices[0].message.content
            except Exception:
                continue

        return "I am analyzing your financial records. Please ensure your transactions and budget goals are recorded."
    except Exception:
        return "[mock groq fallback response] " + str(prompt)[:120]


def _call_gemini(prompt: str, system: str | None) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "[mock gemini response — set GEMINI_API_KEY in .env to go live] " + str(prompt)[:120]

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        response = model.generate_content(full_prompt)
        return response.text
    except Exception:
        return "[mock gemini fallback response] " + str(prompt)[:120]
