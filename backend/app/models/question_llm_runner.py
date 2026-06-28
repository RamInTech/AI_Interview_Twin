# app/models/question_llm_runner.py
#
# Optimized: Groq API with fast 8B model for question generation
# - Uses llama-3.1-8b-instant (fastest available) for simple generation tasks
# - JSON mode guarantees valid output
# - 0.5-1.5s per call vs 10-30s with local 3B model

import json
from typing import Dict
from app.models.llm_loader import get_groq_client
from app.config import GROQ_LLM_FAST_MODEL


def run_llm_question(prompt: str, max_new_tokens: int = 512) -> Dict:
    """
    Generate interview questions via Groq's fast LLM.

    Uses the 8B instant model since question generation is a simpler task
    that doesn't need the full 70B model. This makes it ~2× faster than
    even the standard Groq LLM call.
    """
    client = get_groq_client()

    print(f"[Q-GEN] Generating questions via Groq ({GROQ_LLM_FAST_MODEL})...")

    response = client.chat.completions.create(
        model=GROQ_LLM_FAST_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional interviewer. "
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
        temperature=0.7,  # Slight creativity for diverse questions
        response_format={"type": "json_object"},
    )

    raw_text = response.choices[0].message.content.strip()

    print(f"[Q-GEN] Response received ({len(raw_text)} chars)")

    try:
        result = json.loads(raw_text)
    except json.JSONDecodeError as e:
        # Fallback: defensive extraction
        print(f"[Q-GEN][WARN] JSON parse failed: {e}")
        print(f"[Q-GEN] Raw output: {raw_text[:500]}")
        from app.models.llm_utils import extract_valid_json_objects
        parsed = extract_valid_json_objects(raw_text)
        if parsed:
            result = parsed[-1]
        else:
            raise RuntimeError(
                "Question LLM returned invalid JSON.\n"
                "Raw output:\n" + raw_text
            )

    print(f"[Q-GEN] Parsed JSON keys: {list(result.keys())}")
    return result
