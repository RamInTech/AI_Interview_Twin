from dataclasses import dataclass
from typing import List

@dataclass
class TechnicalEvaluationResult:
    score: int
    band: str
    verdict: str
    issues: List[str]
    improvement_points: List[str]
