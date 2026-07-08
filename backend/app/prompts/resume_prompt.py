# app/prompts/resume_prompt.py

import json


def build_resume_parse_prompt(resume_text: str) -> str:
    # Cap resume text so the prompt stays well inside model context
    resume_text = resume_text[:12000]

    return f"""
You are a precise resume parser for a technical interview platform.

Extract structured information from the resume below. Only include facts
that are actually present in the resume — never invent details. Use empty
lists for missing sections.

RESUME TEXT:
---
{resume_text}
---

CRITICAL OUTPUT CONTRACT:
- Output ONLY one valid JSON object.
- Do NOT add any text before or after the JSON.

MANDATORY JSON FORMAT:
{{
  "name": "candidate name or empty string",
  "summary": "1-2 sentence professional summary of the candidate",
  "education": [
    {{"degree": "...", "institution": "...", "year": "..."}}
  ],
  "experience": [
    {{"title": "...", "company": "...", "duration": "...", "highlights": ["..."]}}
  ],
  "projects": [
    {{"name": "...", "description": "...", "technologies": ["..."], "highlights": ["..."]}}
  ],
  "skills": ["skill_1", "skill_2"],
  "technologies": ["tech_1", "tech_2"],
  "certifications": ["..."],
  "achievements": ["..."],
  "internships": [
    {{"title": "...", "company": "...", "duration": "...", "highlights": ["..."]}}
  ]
}}

Return the JSON now and stop.
""".strip()


def _profile_context(resume_profile: dict, max_chars: int = 4000) -> str:
    """Compact resume profile into a prompt-friendly JSON block."""
    compact = {
        k: v for k, v in resume_profile.items()
        if v and k in (
            "name", "summary", "education", "experience", "projects",
            "skills", "technologies", "certifications", "achievements",
            "internships",
        )
    }
    return json.dumps(compact, ensure_ascii=False)[:max_chars]


def build_personalized_question_prompt(req, resume_profile: dict, count: int) -> str:
    from app.prompts.question_prompt import build_round_rules

    resume_count = count // 2
    general_count = count - resume_count

    if req.interview_round in ("DSA", "Coding"):
        # Algorithmic rounds: the resume only biases topics/domains — every
        # question must still be a proper LeetCode-style problem
        blend_rules = f"""
BLEND RULES:
- ALL {count} questions must be proper algorithmic problems per the round
  style rules above — never "tell me about your project" questions.
- Use the resume only as flavor: bias problem domains toward the candidate's
  background (e.g. rate limiting, event streams, appointment scheduling for a
  backend candidate), while keeping each one a real DSA problem.
""".strip()
    else:
        blend_rules = f"""
BLEND RULES (mix resume-based and standard questions):
- EXACTLY {resume_count} questions grounded in the candidate's ACTUAL resume:
  their projects, technologies, internships, work experience, certifications
  and achievements — referencing them BY NAME (architecture and design
  decisions, tech stack choices, challenges and solutions, scalability,
  security, deployment, individual contribution).
- EXACTLY {general_count} standard {req.interview_round} questions for a
  {req.experience} {req.role} that do NOT depend on the resume — the kind any
  candidate for this role would face.
- Interleave the two kinds naturally; do not group them.
- Do not repeat or trivially rephrase any question in the list.
""".strip()

    return f"""
You are a professional interviewer preparing a personalized interview.

Interview Context:
- Role: {req.role}
- Experience Level: {req.experience}
- Company Type: {req.company_type}
- Interview Round: {req.interview_round}

CANDIDATE RESUME PROFILE (JSON):
{_profile_context(resume_profile)}

{build_round_rules(req)}

{blend_rules}

QUESTION COUNT RULE:
- Generate EXACTLY {count} questions.

CRITICAL OUTPUT CONTRACT:
- Output ONLY one valid JSON object.
- Do NOT add any text before or after the JSON.

MANDATORY JSON FORMAT:
{{
  "questions": [
    "question_1",
    "question_2"
  ]
}}

IMPORTANT:
- The questions array MUST contain exactly {count} items.

Return the JSON now and stop.
""".strip()


def build_followup_prompt(
    question: str,
    answer_transcript: str | None,
    resume_profile: dict | None,
    asked_questions: list[str],
) -> str:
    answer_block = (
        f'CANDIDATE\'S ANSWER (transcribed):\n"{answer_transcript[:3000]}"'
        if answer_transcript
        else "CANDIDATE'S ANSWER: not available — base the follow-up on the question and resume."
    )
    resume_block = (
        f"CANDIDATE RESUME PROFILE (JSON):\n{_profile_context(resume_profile, 2500)}"
        if resume_profile
        else "CANDIDATE RESUME PROFILE: not available."
    )
    asked_block = "\n".join(f"- {q}" for q in asked_questions[-12:]) or "- (none)"

    return f"""
You are a professional interviewer generating ONE contextual follow-up question.

ORIGINAL QUESTION:
"{question}"

{answer_block}

{resume_block}

QUESTIONS ALREADY ASKED (do NOT repeat or rephrase any of these):
{asked_block}

FOLLOW-UP RULES:
- Probe deeper into what the candidate actually said: challenge a claim,
  ask for specifics, ask "how" or "why" about a decision they mentioned.
- If the answer mentioned a project or technology, dig into architecture,
  trade-offs, challenges, scalability or their individual contribution.
- If the answer was vague, ask for a concrete example.
- Keep it to ONE question, conversational, under 40 words.

CRITICAL OUTPUT CONTRACT:
- Output ONLY one valid JSON object.
- Do NOT add any text before or after the JSON.

MANDATORY JSON FORMAT:
{{
  "question": "the follow-up question"
}}

Return the JSON now and stop.
""".strip()
