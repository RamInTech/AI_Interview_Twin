from faster_whisper import WhisperModel
from app.schemas.transcription import TranscriptionResult
from app.utils.device import detect_device

_model = None

def transcribe_audio(path):
    global _model
    device = "cuda" if detect_device() == "cuda" else "cpu"
    if _model is None:
        _model = WhisperModel("medium", device=device)

    segments, info = _model.transcribe(path)
    segs = list(segments)
    text = "".join(s.text for s in segs)

    return TranscriptionResult(
        text=text,
        segments=[],
        language=info.language,
        duration=info.duration,
        num_segments=len(segs)
    )
