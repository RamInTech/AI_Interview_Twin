from app.audio.audio_utils import load_audio_mono
from app.audio.pitch_analysis import analyze_pitch_dynamics
from app.audio.transcriber import transcribe_audio
from app.nlp.signals import detect_signals
from app.scoring.cs_engine import calculate_score

def run_cs_pipeline(audio_path):
    audio, sr = load_audio_mono(audio_path)
    pitch = analyze_pitch_dynamics(audio, sr)
    tr = transcribe_audio(audio_path)
    signals = detect_signals(tr.text, tr.segments)
    cs = calculate_score(tr.text, tr.duration, signals, pitch)

    return {"transcript": tr.text, "cs_score": cs.total_score}
