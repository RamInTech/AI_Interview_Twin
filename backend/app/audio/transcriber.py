# app/audio/transcriber.py

from typing import List, Dict
from faster_whisper import WhisperModel
from app.schemas.transcription import TranscriptionResult
from app.utils.device import detect_device

_WHISPER_MODEL = None  # cached


def transcribe_audio(audio_path: str, model_size: str = "medium") -> TranscriptionResult:
    global _WHISPER_MODEL

    device = detect_device()

    # faster-whisper does NOT support MPS
    whisper_device = "cuda" if device == "cuda" else "cpu"
    compute_type = "float16" if whisper_device == "cuda" else "int8"

    if _WHISPER_MODEL is None:
        _WHISPER_MODEL = WhisperModel(
            model_size,
            device=whisper_device,
            compute_type=compute_type
        )

    segments_gen, info = _WHISPER_MODEL.transcribe(
        audio_path,
        beam_size=5,
        word_timestamps=True,
        vad_filter=True
    )

    segments = list(segments_gen)
    text = "".join(s.text for s in segments).strip()

    seg_list = []
    all_words = []

    for s in segments:
        words = []
        for w in (s.words or []):
            words.append({
                "start": float(w.start),
                "end": float(w.end),
                "word": w.word
            })
            all_words.append(w)

        seg_list.append({
            "start": float(s.start),
            "end": float(s.end),
            "text": s.text,
            "words": words
        })

    duration = (
        float(all_words[-1].end - all_words[0].start)
        if all_words else 0.0
    )

    return TranscriptionResult(
        text=text,
        segments=seg_list,
        language=info.language,
        duration=duration,
        num_segments=len(segments)
    )
