# app/vision/face_analysis.py
#
# Per-frame behavioral signal extraction for Camera Presence Analysis.
#
# Detector backend: OpenCV Haar cascades (face / eye / smile).
# Chosen over MediaPipe FaceMesh because it installs on any Python version
# (MediaPipe has no 3.13 wheels) and adds no heavy dependencies.
# The extractor is isolated behind analyze_frames(), so a landmark-based
# backend (gaze vectors, blink EAR, brow tension) can replace it later
# without touching the scoring engine.

from typing import Dict, List, Optional

import numpy as np

# -----------------------------
# Lazy-loaded Haar cascade detectors (same pattern as VADER in
# interview_analysis: load once, keep as module singleton)
# -----------------------------
_detectors = None


def _get_detectors():
    """Lazy-load OpenCV Haar cascade detectors."""
    global _detectors
    if _detectors is None:
        try:
            import cv2
            base = cv2.data.haarcascades
            _detectors = {
                "cv2": cv2,
                "face": cv2.CascadeClassifier(base + "haarcascade_frontalface_default.xml"),
                "eye": cv2.CascadeClassifier(base + "haarcascade_eye.xml"),
                "smile": cv2.CascadeClassifier(base + "haarcascade_smile.xml"),
            }
            print("[CPS] OpenCV Haar detectors loaded (face/eye/smile)")
        except ImportError:
            print("[CPS][WARN] opencv-python not installed. Camera analysis disabled.")
            return None
    return _detectors


def _analyze_single_frame(frame, detectors) -> Dict:
    """
    Detect the dominant face in one frame and extract normalized signals:
    face presence, center position, relative size, eye visibility, smile.
    """
    cv2 = detectors["cv2"]
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    frame_h, frame_w = gray.shape[:2]

    faces = detectors["face"].detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5,
        minSize=(int(frame_w * 0.1), int(frame_h * 0.1)),
    )
    if len(faces) == 0:
        return {"face": False}

    # Largest face = the candidate
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    face_roi = gray[y:y + h, x:x + w]

    # Eyes live in the upper half of the face box
    eye_roi = face_roi[: int(h * 0.6), :]
    eyes = detectors["eye"].detectMultiScale(
        eye_roi, scaleFactor=1.1, minNeighbors=4,
        minSize=(int(w * 0.10), int(w * 0.10)),
    )

    # Smile lives in the lower half; high minNeighbors to avoid false positives
    smile_roi = face_roi[int(h * 0.5):, :]
    smiles = detectors["smile"].detectMultiScale(
        smile_roi, scaleFactor=1.6, minNeighbors=18,
        minSize=(int(w * 0.3), int(h * 0.15)),
    )

    return {
        "face": True,
        "cx": (x + w / 2.0) / frame_w,
        "cy": (y + h / 2.0) / frame_h,
        "size": w / frame_w,
        "eyes_visible": len(eyes) >= 1,
        "smiling": len(smiles) >= 1,
    }


def _smooth_flags(flags: List[bool], window: int = 3) -> List[bool]:
    """Majority-vote smoothing over a sliding window of boolean flags."""
    if len(flags) < window:
        return flags
    half = window // 2
    return [
        sum(flags[max(0, i - half): i + half + 1]) * 2
        > len(flags[max(0, i - half): i + half + 1])
        for i in range(len(flags))
    ]


def analyze_frames(frames: List, fps: float) -> Optional[Dict]:
    """
    Run face analysis over sampled frames and aggregate into video-level
    behavioral signals consumed by scoring.cps_engine.calculate_presence_score.
    """
    detectors = _get_detectors()
    if detectors is None or not frames:
        return None

    records = [_analyze_single_frame(f, detectors) for f in frames]

    total = len(records)
    duration_s = total / fps if fps > 0 else float(total)
    duration_min = max(duration_s / 60.0, 1.0 / 60.0)

    face_records = [r for r in records if r["face"]]
    face_ratio = len(face_records) / total

    if not face_records:
        return {
            "frames_analyzed": total,
            "duration_s": round(duration_s, 1),
            "face_visibility_ratio": 0.0,
        }

    cxs = np.array([r["cx"] for r in face_records])
    cys = np.array([r["cy"] for r in face_records])
    sizes = np.array([r["size"] for r in face_records])

    # Framing: how far the face sits from horizontal center, and how much
    # the position wanders over time
    horizontal_offset_mean = float(np.mean(np.abs(cxs - 0.5)))
    center_offset_std = float(np.std(np.sqrt((cxs - np.mean(cxs)) ** 2 + (cys - np.mean(cys)) ** 2)))

    # Movement energy: mean face-center displacement per second between
    # consecutive face frames (fidgeting / rocking / restlessness proxy)
    displacements = []
    prev = None
    for r in records:
        if r["face"]:
            if prev is not None:
                displacements.append(
                    float(np.hypot(r["cx"] - prev["cx"], r["cy"] - prev["cy"]))
                )
            prev = r
        else:
            prev = None
    movement_energy = float(np.mean(displacements) * fps) if displacements else 0.0

    # Leaning in/out of frame (face size variability)
    size_variability = float(np.std(sizes) / np.mean(sizes)) if np.mean(sizes) > 0 else 0.0

    # Eye visibility & gaze shifts (transitions in eye visibility while
    # the face is on screen: looking away / down at notes / closing eyes).
    # 3-frame majority smoothing suppresses single-frame detector flicker
    # so only sustained gaze changes count as shifts.
    eyes_flags = _smooth_flags([r["eyes_visible"] for r in face_records])
    eyes_visible_ratio = sum(eyes_flags) / len(eyes_flags)
    gaze_shifts = sum(1 for a, b in zip(eyes_flags, eyes_flags[1:]) if a != b)
    gaze_shift_rate = gaze_shifts / duration_min

    # Face leaving the frame entirely (turning away, ducking out)
    face_flags = [r["face"] for r in records]
    face_lost_events = sum(1 for a, b in zip(face_flags, face_flags[1:]) if a and not b)
    face_lost_per_min = face_lost_events / duration_min

    smile_ratio = sum(1 for r in face_records if r["smiling"]) / len(face_records)

    return {
        "frames_analyzed": total,
        "duration_s": round(duration_s, 1),
        "face_visibility_ratio": round(face_ratio, 3),
        "eyes_visible_ratio": round(eyes_visible_ratio, 3),
        "gaze_shift_rate": round(gaze_shift_rate, 2),
        "smile_ratio": round(smile_ratio, 3),
        "horizontal_offset_mean": round(horizontal_offset_mean, 3),
        "center_offset_std": round(center_offset_std, 3),
        "movement_energy": round(movement_energy, 4),
        "size_variability": round(size_variability, 3),
        "face_lost_per_min": round(face_lost_per_min, 2),
    }
