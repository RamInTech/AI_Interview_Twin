# app/services/question_service.py

from typing import List, Dict
from app.schemas.question import QuestionGenerationRequest
from app.prompts.question_prompt import build_question_generation_prompt
from app.models.question_llm_runner import run_llm_question


EXPECTED_COUNTS = {
    "HR": 6,
    "Technical": 8,
    "DSA": 7,
    "Coding": 5,
    "Communication": 5,
}


def generate_interview_questions(req: QuestionGenerationRequest) -> List[str]:
    response: Dict = run_llm_question(
        build_question_generation_prompt(req),
        max_new_tokens=512
    )

    if "questions" not in response:
        raise RuntimeError("LLM response missing 'questions' field")

    if not isinstance(response["questions"], list):
        raise RuntimeError("'questions' must be a list")

    questions = [str(q).strip() for q in response["questions"] if str(q).strip()]

    expected = EXPECTED_COUNTS.get(req.interview_round)
    if expected:
        if len(questions) > expected:
            questions = questions[:expected]
        elif len(questions) < expected:
            raise RuntimeError(
                f"Expected {expected} questions for {req.interview_round} round, "
                f"got {len(questions)}. Raw: {response}"
            )

    return questions


def generate_interview_question(req: QuestionGenerationRequest) -> str:
    questions = generate_interview_questions(req)
    if not questions:
        raise RuntimeError("No questions returned by LLM")
    return questions[0]
