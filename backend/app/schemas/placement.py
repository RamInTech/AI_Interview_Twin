from dataclasses import dataclass
from typing import List

@dataclass
class PlacementFeedback:
    revised_answer: str
    lags: List[str]
    improvements: List[str]
    focus_areas: List[str]
