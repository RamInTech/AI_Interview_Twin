# app/services/interview_analysis.py
#
# Optimized:
# 1. Parallel pitch analysis + transcription (saves ~3s)
# 2. Replaced DistilBERT sentiment (3-5s cold, 260 MB) with VADER (<10ms, <1 MB)
# 3. Groq Whisper API for transcription (2-5s vs 30-90s)

import concurrent.futures
from app.audio.audio_utils import load_audio_mono
from app.audio.pitch_analysis import analyze_pitch_dynamics
from app.audio.transcriber import transcribe_audio
from app.nlp.signals import detect_signals
from app.scoring.cs_engine import calculate_score

# -----------------------------
# Lightweight Sentiment (VADER)
# Replaces DistilBERT (66M params, 260 MB, 3-5s cold start)
# VADER: rule-based, <1 MB, <10ms inference
# Sufficient because sentiment only affects ±1.5–5 pts of final score
# -----------------------------
_vader_analyzer = None


def _get_vader():
    """Lazy-load VADER sentiment analyzer."""
    global _vader_analyzer
    if _vader_analyzer is None:
        try:
            from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
            _vader_analyzer = SentimentIntensityAnalyzer()
            print("[SENTIMENT] VADER loaded (<1 MB, <10ms inference)")
        except ImportError:
            print("[WARN] vaderSentiment not installed. Sentiment analysis disabled.")
            return None
    return _vader_analyzer


def _analyze_sentiment_vader(text: str):
    """
    Analyze sentiment using VADER (rule-based).
    Returns in the same format as the old DistilBERT pipeline
    so downstream scoring code needs no changes.
    """
    analyzer = _get_vader()
    if analyzer is None:
        return None

    # Sample text for consistency with previous behavior
    sample = _sample_text_for_sentiment(text)
    scores = analyzer.polarity_scores(sample)

    # Convert VADER output to match DistilBERT pipeline format:
    # [{"label": "POSITIVE"|"NEGATIVE", "score": float}]
    compound = scores["compound"]
    if compound >= 0.05:
        return [{"label": "POSITIVE", "score": min(abs(compound), 1.0)}]
    elif compound <= -0.05:
        return [{"label": "NEGATIVE", "score": min(abs(compound), 1.0)}]
    else:
        return [{"label": "NEUTRAL", "score": 1.0 - abs(compound)}]


def _sample_text_for_sentiment(text: str, max_len: int = 512) -> str:
    """Sample beginning + middle + end for fair sentiment."""
    if len(text) <= max_len:
        return text
    part = max_len // 3
    return text[:part] + text[len(text)//2 - part//2 : len(text)//2 + part//2] + text[-part:]


def run_cs_pipeline(audio_path: str):
    print(f"--- Analyzing {audio_path} ---")

    # 1. Load Audio
    print("Loading audio...")
    audio, sr = load_audio_mono(audio_path)

    # 2. Parallel: Pitch Analysis + Transcription
    #    These are independent operations — running them concurrently
    #    saves ~3 seconds (pitch runs "for free" during API call)
    print("Running pitch analysis and transcription in parallel...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        pitch_future = executor.submit(analyze_pitch_dynamics, audio, sr)
        transcribe_future = executor.submit(transcribe_audio, audio_path)

        pitch_data = pitch_future.result()
        tr = transcribe_future.result()

    if tr is None:
        print("[ERROR] Transcription failed. Whisper returned None.")
        raise RuntimeError("Transcription failed or empty")

    if not tr.text or not tr.text.strip():
        print("[ERROR] Empty transcription. Audio may be silent or corrupted.")
        raise RuntimeError("Transcription failed or empty")

    # Use effective spoken duration
    duration = tr.duration if tr.duration > 0 else len(audio) / sr

    # 3. Linguistic Signals
    print("Analyzing linguistic signals...")
    signals = detect_signals(tr.text, tr.segments)

    # 4. Sentiment (VADER — <10ms)
    sent_res = _analyze_sentiment_vader(tr.text)

    # 5. CS Score
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
