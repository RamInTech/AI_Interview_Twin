from dataclasses import dataclass

@dataclass
class QuestionGenerationRequest:
    role: str
    experience: str
    company_type: str
    interview_round: str
