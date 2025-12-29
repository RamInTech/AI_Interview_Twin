# app/schemas/tcs.py

from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class TechnicalEvaluationResult:
    score: int
    band: str
    verdict: str

    issues: List[str] = field(default_factory=list)
    improvement_points: List[str] = field(default_factory=list)

    conceptual_score: Optional[int] = None
    specificity_score: Optional[int] = None
    confidence_score: Optional[int] = None
