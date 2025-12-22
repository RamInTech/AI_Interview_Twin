from pydantic import BaseModel

class QuestionGenerationRequest(BaseModel):
    role: str
    experience: str
    company_type: str
    interview_round: str
