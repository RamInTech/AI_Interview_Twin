# app/api/coding.py
#
# Coding/DSA round endpoints: problem generation, run, submit.

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.code_execution_service import run_code, run_tests
from app.services.code_review_service import (
    generate_coding_problem,
    review_code_submission,
)

router = APIRouter(prefix="/api/interview/code")


class CodingProblemRequest(BaseModel):
    question: str
    difficulty: str = "Medium"


class TestCase(BaseModel):
    input: str = ""
    expected_output: str = ""
    explanation: Optional[str] = None


class RunCodeRequest(BaseModel):
    language: str
    code: str
    stdin: str = ""
    tests: Optional[List[TestCase]] = None


class SubmitCodeRequest(BaseModel):
    language: str
    code: str
    problem: dict  # full problem from /problem (includes hidden_tests)


@router.post("/problem")
async def coding_problem_endpoint(request: CodingProblemRequest):
    if not request.question.strip():
        raise HTTPException(status_code=422, detail="question must not be empty")
    return generate_coding_problem(request.question, request.difficulty)


@router.post("/run")
async def run_code_endpoint(request: RunCodeRequest):
    """
    Run: execute against the provided sample tests (if any) and/or once
    with custom stdin. Nothing is scored or recorded.
    """
    response: dict = {}

    if request.tests:
        response["test_run"] = run_tests(
            request.language,
            request.code,
            [t.model_dump() for t in request.tests],
        )

    if request.stdin or not request.tests:
        response["execution"] = run_code(
            request.language, request.code, stdin=request.stdin
        )

    return response


@router.post("/submit")
async def submit_code_endpoint(request: SubmitCodeRequest):
    """
    Submit: judge against sample + hidden tests, then AI-review the code.
    The frontend records the returned submission in the interview session.
    """
    sample = request.problem.get("sample_tests") or []
    hidden = request.problem.get("hidden_tests") or []
    all_tests = list(sample) + list(hidden)
    if not all_tests:
        raise HTTPException(status_code=422, detail="problem contains no test cases")

    summary = run_tests(request.language, request.code, all_tests)

    # Hide hidden-test inputs/outputs in the response; report pass/fail only
    hidden_start = len(sample)
    for i, result in enumerate(summary["results"]):
        if i >= hidden_start:
            result["hidden"] = True
            result["input"] = ""
            result["expected_output"] = ""
            result["actual_output"] = ""
        else:
            result["hidden"] = False

    evaluation = review_code_submission(
        request.problem, request.language, request.code, summary
    )

    return {
        "problem_title": request.problem.get("title", ""),
        "language": request.language,
        "test_summary": summary,
        "evaluation": evaluation,
    }
