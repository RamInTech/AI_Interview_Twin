import librosa, numpy as np

def analyze_pitch_dynamics(audio, sr):
    try:
        f0, voiced, _ = librosa.pyin(audio, fmin=50, fmax=500, sr=sr)
        voiced_f0 = f0[voiced]
        if len(voiced_f0) < 10:
            return {"monotone_score": 0.0}
        semitones = 12 * np.log2(voiced_f0 / np.mean(voiced_f0))
        score = max(0.0, min(1.0, (2.5 - np.std(semitones)) / 2.5))
        return {"monotone_score": score}
    except Exception:
        return {"monotone_score": 0.0}
