# app/models/llm_runner.py
#
# Optimized: Groq API with JSON mode
# - 10-30× faster than local Llama 3B on MPS
# - JSON mode guarantees valid JSON output (no more parse failures)
# - 70B model produces dramatically better evaluations than 3B
# - Eliminates need for complex JSON extraction/retry logic

import json
from app.models.llm_loader import get_groq_client
from app.config import GROQ_LLM_MODEL


def run_llm(prompt: str, max_new_tokens: int = 1600) -> dict:
    """
    Run a prompt through Groq's LLM API and return parsed JSON.

    Uses JSON mode for guaranteed valid JSON output, eliminating the
    complex extract_valid_json_objects / _fix_and_load retry logic
    that was previously needed with the local 3B model.
    """
    client = get_groq_client()

    print(f"[LLM] Sending prompt to Groq ({GROQ_LLM_MODEL})...")

    response = client.chat.completions.create(
        model=GROQ_LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a precise evaluation assistant. "
                    "Always respond with valid JSON only. "
                    "Do not include any text outside the JSON object."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_tokens=max_new_tokens,
        temperature=0,
        response_format={"type": "json_object"},
    )

    raw_text = response.choices[0].message.content.strip()

    print(f"[LLM] Response received ({len(raw_text)} chars)")

    try:
        result = json.loads(raw_text)
    except json.JSONDecodeError as e:
        # Fallback: try to extract JSON from the response
        # (shouldn't happen with JSON mode, but defensive)
        print(f"[LLM][WARN] JSON parse failed: {e}")
        print(f"[LLM] Raw output: {raw_text[:500]}")
        from app.models.llm_utils import extract_valid_json_objects
        parsed = extract_valid_json_objects(raw_text)
        if parsed:
            result = parsed[-1]
        else:
            raise RuntimeError(
                "LLM output could not be parsed into valid JSON.\n"
                "Raw output:\n" + raw_text[-1000:]
            )

    print(f"[LLM] Parsed JSON keys: {list(result.keys())}")
    return result
