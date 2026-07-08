from dataclasses import dataclass, field
from typing import Optional

@dataclass
class QuestionGenerationRequest:
    role: str
    experience: str
    company_type: str
    interview_round: str

    # Optional structured resume profile (services.resume_service) —
    # when present, questions blend resume-grounded and standard
    # role/round questions.
    resume_profile: Optional[dict] = field(default=None)

    # Optional overrides chosen by the candidate before the interview
    num_questions: Optional[int] = field(default=None)
    difficulty: Optional[str] = field(default=None)  # Easy | Medium | Hard
