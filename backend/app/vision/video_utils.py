# app/vision/video_utils.py

import glob
import os
import shutil
import subprocess
import tempfile

import imageio_ffmpeg


def extract_frames(path: str, fps: float = 3.0, max_frames: int = 360):
    """
    Extract sampled frames from a video file as BGR numpy arrays.

    Uses the bundled ffmpeg binary (same fallback path as audio_utils) so
    MediaRecorder webm uploads decode reliably even when metadata is missing.
    Returns an empty list when the file has no decodable video stream
    (e.g. an audio-only upload), so callers can skip camera analysis.
    """
    try:
        import cv2
    except ImportError:
        print("[CPS][WARN] opencv-python not installed. Camera analysis disabled.")
        return []

    tmp_dir = tempfile.mkdtemp(prefix="cps-frames-")
    try:
        ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
        pattern = os.path.join(tmp_dir, "frame_%05d.jpg")
        proc = subprocess.run(
            [
                ffmpeg_bin, "-y", "-i", path,
                "-vf", f"fps={fps}",
                "-frames:v", str(max_frames),
                "-q:v", "3",
                pattern,
            ],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        if proc.returncode != 0:
            print("[CPS] No decodable video stream found. Skipping camera analysis.")
            return []

        frames = []
        for frame_path in sorted(glob.glob(os.path.join(tmp_dir, "frame_*.jpg"))):
            img = cv2.imread(frame_path)
            if img is not None:
                frames.append(img)
        return frames
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
