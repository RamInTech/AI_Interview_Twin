# app/services/interview_analysis.py

from app.audio.audio_utils import load_audio_mono
from app.audio.pitch_analysis import analyze_pitch_dynamics
from app.audio.transcriber import transcribe_audio
from app.nlp.signals import detect_signals
from app.scoring.cs_engine import calculate_score
from transformers import pipeline

_SENT_PIPE = None
_PIPELINE_AVAILABLE = True

def _sample_text_for_sentiment(text: str, max_len: int = 512) -> str:
    if len(text) <= max_len:
        return text
    part = max_len // 3
    return text[:part] + text[len(text)//2 - part//2 : len(text)//2 + part//2] + text[-part:]


def run_cs_pipeline(audio_path: str):
    audio, sr = load_audio_mono(audio_path)
    pitch_data = analyze_pitch_dynamics(audio, sr)

    tr = transcribe_audio(audio_path)
    if not tr or not tr.text.strip():
        raise RuntimeError("Transcription failed or empty")

    duration = tr.duration if tr.duration > 0 else len(audio) / sr
    signals = detect_signals(tr.text, tr.segments)

    sent_res = None
    global _SENT_PIPE
    if _PIPELINE_AVAILABLE:
        if _SENT_PIPE is None:
            _SENT_PIPE = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1
            )
        sent_res = _SENT_PIPE(_sample_text_for_sentiment(tr.text))

    cs_result = calculate_score(
        transcript=tr.text,
        duration=duration,
        signals=signals,
        pitch_data=pitch_data,
        sentiment_res=sent_res
    )

    return {
        "transcript": tr.text,
        "cs_score": cs_result.total_score,
        "cs_result": cs_result
    }
