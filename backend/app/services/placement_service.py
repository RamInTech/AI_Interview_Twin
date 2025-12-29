# app/services/placement_service.py

from typing import List
from app.models.llm_runner import run_llm
from app.prompts.placement_prompt import build_placement_coaching_prompt


def run_placement_coaching_llm(
    transcript: str,
    question: str | List[str] | None = None
) -> dict:
    prompt = build_placement_coaching_prompt(question, transcript)
    return run_llm(prompt, max_new_tokens=1200)


def generate_placement_feedback(
    transcript: str,
    question: str | List[str] | None = None
) -> dict:

    raw = run_placement_coaching_llm(transcript, question)

    # ---- Safe list extraction (NON-DESTRUCTIVE) ----
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

        # What the candidate should improve (shown as badges)
        "top_improvements": top_improvements,

        # Where the candidate is currently weak
        "lags": placement["current_gaps"],

        # Structured coaching block (single source of truth)
        "placement_coaching": {
            "current_gaps": placement["current_gaps"],
            "actionable_improvements": placement["actionable_improvements"],
            "placement_focus": placement["placement_focus"]
        },

        # Used by frontend chips / focus section
        "focus_areas": placement["placement_focus"]
    }


