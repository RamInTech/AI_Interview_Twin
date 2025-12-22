from dataclasses import dataclass
from app.schemas.tcs import TechnicalEvaluationResult
from app.schemas.placement import PlacementFeedback

@dataclass
class InterviewEvaluationResponse:
    transcript: str
    cs_score: float
    tcs: TechnicalEvaluationResult
    final_score: float
    placement_feedback: PlacementFeedback
