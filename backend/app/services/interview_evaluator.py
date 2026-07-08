# app/services/interview_evaluator.py

import concurrent.futures
import os
from dataclasses import asdict
from typing import List, Optional
from app.services.interview_analysis import run_cs_pipeline
from app.services.camera_presence_service import run_cps_pipeline
from app.services.tcs_service import compute_tcs
from app.services.aggregation_service import combine_scores
from app.services.placement_service import generate_placement_feedback
from app.utils.text_format import pretty_print_transcript


def evaluate_interview(
    audio_path: str,
    questions: List[str],
    code_submissions: Optional[List[dict]] = None
) -> dict:

    print("\n" + "=" * 50)
    print("STARTING INTERVIEW EVALUATION")
    print("=" * 50)
    print(f"Recording: {os.path.basename(audio_path)}")
    print(f"Questions: {questions}")
    print(f"Code submissions: {len(code_submissions or [])}")

    # ============================
    # 1. Communication Score + Camera Presence (parallel)
    #    Both read the same uploaded recording and are independent,
    #    so the video analysis runs "for free" during transcription.
    # ============================
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        cs_future = executor.submit(run_cs_pipeline, audio_path)
        cps_future = executor.submit(run_cps_pipeline, audio_path)

        cs_out = cs_future.result()
        cps_out = cps_future.result()

    transcript = cs_out["transcript"]
    cs_score = cs_out["cs_score"]
    cs_result = cs_out.get("cs_result")
    cs_metrics = cs_result.metrics if cs_result else {}
    cs_feedback = cs_result.feedback if cs_result else []

    cps_result = cps_out["cps_result"] if cps_out else None
    cps_score = cps_out["cps_score"] if cps_out else None

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
    # 2. Camera Presence Report
    # ============================
    print("\n" + "=" * 45)
    print("=== CAMERA PRESENCE (CPS) ===")
    print("=" * 45)
    if cps_result:
        print(f"CPS Score     : {cps_result.overall_score}")
        print(f"Classification: {cps_result.classification}")

        print("\n--- CPS Metric Scores ---")
        for k, v in cps_result.metric_scores.items():
            print(f"  {k}: {v:.1f}")

        print("\n--- CPS Observations ---")
        for metric, obs in cps_result.observations.items():
            print(f"  [{metric}] {obs}")

        print("\n--- CPS Coaching ---")
        for tip in cps_result.coaching_suggestions:
            print(f"  - {tip}")
    else:
        print("  No video track detected. Camera presence analysis skipped.")

    # ============================
    # 3. Sequential LLM Evaluation (TCS & Placement)
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
    # 4. Coding Performance (from recorded /code/submit results)
    # ============================
    coding_score = None
    if code_submissions:
        scores = [
            float(s["evaluation"]["score"])
            for s in code_submissions
            if isinstance(s.get("evaluation"), dict)
            and isinstance(s["evaluation"].get("score"), (int, float))
        ]
        if scores:
            coding_score = round(sum(scores) / len(scores), 1)

        print("\n" + "=" * 45)
        print("CODING PERFORMANCE")
        print("=" * 45)
        print(f"Submissions   : {len(code_submissions)}")
        print(f"Coding Score  : {coding_score}")
        for s in code_submissions:
            summary = s.get("test_summary", {})
            print(
                f"  - {s.get('problem_title', 'Problem')} ({s.get('language', '?')}): "
                f"{summary.get('passed', 0)}/{summary.get('total', 0)} tests"
            )

    # ============================
    # 5. Final Score
    # ============================
    final_score = combine_scores(cs_score, tcs, cps_score, coding_score)

    print("\n" + "=" * 45)
    print("FINAL INTERVIEW SCORE")
    print("=" * 45)
    print(f"  {final_score}")

    # ============================
    # 5. Placement Coaching Results
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

    overall_assessment = build_overall_assessment(
        final_score, cs_score, cs_feedback, tcs, cps_result,
        coding_score, code_submissions
    )

    return {
        "transcript": transcript,
        "cs_score": cs_score,
        "cs_metrics": cs_metrics,
        "cs_feedback": cs_feedback,
        "camera_presence": asdict(cps_result) if cps_result else None,
        "cps_score": cps_score,
        "coding_score": coding_score,
        "code_submissions": code_submissions or [],
        "tcs_score": tcs.score,
        "tcs_band": tcs.band,
        "tcs_verdict": tcs.verdict,
        "tcs_issues": tcs.issues,
        "tcs_improvements": tcs.improvement_points,
        "coaching_feedback": tcs.improvement_points,
        "final_score": final_score,
        "overall_assessment": overall_assessment,
        "placement_feedback": placement
    }


def build_overall_assessment(
    final_score: float,
    cs_score: float,
    cs_feedback: List[str],
    tcs,
    cps_result,
    coding_score: Optional[float] = None,
    code_submissions: Optional[List[dict]] = None
) -> dict:
    """
    Unified, interview-ready view fusing Communication, Camera Presence,
    Coding and Technical evaluation into one summary + recommendation set.
    """
    readiness = (
        "interview-ready" if final_score >= 80
        else "close to interview-ready" if final_score >= 60
        else "not yet interview-ready"
    )

    parts = [
        f"Overall performance: {final_score:.0f}/100 — {readiness}.",
        f"Communication scored {cs_score:.0f}/100 and technical correctness "
        f"{tcs.score}/100 ({tcs.band}).",
    ]
    if cps_result:
        parts.append(
            f"On-camera presence scored {cps_result.overall_score:.0f}/100 "
            f"({cps_result.classification}). {cps_result.summary}"
        )
    else:
        parts.append(
            "Camera presence was not assessed (no video track in the recording)."
        )
    if coding_score is not None:
        total = len(code_submissions or [])
        parts.append(
            f"Coding performance scored {coding_score:.0f}/100 across "
            f"{total} submission{'s' if total != 1 else ''}."
        )

    coding_recs: List[str] = []
    for s in (code_submissions or []):
        evaluation = s.get("evaluation") or {}
        coding_recs.extend(evaluation.get("optimizations", [])[:1])

    recommendations = (
        cs_feedback[:2]
        + tcs.improvement_points[:2]
        + (cps_result.coaching_suggestions[:2] if cps_result else [])
        + coding_recs[:2]
    )

    return {
        "performance_summary": " ".join(parts),
        "score_breakdown": {
            "communication": cs_score,
            "technical": tcs.score,
            "camera_presence": cps_result.overall_score if cps_result else None,
            "coding": coding_score,
            "final": final_score,
        },
        "recommendations": recommendations,
    }
