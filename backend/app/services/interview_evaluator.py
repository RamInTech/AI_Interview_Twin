# app/services/interview_evaluator.py

from typing import List
from app.services.interview_analysis import run_cs_pipeline
from app.services.tcs_service import compute_tcs
from app.services.aggregation_service import combine_cs_tcs
from app.services.placement_service import generate_placement_feedback


def evaluate_interview(
    audio_path: str,
    questions: List[str]
) -> dict:

    # 1. Communication Score
    cs_out = run_cs_pipeline(audio_path)

    transcript = cs_out["transcript"]
    cs_score = cs_out["cs_score"]
    cs_result = cs_out.get("cs_result")
    cs_metrics = cs_result.metrics if cs_result else {}
    cs_feedback = cs_result.feedback if cs_result else []

    # 2. Technical Correctness
    tcs = compute_tcs(transcript, questions)

    # 3. Final Score
    final_score = combine_cs_tcs(cs_score, tcs)

    # 4. Placement Coaching
    placement = generate_placement_feedback(transcript, questions)

    return {
        "transcript": transcript,
        "cs_score": cs_score,
        "cs_metrics": cs_metrics,
        "cs_feedback": cs_feedback,
        "tcs_score": tcs.score,
        "tcs_band": tcs.band,
        "tcs_verdict": tcs.verdict,
        "tcs_issues": tcs.issues,
        "tcs_improvements": tcs.improvement_points,
        "coaching_feedback": tcs.improvement_points,
        "final_score": final_score,
        "placement_feedback": placement
    }
