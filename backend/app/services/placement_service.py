# app/services/placement_service.py

import json
from typing import List
from app.models.llm_runner import run_llm
from app.prompts.placement_prompt import build_placement_coaching_prompt


def run_placement_coaching_llm(
    transcript: str,
    question: str | List[str] | None = None
) -> dict:
    print("[COACH] Running placement coaching...")

    prompt = build_placement_coaching_prompt(question, transcript)
    output = run_llm(prompt, max_new_tokens=1200)

    print("\n[COACH] Raw LLM output:")
    print(json.dumps(output, indent=2, default=str))

    return output


def generate_placement_feedback(
    transcript: str,
    question: str | List[str] | None = None
) -> dict:

    raw = run_placement_coaching_llm(transcript, question)

    # Safe list extraction (NON-DESTRUCTIVE)
    def ensure_list(value, fallback):
        if isinstance(value, list) and len(value) > 0:
            return value
        return [fallback]

    standout_strengths = ensure_list(
        raw.get("standout_strengths"),
        "Shows basic engagement during the interview"
    )

    top_improvements = ensure_list(
        raw.get("top_improvements"),
        "Needs more structured and confident explanations"
    )

    # Normalize placement coaching
    placement_raw = raw.get("placement_coaching", {})

    placement = {
        "current_gaps": ensure_list(
            placement_raw.get("current_gaps"),
            "Lacks depth or clarity in some responses"
        ),
        "actionable_improvements": ensure_list(
            placement_raw.get("actionable_improvements"),
            "Practice explaining answers step-by-step with examples"
        ),
        "placement_focus": ensure_list(
            placement_raw.get("placement_focus"),
            "Focus on communication clarity and interview readiness"
        ),
    }

    return {
        "standout_strengths": standout_strengths,
        "top_improvements": top_improvements,
        "improvements": top_improvements,
        "lags": placement["current_gaps"],
        "placement_coaching": placement,
        "focus_areas": placement["placement_focus"],
    }
