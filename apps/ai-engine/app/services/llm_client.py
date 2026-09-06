<<<<<<< HEAD
"""Provider-agnostic LLM wrapper with mock fallback."""
=======
"""Person 2 (Rahul) owns this file.

A tiny provider-agnostic wrapper so the rest of the codebase never imports
Groq or Gemini directly — just call `generate()`. Switch providers by
changing LLM_PROVIDER in .env, no code changes needed elsewhere.
"""
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
import os

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")


def generate(prompt: str, system: str | None = None) -> str:
    """Calls whichever LLM provider is configured and returns plain text.
<<<<<<< HEAD
    Falls back gracefully to mock responses if API keys or libraries are unavailable.
=======

    Phase 1: used only by the Supervisor Agent's placeholder response.
    Phase 3+: this becomes the shared call for every LangGraph node.
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
    """
    if LLM_PROVIDER == "groq":
        return _call_groq(prompt, system)
    elif LLM_PROVIDER == "gemini":
        return _call_gemini(prompt, system)
<<<<<<< HEAD
    return "[mock response] " + str(prompt)[:120]


def _call_groq(prompt: str, system: str | None) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "[mock groq response — set GROQ_API_KEY in .env to go live] " + str(prompt)[:120]

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
        )
        return completion.choices[0].message.content
    except Exception as e:
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
    except Exception as e:
        return "[mock gemini fallback response] " + str(prompt)[:120]
=======
    raise ValueError(f"Unknown LLM_PROVIDER: {LLM_PROVIDER}")


def _call_groq(prompt: str, system: str | None) -> str:
    from groq import Groq

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "[mock groq response — set GROQ_API_KEY in .env to go live] " + prompt[:120]

    client = Groq(api_key=api_key)
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
    )
    return completion.choices[0].message.content


def _call_gemini(prompt: str, system: str | None) -> str:
    import google.generativeai as genai

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "[mock gemini response — set GEMINI_API_KEY in .env to go live] " + prompt[:120]

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    response = model.generate_content(full_prompt)
    return response.text
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
