# app/scoring/cps_engine.py
#
# Camera Presence Score (CPS) engine.
# Converts video-level behavioral signals (vision.face_analysis) into
# per-metric scores, evidence-based observations and coaching feedback.
# Rule-based and deterministic, same philosophy as cs_engine.

from typing import Dict

from app.config import CAMERA_PRESENCE_CONFIG
from app.schemas.cps import CameraPresenceResult

METRIC_LABELS = {
    "confidence": "Confidence",
    "facial_expressions": "Facial Expressions",
    "eye_contact": "Eye Contact",
    "head_posture": "Head Pose & Posture",
    "engagement": "Engagement",
    "composure": "Composure (Anxiety Control)",
}


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def classify_presence(score: float) -> str:
    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 55:
        return "Fair"
    return "Needs Improvement"


def calculate_presence_score(signals: Dict) -> CameraPresenceResult:
    face_ratio = signals.get("face_visibility_ratio", 0.0)
    eyes_ratio = signals.get("eyes_visible_ratio", 0.0)
    gaze_shift_rate = signals.get("gaze_shift_rate", 0.0)
    smile_ratio = signals.get("smile_ratio", 0.0)
    offset_mean = signals.get("horizontal_offset_mean", 0.0)
    offset_std = signals.get("center_offset_std", 0.0)
    movement = signals.get("movement_energy", 0.0)
    size_var = signals.get("size_variability", 0.0)
    face_lost = signals.get("face_lost_per_min", 0.0)

    observations: Dict[str, str] = {}
    strengths = []
    improvements = []
    suggestions = []

    # 1. EYE CONTACT
    eye_contact = eyes_ratio * 100.0
    if gaze_shift_rate > 6.0:
        eye_contact -= min((gaze_shift_rate - 6.0) * 2.0, 20.0)
    eye_contact = _clamp(eye_contact)
    observations["eye_contact"] = (
        f"Eyes were directed toward the camera in {eyes_ratio * 100:.0f}% of sampled "
        f"frames, with {gaze_shift_rate:.1f} gaze shifts per minute."
    )
    if eye_contact >= 80:
        strengths.append("Consistent eye contact with the camera.")
    elif eye_contact < 60:
        improvements.append("Eye contact was inconsistent (frequent looking away or down).")
        suggestions.append(
            "Place the question notes near your webcam and practice speaking to the "
            "lens, not the screen, to hold steady eye contact."
        )

    # 2. HEAD POSE & POSTURE
    head_posture = 100.0
    if offset_mean > 0.12:
        head_posture -= min((offset_mean - 0.12) * 250.0, 25.0)
        observations.setdefault(
            "head_posture",
            f"Face sat noticeably off-center (average horizontal offset "
            f"{offset_mean * 100:.0f}% of frame width).",
        )
    if size_var > 0.15:
        head_posture -= min((size_var - 0.15) * 150.0, 20.0)
        observations.setdefault(
            "head_posture",
            f"Frequent leaning toward/away from the camera detected "
            f"(face size varied by {size_var * 100:.0f}%).",
        )
    if offset_std > 0.08:
        head_posture -= min((offset_std - 0.08) * 200.0, 20.0)
    head_posture = _clamp(head_posture)
    observations.setdefault(
        "head_posture",
        "Head position stayed centered and stable throughout the answer.",
    )
    if head_posture >= 80:
        strengths.append("Stable, well-centered posture on camera.")
    elif head_posture < 60:
        improvements.append("Posture drifted or swayed noticeably during the answer.")
        suggestions.append(
            "Sit with your face centered and roughly one arm's length from the "
            "camera; keep both feet planted to reduce swaying."
        )

    # 3. COMPOSURE (inverse of visible anxiety/nervousness)
    composure = 100.0
    if movement > 0.05:
        composure -= min((movement - 0.05) * 400.0, 30.0)
    if gaze_shift_rate > 4.0:
        composure -= min((gaze_shift_rate - 4.0) * 3.0, 25.0)
    if face_lost > 1.0:
        composure -= min((face_lost - 1.0) * 6.0, 20.0)
    composure = _clamp(composure)
    observations["composure"] = (
        f"Movement energy {movement:.3f}/s, {gaze_shift_rate:.1f} gaze shifts/min, "
        f"face left the frame {face_lost:.1f} times/min."
    )
    if composure >= 80:
        strengths.append("Calm, settled presence with no visible restlessness.")
    elif composure < 60:
        improvements.append(
            "Signs of nervousness detected (restless movement or frequent gaze shifts)."
        )
        suggestions.append(
            "Before answering, take one slow breath and plant your posture — "
            "deliberate stillness reads as confidence on camera."
        )

    # 4. FACIAL EXPRESSIONS
    expressions = 60.0
    if smile_ratio >= 0.05:
        expressions += min(smile_ratio * 100.0, 25.0)
        observations["facial_expressions"] = (
            f"Positive expressions (smiles) appeared in {smile_ratio * 100:.0f}% "
            f"of sampled frames."
        )
    else:
        expressions -= 5.0
        observations["facial_expressions"] = (
            "Expression stayed largely neutral/flat with little visible warmth."
        )
        improvements.append("Facial expression remained flat for most of the answer.")
        suggestions.append(
            "Open with a brief smile and let your face react naturally while "
            "speaking — it signals enthusiasm and keeps the interviewer engaged."
        )
    expressions = _clamp(expressions)
    if expressions >= 80:
        strengths.append("Warm, expressive delivery on camera.")

    # 5. ENGAGEMENT & ATTENTIVENESS
    engagement = face_ratio * 70.0
    engagement += min(smile_ratio * 60.0, 15.0)
    # A little natural animation reads as attentive; total stillness or
    # constant motion does not
    engagement += 15.0 if 0.005 <= movement <= 0.05 else 5.0
    engagement = _clamp(engagement)
    observations["engagement"] = (
        f"Candidate was on camera for {face_ratio * 100:.0f}% of the answer."
    )
    if engagement >= 80:
        strengths.append("Fully present and attentive on camera.")
    elif engagement < 60:
        improvements.append("Presence on camera was inconsistent or disengaged.")
        suggestions.append(
            "Stay in frame for the full answer and keep your attention on the "
            "camera as you would on an interviewer's face."
        )

    # 6. CONFIDENCE (composite of the visual signals above)
    confidence = _clamp(
        0.35 * eye_contact + 0.25 * composure + 0.20 * head_posture + 0.20 * engagement
    )
    observations["confidence"] = (
        f"Derived from eye contact ({eye_contact:.0f}), composure ({composure:.0f}), "
        f"posture ({head_posture:.0f}) and engagement ({engagement:.0f})."
    )
    if confidence >= 80:
        strengths.append("Projects strong on-camera confidence.")
    elif confidence < 60:
        improvements.append("Overall on-camera confidence appeared low.")

    metric_scores = {
        "confidence": round(confidence, 1),
        "facial_expressions": round(expressions, 1),
        "eye_contact": round(eye_contact, 1),
        "head_posture": round(head_posture, 1),
        "engagement": round(engagement, 1),
        "composure": round(composure, 1),
    }

    weights = CAMERA_PRESENCE_CONFIG["metric_weights"]
    overall = _clamp(sum(metric_scores[m] * w for m, w in weights.items()))
    classification = classify_presence(overall)

    if not strengths:
        strengths.append("Shows willingness to stay on camera during the interview.")
    if not improvements:
        improvements.append("Maintain this level of on-camera presence in longer answers.")
    if not suggestions:
        suggestions.append(
            "Record a mock answer and review your own video with the sound off — "
            "it quickly reveals posture and expression habits."
        )

    weakest = min(metric_scores, key=metric_scores.get)
    summary = (
        f"Camera presence is rated {classification.lower()} "
        f"({overall:.0f}/100). Strongest visual signal: "
        f"{METRIC_LABELS[max(metric_scores, key=metric_scores.get)].lower()}; "
        f"biggest opportunity: {METRIC_LABELS[weakest].lower()}."
    )

    return CameraPresenceResult(
        overall_score=round(overall, 1),
        classification=classification,
        metric_scores=metric_scores,
        strengths=strengths,
        improvements=improvements,
        observations=observations,
        coaching_suggestions=suggestions,
        summary=summary,
        metrics_raw=signals,
    )
