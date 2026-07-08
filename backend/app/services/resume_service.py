# app/services/resume_service.py
#
# Resume parsing + resume-aware follow-up questions.
# Text extraction is local (utils.resume_parser); semantic structuring and
# question generation go through the existing Groq LLM runners.

from typing import List, Optional

from app.models.llm_runner import run_llm
from app.models.question_llm_runner import run_llm_question
from app.prompts.resume_prompt import (
    build_followup_prompt,
    build_resume_parse_prompt,
)
from app.utils.resume_parser import extract_resume_text

PROFILE_LIST_FIELDS = [
    "education", "experience", "projects", "skills", "technologies",
    "certifications", "achievements", "internships",
]


def parse_resume_file(path: str, filename: str | None = None) -> dict:
    """Extract text from an uploaded resume and structure it via LLM."""
    print(f"[RESUME] Parsing resume: {filename or path}")

    text = extract_resume_text(path, filename)
    print(f"[RESUME] Extracted {len(text)} chars of text")

    raw = run_llm(build_resume_parse_prompt(text), max_new_tokens=2000)

    # Normalize so downstream prompts can rely on the shape
    profile = {
        "name": str(raw.get("name") or ""),
        "summary": str(raw.get("summary") or ""),
    }
    for field in PROFILE_LIST_FIELDS:
        value = raw.get(field)
        profile[field] = value if isinstance(value, list) else []

    print(
        f"[RESUME] Parsed profile => "
        f"{len(profile['projects'])} projects, "
        f"{len(profile['skills'])} skills, "
        f"{len(profile['experience'])} roles"
    )
    return profile


def generate_followup_question(
    question: str,
    answer_transcript: Optional[str],
    resume_profile: Optional[dict],
    asked_questions: List[str],
) -> str:
    """Generate one contextual follow-up question (fast LLM)."""
    print("[FOLLOW-UP] Generating contextual follow-up question...")

    raw = run_llm_question(
        build_followup_prompt(
            question, answer_transcript, resume_profile, asked_questions
        ),
        max_new_tokens=200,
    )

    followup = str(raw.get("question") or "").strip()
    if not followup:
        raise RuntimeError(f"Follow-up LLM returned no question. Raw: {raw}")

    print(f"[FOLLOW-UP] => {followup}")
    return followup
