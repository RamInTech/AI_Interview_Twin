# app/services/interview_evaluator.py

import os
from typing import List
from app.services.interview_analysis import run_cs_pipeline
from app.services.tcs_service import compute_tcs
from app.services.aggregation_service import combine_cs_tcs
from app.services.placement_service import generate_placement_feedback
from app.utils.text_format import pretty_print_transcript


def evaluate_interview(
    audio_path: str,
    questions: List[str]
) -> dict:

    print("\n" + "=" * 50)
    print("STARTING INTERVIEW EVALUATION")
    print("=" * 50)
    print(f"Audio: {os.path.basename(audio_path)}")
    print(f"Questions: {questions}")

    # ============================
    # 1. Communication Score
    # ============================
    cs_out = run_cs_pipeline(audio_path)

    transcript = cs_out["transcript"]
    cs_score = cs_out["cs_score"]
    cs_result = cs_out.get("cs_result")
    cs_metrics = cs_result.metrics if cs_result else {}
    cs_feedback = cs_result.feedback if cs_result else []

    print("\n" + "=" * 45)
    print("=== COMMUNICATION SCORE (CS) ===")
    print("=" * 45)
    print(f"CS Score      : {cs_score}")

    print("\n--- CS Feedback ---")
    for f in cs_feedback:
        print(f"  [ ] {f}")

    print("\n--- CS Detailed Metrics ---")
    for k, v in cs_metrics.items():
        if isinstance(v, float):
            print(f"  {k}: {v:.2f}")
        else:
            print(f"  {k}: {v}")

    print("\n--- TRANSCRIPT ---")
    pretty_print_transcript(transcript)
    print("--- END TRANSCRIPT ---")

    # ============================
    # 2. Sequential LLM Evaluation (TCS & Placement)
    # ============================
    print("\n[SYSTEM] Dispatching TCS and Placement LLM prompts sequentially...")
    
    tcs = compute_tcs(transcript, questions)
    placement = generate_placement_feedback(transcript, questions)

    print("\n" + "=" * 45)
    print("TECHNICAL CORRECTNESS (TCS)")
    print("=" * 45)
    print(f"Score : {tcs.score}")
    print(f"Band  : {tcs.band}")

    print("\nVerdict:")
    print(f"  {tcs.verdict}")

    print("\nIssues Identified:")
    for issue in tcs.issues:
        print(f"  - {issue}")

    print("\n" + "=" * 45)
    print("COACHING FEEDBACK")
    print("=" * 45)
    for point in tcs.improvement_points:
        print(f"  - {point}")

    # ============================
    # 3. Final Score
    # ============================
    final_score = combine_cs_tcs(cs_score, tcs)

    print("\n" + "=" * 45)
    print("FINAL INTERVIEW SCORE")
    print("=" * 45)
    print(f"  {final_score}")

    # ============================
    # 4. Placement Coaching Results
    # ============================

    print("\n" + "=" * 45)
    print("PLACEMENT COACHING")
    print("=" * 45)

    print("\nStandout Strengths:")
    for s in placement.get("standout_strengths", []):
        print(f"  - {s}")

    print("\nTop Improvements:")
    for i in placement.get("top_improvements", []):
        print(f"  - {i}")

    coaching = placement.get("placement_coaching", {})

    print("\nWhere the candidate currently lags:")
    for g in coaching.get("current_gaps", []):
        print(f"  - {g}")

    print("\nWhat should be improved next:")
    for a in coaching.get("actionable_improvements", []):
        print(f"  - {a}")

    print("\nAreas to focus for placements:")
    for f in coaching.get("placement_focus", []):
        print(f"  - {f}")

    print("\n" + "=" * 50)
    print("EVALUATION COMPLETE")
    print("=" * 50 + "\n")

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
