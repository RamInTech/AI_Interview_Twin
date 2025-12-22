from app.schemas.question import QuestionGenerationRequest

def build_question_generation_prompt(req: QuestionGenerationRequest) -> str:
    return f"""
You are a professional interviewer.

Interview Context:
- Role: {req.role}
- Experience Level: {req.experience}
- Company Type: {req.company_type}
- Interview Round: {req.interview_round}

QUESTION COUNT RULES:
- HR Round: exactly 6 questions
- Technical Round: exactly 8 questions
- DSA Round: exactly 7 questions
- Coding Round: exactly 5 questions
- Communication Round: exactly 5 questions

CRITICAL OUTPUT CONTRACT:
- Output ONLY one valid JSON object.
- Do NOT add any text before or after the JSON.
- Do NOT add explanations, notes, or headings.
- Stop generating immediately after the final closing brace.

MANDATORY JSON FORMAT:
{{
  "questions": [
    "question_1",
    "question_2",
    "question_3"
  ]
}}

IMPORTANT:
- The number of questions MUST exactly match the rule for the selected interview round.

Return the JSON now and stop.
""".strip()
