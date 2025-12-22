from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from app.services.interview_evaluator import evaluate_interview
from app.services.question_service import generate_interview_questions
from app.schemas.question import QuestionGenerationRequest

router = APIRouter(prefix="/api/interview")

class GenerateQuestionsRequest(BaseModel):
    role: str
    experience: str
    company_type: str
    interview_round: str

@router.post("/generate-questions")
async def generate_questions_endpoint(request: GenerateQuestionsRequest):
    req = QuestionGenerationRequest(
        role=request.role,
        experience=request.experience,
        company_type=request.company_type,
        interview_round=request.interview_round
    )
    questions = generate_interview_questions(req)
    return {"questions": questions}

@router.post("/evaluate")
async def evaluate(audio: UploadFile = File(...), questions: str = Form(...)):
    path = f"/tmp/{audio.filename}"
    with open(path, "wb") as f:
        f.write(await audio.read())

    return evaluate_interview(path, questions)
