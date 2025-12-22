# app/services/question_service.py

from typing import List
from app.schemas.question import QuestionGenerationRequest
from app.prompts.question_prompt import build_question_generation_prompt
from app.models.llm_runner import run_llm

EXPECTED_COUNTS = {
    "HR": 6,
    "Technical": 8,
    "DSA": 7,
    "Coding": 5,
    "Communication": 5,
}


def generate_interview_questions(req: QuestionGenerationRequest) -> List[str]:
    """
    Generate all interview questions for the selected round.
    """
    prompt = build_question_generation_prompt(req)
    response = run_llm(prompt, max_new_tokens=512)

    if "questions" not in response or not isinstance(response["questions"], list):
        raise RuntimeError("LLM response missing 'questions' list")

    questions = [q.strip() for q in response["questions"] if str(q).strip()]

    expected = EXPECTED_COUNTS.get(req.interview_round)


    return questions


def generate_single_question(req: QuestionGenerationRequest) -> str:
    """
    Convenience helper for one-at-a-time questioning.
    """
    questions = generate_interview_questions(req)
    if not questions:
        raise RuntimeError("No questions generated")
    print("Hii")
    print(questions)
    return questions[0]
