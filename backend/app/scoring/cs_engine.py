from dataclasses import dataclass

@dataclass
class InterviewScore:
    total_score: float
    metrics: dict
    feedback: list

def calculate_score(transcript, duration, signals, pitch, sentiment=None):
    score = 100 - signals["filler_count"] * 2 - pitch["monotone_score"] * 10
    return InterviewScore(score, signals, [])
