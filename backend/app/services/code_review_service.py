# app/services/code_review_service.py
#
# Coding round services: LLM problem generation and AI code review.
# Submission scores blend real test results (ground truth) with the
# LLM's quality review, weights from CODE_EXECUTION_CONFIG.

from typing import List

from app.config import CODE_EXECUTION_CONFIG
from app.models.llm_runner import run_llm
from app.prompts.coding_prompt import (
    build_code_review_prompt,
    build_coding_problem_prompt,
)


def generate_coding_problem(question: str, difficulty: str = "Medium") -> dict:
    """Turn an interview question into an auto-judgeable stdin/stdout problem."""
    print(f"[CODING] Generating problem for: {question[:80]}")

    raw = run_llm(build_coding_problem_prompt(question, difficulty), max_new_tokens=2200)

    def ensure_tests(value) -> List[dict]:
        if not isinstance(value, list):
            return []
        return [
            {
                "input": str(t.get("input", "")),
                "expected_output": str(t.get("expected_output", "")),
                **({"explanation": str(t["explanation"])} if t.get("explanation") else {}),
            }
            for t in value
            if isinstance(t, dict)
        ]

    problem = {
        "title": str(raw.get("title") or "Coding Problem"),
        "description": str(raw.get("description") or question),
        "difficulty": str(raw.get("difficulty") or difficulty),
        "input_format": str(raw.get("input_format") or ""),
        "output_format": str(raw.get("output_format") or ""),
        "constraints": raw.get("constraints") if isinstance(raw.get("constraints"), list) else [],
        "sample_tests": ensure_tests(raw.get("sample_tests")),
        "hidden_tests": ensure_tests(raw.get("hidden_tests")),
    }

    if not problem["sample_tests"]:
        raise RuntimeError(f"Problem generation returned no sample tests. Raw: {raw}")

    # Verify test cases by executing the LLM's reference solution: expected
    # outputs the model computed "in its head" are sometimes wrong or the
    # input is internally inconsistent. The reference's real output becomes
    # the ground truth. (The reference solution is never sent to the client.)
    reference = str(raw.get("reference_solution") or "").strip()
    if reference:
        problem = _verify_tests_with_reference(problem, reference)

    print(
        f"[CODING] Problem '{problem['title']}' => "
        f"{len(problem['sample_tests'])} sample, "
        f"{len(problem['hidden_tests'])} hidden tests"
    )
    return problem


def _verify_tests_with_reference(problem: dict, reference: str) -> dict:
    from app.services.code_execution_service import run_code, run_tests

    # If the reference itself doesn't run on the first sample, skip verification
    probe = run_code("python", reference, stdin=problem["sample_tests"][0]["input"])
    if not probe["success"]:
        print("[CODING][WARN] Reference solution failed to run; tests kept as-is")
        return problem

    def verify(tests: List[dict]) -> List[dict]:
        verified = []
        summary = run_tests("python", reference, tests)
        for test, result in zip(tests, summary["results"]):
            if result["passed"]:
                verified.append(test)
            elif result["actual_output"] and not result["stderr"]:
                # Reference ran fine but the LLM's expected output was wrong —
                # trust the executed reference
                print(f"[CODING] Corrected expected output for test: "
                      f"{test['input'][:40]!r}")
                verified.append({**test, "expected_output": result["actual_output"]})
            else:
                print(f"[CODING] Dropped unverifiable test: {test['input'][:40]!r}")
        return verified

    sample = verify(problem["sample_tests"])
    hidden = verify(problem["hidden_tests"])

    if sample:
        problem["sample_tests"] = sample
        problem["hidden_tests"] = hidden
    else:
        print("[CODING][WARN] No sample test survived verification; tests kept as-is")
    return problem


def review_code_submission(
    problem: dict,
    language: str,
    code: str,
    test_summary: dict,
) -> dict:
    """AI review of a submission + blended submission score."""
    print("[CODING] Running AI code review...")

    raw = run_llm(
        build_code_review_prompt(problem, language, code, test_summary),
        max_new_tokens=1400,
    )

    def ensure_list(value) -> List[str]:
        return [str(v) for v in value] if isinstance(value, list) else []

    review_score = max(0, min(int(raw.get("score", 0)), 100))
    complexity = raw.get("complexity") if isinstance(raw.get("complexity"), dict) else {}

    total = test_summary.get("total", 0)
    pass_pct = (test_summary.get("passed", 0) / total * 100.0) if total else 0.0

    cfg = CODE_EXECUTION_CONFIG
    submission_score = round(
        cfg["test_weight"] * pass_pct + cfg["review_weight"] * review_score, 1
    )

    evaluation = {
        "score": submission_score,
        "review_score": review_score,
        "test_pass_pct": round(pass_pct, 1),
        "verdict": str(raw.get("verdict") or "").strip(),
        "complexity": {
            "time": str(complexity.get("time") or "unknown"),
            "space": str(complexity.get("space") or "unknown"),
        },
        "algorithm_feedback": str(raw.get("algorithm_feedback") or "").strip(),
        "strengths": ensure_list(raw.get("strengths")),
        "issues": ensure_list(raw.get("issues")),
        "optimizations": ensure_list(raw.get("optimizations")),
    }

    print(f"[CODING] Submission score: {submission_score} "
          f"(tests {pass_pct:.0f}%, review {review_score})")
    return evaluation
