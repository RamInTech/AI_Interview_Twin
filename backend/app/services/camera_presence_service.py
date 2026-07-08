# app/services/camera_presence_service.py
#
# Camera Presence (CPS) pipeline: video frames -> behavioral signals -> score.
# Runs on the same uploaded webm the CS pipeline transcribes (the frontend
# recorder captures audio + video in one file). Designed to degrade
# gracefully: any failure or an audio-only upload yields None so the
# audio/LLM evaluation is never blocked by video analysis.

from typing import Optional

from app.config import CAMERA_PRESENCE_CONFIG
from app.scoring.cps_engine import calculate_presence_score
from app.vision.face_analysis import analyze_frames
from app.vision.video_utils import extract_frames


def run_cps_pipeline(video_path: str) -> Optional[dict]:
    try:
        cfg = CAMERA_PRESENCE_CONFIG
        print(f"--- Camera presence analysis: {video_path} ---")

        frames = extract_frames(
            video_path,
            fps=cfg["sample_fps"],
            max_frames=cfg["max_frames"],
        )
        if len(frames) < cfg["min_frames_required"]:
            print(f"[CPS] Only {len(frames)} frames extracted. Skipping camera analysis.")
            return None

        signals = analyze_frames(frames, fps=cfg["sample_fps"])
        if signals is None:
            return None

        print(f"[CPS] Signals: {signals}")

        cps_result = calculate_presence_score(signals)
        print(
            f"[CPS] Score: {cps_result.overall_score} "
            f"({cps_result.classification})"
        )

        return {
            "cps_score": cps_result.overall_score,
            "cps_result": cps_result,
        }
    except Exception as e:
        # Video analysis must never break the audio/LLM evaluation path
        print(f"[CPS][WARN] Camera presence analysis failed: {e}")
        return None
