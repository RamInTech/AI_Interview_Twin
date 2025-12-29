# app/services/tcs_service.py

from typing import List
from app.prompts.tcs_prompt import build_tcs_prompt
from app.schemas.tcs import TechnicalEvaluationResult
from app.models.llm_runner import run_llm


def bucket_tcs(score: int) -> str:
    if score >= 85:
        return "Excellent"
    elif score >= 75:
        return "Good"
    elif score >= 60:
        return "Partial"
    elif score >= 35:
        return "Weak"
    return "Poor"


def run_tcs_llm(
    transcript: str,
    question: str | List[str] | None = None
) -> dict:

    if question is None:
        question = "Explain your approach to this problem."

    return run_llm(
        build_tcs_prompt(question, transcript),
        max_new_tokens=1600
    )


def compute_tcs(
    transcript: str,
    question: str | List[str] | None = None
) -> TechnicalEvaluationResult:

    raw = run_tcs_llm(transcript, question)

    if "score" not in raw:
        raise RuntimeError(f"TCS output missing 'score'. Raw response: {raw}")

    score = max(0, min(int(raw["score"]), 100))
    band = bucket_tcs(score)
    verdict = raw.get("verdict", "").strip()

    issues = raw.get("issues")
    if not isinstance(issues, list) or not issues:
        issues = ["No major technical issues identified."]

    improvements = raw.get("improvement_points")
    if not isinstance(improvements, list) or not improvements:
        improvements = [
            "Improve clarity and specificity while explaining technical decisions."
        ]

    return TechnicalEvaluationResult(
        score=score,
        band=band,
        verdict=verdict,
        issues=issues,
        improvement_points=improvements
    )
