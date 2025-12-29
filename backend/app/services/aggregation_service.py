# app/services/aggregation_service.py

from app.schemas.tcs import TechnicalEvaluationResult

def combine_cs_tcs(cs_score: float, tcs: TechnicalEvaluationResult) -> float:
    final_score = 0.6 * cs_score + 0.4 * tcs.score

    if tcs.band == "Poor":
        final_score = min(final_score, 45.0)
    elif tcs.band == "Weak":
        final_score = min(final_score, 60.0)
    elif tcs.band == "Partial":
        final_score = min(final_score, 82.0)

    final_score = min(final_score, max(cs_score, tcs.score))
    final_score = min(final_score, 95.0)
    final_score = max(final_score, 0.0)

    return round(final_score, 1)
