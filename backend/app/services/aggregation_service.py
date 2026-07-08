# app/services/aggregation_service.py

from typing import Optional

from app.config import FINAL_SCORE_WEIGHTS
from app.schemas.tcs import TechnicalEvaluationResult


def combine_scores(
    cs_score: float,
    tcs: TechnicalEvaluationResult,
    cps_score: Optional[float] = None,
    coding_score: Optional[float] = None,
) -> float:
    """
    Weighted fusion of Communication, Technical, Camera Presence and
    Coding scores. Absent optional components redistribute their weight:
    no video -> CPS weight folds back into CS; no coding submissions ->
    the CS/TCS/CPS weights are used unscaled. This keeps audio-only runs
    bit-identical to the original CS/TCS fusion.
    """
    w = FINAL_SCORE_WEIGHTS

    cs_w = w["cs"] + (w["cps"] if cps_score is None else 0.0)
    cps_w = 0.0 if cps_score is None else w["cps"]
    tcs_w = w["tcs"]

    weighted = cs_w * cs_score + tcs_w * tcs.score + cps_w * (cps_score or 0.0)

    if coding_score is not None:
        final_score = (1.0 - w["coding"]) * weighted + w["coding"] * coding_score
    else:
        final_score = weighted

    # Interview realism constraints
    if tcs.band == "Poor":
        final_score = min(final_score, 45.0)
    elif tcs.band == "Weak":
        final_score = min(final_score, 60.0)
    elif tcs.band == "Partial":
        final_score = min(final_score, 82.0)

    # Absolute realism bounds
    components = [cs_score, float(tcs.score)]
    if cps_score is not None:
        components.append(cps_score)
    if coding_score is not None:
        components.append(coding_score)
    final_score = min(final_score, max(components))
    final_score = min(final_score, 95.0)
    final_score = max(final_score, 0.0)

    return round(final_score, 1)


def combine_cs_tcs(cs_score: float, tcs: TechnicalEvaluationResult) -> float:
    # Backwards-compatible audio-only fusion
    return combine_scores(cs_score, tcs)
