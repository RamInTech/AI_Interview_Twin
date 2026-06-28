# app/models/llm_loader.py
#
# Optimized: Groq API client (replaces local Llama 3.2 3B)
# - 10-30× faster inference via Groq LPU (300-800 tok/s)
# - Access to 70B model (dramatically better quality than 3B)
# - Zero local GPU/RAM usage (frees 6.5 GB)
# - Reusable connection-pooled HTTP client

from typing import Optional
from groq import Groq
from app.config import GROQ_API_KEY

_groq_client: Optional[Groq] = None


def get_groq_client() -> Groq:
    """
    Return a shared Groq API client (connection-pooled).
    Replaces the old load_tcs_model() which loaded a 6.5 GB local LLM.
    """
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=GROQ_API_KEY)
        print("[LLM] Groq API client initialized (no local model loaded)")
    return _groq_client
