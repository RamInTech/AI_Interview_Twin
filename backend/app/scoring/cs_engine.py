# app/scoring/cs_engine.py

from typing import Dict, List
from app.schemas.cs import InterviewScore

def calculate_score(
    transcript: str,
    duration: float,
    signals: Dict,
    pitch_data: Dict,
    sentiment_res
) -> InterviewScore:

    score = 100.0
    feedback = []
    duration_min = max(duration / 60.0, 1.0)

    # 1. CONFIDENCE (HEDGING)
    hedges_per_min = signals["hedge_count"] / duration_min
    if hedges_per_min > 1.0:
        score -= min((hedges_per_min - 1.0) * 4.0, 22.0)
        feedback.append(f"Hedging detected ({hedges_per_min:.1f}/min). Be more decisive.")

    if signals["apology_count"] > 0:
        score -= signals["apology_count"] * 4.0
        feedback.append("Avoid apologizing or underselling yourself.")

    # 2. OWNERSHIP vs PASSIVE
    own_rate = signals["own_count"] / duration_min
    passive_rate = signals["passive_count"] / duration_min

    if own_rate > passive_rate + 0.5:
        score += min((own_rate - passive_rate) * 2.0, 8.0)
        feedback.append("Good ownership language detected.")
    elif passive_rate > own_rate + 1.0:
        score -= 5.0
        feedback.append("Excessive passive voice. Use active language.")

    # 3. DELIVERY
    fillers_per_min = signals["filler_count"] / duration_min
    if fillers_per_min > 3.0:
        score -= min((fillers_per_min - 3.0) * 2.0, 15.0)
        feedback.append(f"High filler usage ({fillers_per_min:.1f}/min).")

    pauses_per_min = signals["long_pauses"] / duration_min
    if pauses_per_min > 2.0:
        score -= min((pauses_per_min - 2.0) * 1.5, 8.0)
        feedback.append("Frequent long pauses detected.")

    wpm = (len(transcript.split()) / duration) * 60 if duration > 0 else 0
    if wpm < 115:
        score -= min((115 - wpm) * 0.2, 10.0)
        feedback.append(f"Pace is slow ({wpm:.0f} WPM).")
    elif wpm > 155:
        score -= min((wpm - 155) * 0.4, 15.0)
        feedback.append(f"Pace is fast ({wpm:.0f} WPM). Slow down.")

    if signals["long_speech_blocks"] > 0:
        score -= min(signals["long_speech_blocks"] * 4.0, 10.0)
        feedback.append("Break long explanations with pauses.")

    # 4. VOICE MODULATION
    monotone_score = pitch_data.get("monotone_score", 0.0)
    if monotone_score > 0.6:
        score -= monotone_score * 8.0
        feedback.append("Voice sounds monotone. Add variation.")

    # 5. SENTIMENT (POLISH ONLY)
    if sentiment_res:
        label = sentiment_res[0]["label"]
        conf = sentiment_res[0]["score"]

        if label == "POSITIVE" and conf > 0.9:
            score += 1.5
            feedback.append("Positive tone.")
        elif label == "NEGATIVE" and conf > 0.9:
            score -= 5.0
            feedback.append("Tone sounds uncertain.")

    # 6. CONFIDENCE CEILING
    if hedges_per_min > 2.0:
        score = min(score, 78.0)

    # Final clamp
    score = max(0.0, min(score, 95.0))

    return InterviewScore(
        total_score=score,
        metrics={
            **signals,
            "wpm": wpm,
            "fillers_per_min": fillers_per_min,
            "monotone_score": monotone_score,
        },
        feedback=feedback,
    )
