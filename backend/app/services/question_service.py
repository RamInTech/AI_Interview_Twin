# app/services/question_service.py

from typing import List, Dict
from app.schemas.question import QuestionGenerationRequest
from app.prompts.question_prompt import build_question_generation_prompt
from app.prompts.resume_prompt import build_personalized_question_prompt
from app.models.question_llm_runner import run_llm_question
from app.models.llm_runner import run_llm


DEFAULT_COUNTS = {
    "HR": 6,
    "Technical": 8,
    "DSA": 7,
    "Coding": 5,
    "Communication": 5,
}

# Kept for backwards compatibility with older imports
EXPECTED_COUNTS = DEFAULT_COUNTS

MIN_QUESTIONS = 3
MAX_QUESTIONS = 15


def resolve_question_count(req: QuestionGenerationRequest) -> int:
    """Candidate-chosen count (clamped) or the round's default."""
    if req.num_questions:
        return max(MIN_QUESTIONS, min(int(req.num_questions), MAX_QUESTIONS))
    return DEFAULT_COUNTS.get(req.interview_round, 6)


def generate_interview_questions(req: QuestionGenerationRequest) -> List[str]:
    count = resolve_question_count(req)

    if req.resume_profile:
        # Personalized questions must stay grounded in real resume facts,
        # so use the high-quality 70B model instead of the fast 8B one
        print(f"[Q-GEN] Resume profile provided — blending resume + role questions ({count})")
        response: Dict = run_llm(
            build_personalized_question_prompt(req, req.resume_profile, count),
            max_new_tokens=1400,
        )
    else:
        response: Dict = run_llm_question(
            build_question_generation_prompt(req, count),
            max_new_tokens=1024,
        )

    if "questions" not in response:
        raise RuntimeError("LLM response missing 'questions' field")

    if not isinstance(response["questions"], list):
        raise RuntimeError("'questions' must be a list")

    # Models occasionally wrap items as objects ({"question": "...", ...})
    # instead of plain strings — accept both
    def normalize(q) -> str:
        if isinstance(q, dict):
            for key in ("question", "text", "prompt", "title"):
                if isinstance(q.get(key), str) and q[key].strip():
                    return q[key].strip()
            return ""
        return str(q).strip()

    questions = [nq for q in response["questions"] if (nq := normalize(q))]

    if len(questions) > count:
        questions = questions[:count]
    elif len(questions) < count:
        raise RuntimeError(
            f"Expected {count} questions for {req.interview_round} round, "
            f"got {len(questions)}. Raw: {response}"
        )

    return questions


def generate_interview_question(req: QuestionGenerationRequest) -> str:
    questions = generate_interview_questions(req)
    if not questions:
        raise RuntimeError("No questions returned by LLM")
    return questions[0]
