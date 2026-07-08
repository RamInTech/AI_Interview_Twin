# app/schemas/cps.py

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class CameraPresenceResult:
    overall_score: float
    classification: str  # Excellent | Good | Fair | Needs Improvement

    metric_scores: Dict[str, float] = field(default_factory=dict)
    strengths: List[str] = field(default_factory=list)
    improvements: List[str] = field(default_factory=list)
    observations: Dict[str, str] = field(default_factory=dict)
    coaching_suggestions: List[str] = field(default_factory=list)
    summary: str = ""

    # Raw per-video measurements (visibility ratios, movement energy, etc.)
    metrics_raw: Dict = field(default_factory=dict)
