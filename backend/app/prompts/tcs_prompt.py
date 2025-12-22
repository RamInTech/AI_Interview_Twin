from typing import List

def build_tcs_prompt(question: str | List[str], transcript: str) -> str:
    # Normalize question
    if isinstance(question, list):
        question = next(
            (str(q).strip() for q in question if str(q).strip()),
            "Explain your approach to this problem."
        )
    else:
        question = str(question).strip() or "Explain your approach to this problem."

    return f"""
You are a senior technical interviewer conducting a mock interview.

You must evaluate the candidate STRICTLY based on:
1. The interview question provided
2. The candidate’s answer provided below

Interview Question:
{question}

Candidate Answer:
{transcript}

STRICT EVALUATION RULES:
- Judge relevance to the question.
- Judge technical correctness ONLY within scope.
- Do NOT infer unstated knowledge.
- Do NOT introduce new tools or concepts.
- Avoid generic interview advice.

SCORING GUIDELINES:
- Score from 0 to 100.
- Bands: Excellent, Good, Partial, Weak, Poor.

COACHING REQUIREMENTS:
- Provide at least 5 improvement points.
- Each point must reference the answer or something missing.

OUTPUT RULES:
- Respond in STRICT JSON ONLY.
- Start with '{{' and end with '}}'.
- No markdown or extra text.

JSON FORMAT:
{{
  "score": <int>,
  "band": "<Excellent|Good|Partial|Weak|Poor>",
  "verdict": "<1–2 sentence technical judgment>",
  "issues": ["<question-relative technical issues>"],
  "improvement_points": ["<specific coaching points>"]
}}

Return only valid JSON.
""".strip()
