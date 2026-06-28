# app/prompts/tcs_prompt.py

from typing import List


def build_tcs_prompt(question: str | List[str], transcript: str) -> str:
    # Normalize question in case a list/array is passed
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
2. The candidate's answer provided below

You have NO access to the candidate's resume, background, or intent beyond
what is explicitly stated.

Your responsibilities:
1. Determine whether the candidate actually answered the question asked.
2. Evaluate technical correctness ONLY within the scope of the question.
3. Identify inaccuracies, misconceptions, missing fundamentals, or weak
   explanations relative to the question.
4. Provide transcript-grounded coaching feedback to improve correctness,
   relevance, and clarity.

STRICT EVALUATION RULES:
- Judge relevance: Penalize if the answer partially or fully misses the question.
- Judge correctness: Evaluate only what the candidate actually said.
- Do NOT infer unstated knowledge or intentions.
- Do NOT introduce new tools, technologies, metrics, or concepts.
- Do NOT penalize for advanced topics unless the question explicitly requires them.
- Avoid generic interview advice (e.g., \u201cpractice more\u201d, \u201cbe confident\u201d).

Interview Question:
{question}

Candidate Answer:
{transcript}

SCORING GUIDELINES:
- Score from 0 to 100 based on relevance + technical correctness.
- Use these bands:
  - Excellent: Fully answers the question with correct and clear explanation
  - Good: Answers the question correctly with minor gaps or imprecision
  - Partial: Addresses the question but with notable gaps or confusion
  - Weak: Poor alignment with the question or flawed understanding
  - Poor: Does not answer the question or is mostly incorrect

COACHING REQUIREMENTS:
- Provide at least 4 coaching points.
- EACH coaching point must reference:
  - something said in the answer, OR
  - something clearly missing relative to the question.
- If the answer is strong, focus on improving precision, structure, or depth
  without adding new content.

OUTPUT RULES:
- Start the response with '{{' and end with '}}'.
- Respond in STRICT JSON ONLY.
- Do NOT include markdown, explanations, or extra text.

JSON format:
The output must be a single flat JSON object containing exactly these 5 keys:
1. "score" (integer between 0 and 100)
2. "band" (string, must be one of: Excellent, Good, Partial, Weak, Poor)
3. "verdict" (string, a 1-2 sentence technical summary)
4. "issues" (array of strings, detailing question-relative technical issues or 'No major technical issues identified')
5. "improvement_points" (array of strings, specific coaching points)

Return only valid JSON.
"""
