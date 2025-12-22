from dataclasses import dataclass
from typing import List, Dict

@dataclass
class TranscriptionResult:
    text: str
    segments: List[Dict]
    language: str
    duration: float
    num_segments: int
