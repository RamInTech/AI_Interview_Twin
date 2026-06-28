# app/schemas/cs.py

from dataclasses import dataclass
from typing import Dict, List

@dataclass
class InterviewScore:
    total_score: float
    metrics: Dict
    feedback: List[str]
