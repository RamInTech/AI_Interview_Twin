# app/audio/pitch_analysis.py

import numpy as np
import librosa

def analyze_pitch_dynamics(audio: np.ndarray, sr: int):
    try:
        f0, voiced_flag, _ = librosa.pyin(
            audio,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sr,
            frame_length=2048
        )

        voiced_f0 = f0[voiced_flag]
        voiced_ratio = float(np.mean(voiced_flag)) if len(voiced_flag) else 0.0

        if len(voiced_f0) < 10 or voiced_ratio < 0.25:
            return {
                "std_semitones": 0.0,
                "voiced_ratio": voiced_ratio,
                "monotone_score": 0.0,
                "is_monotone": False
            }

        ref_hz = max(np.mean(voiced_f0), 1e-3)
        semitones = 12.0 * np.log2(voiced_f0 / ref_hz)
        std_semitones = float(np.std(semitones))

        MONOTONE_CENTER = 2.5
        MONOTONE_LIMIT = 1.8

        monotone_score = np.clip(
            (MONOTONE_CENTER - std_semitones) / MONOTONE_CENTER,
            0.0,
            1.0
        )

        return {
            "std_semitones": std_semitones,
            "voiced_ratio": voiced_ratio,
            "monotone_score": monotone_score,
            "is_monotone": std_semitones < MONOTONE_LIMIT
        }

    except Exception:
        return {
            "std_semitones": 0.0,
            "voiced_ratio": 0.0,
            "monotone_score": 0.0,
            "is_monotone": False
        }
