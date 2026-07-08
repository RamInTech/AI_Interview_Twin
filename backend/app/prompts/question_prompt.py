# app/prompts/question_prompt.py

from app.schemas.question import QuestionGenerationRequest


def build_round_rules(req: QuestionGenerationRequest) -> str:
    """Round-specific question style rules, shared by the generic and
    resume-personalized prompts."""
    difficulty = req.difficulty or "Medium"

    if req.interview_round in ("DSA", "Coding"):
        return f"""
ROUND STYLE RULES ({req.interview_round}, difficulty: {difficulty}):
- Every question is ONE self-contained LeetCode-style algorithmic problem
  statement (1-2 sentences), e.g. "Given a weighted directed graph, find the
  shortest path from node 0 to every other node."
- The question set MUST cover DIVERSE data structures and algorithms — pick a
  DIFFERENT topic for each question from: arrays/strings, hashing, two
  pointers/sliding window, linked lists, stacks/queues, binary trees/BST,
  graphs (BFS/DFS/shortest paths/union-find), dynamic programming, greedy,
  heaps/priority queues, binary search.
- Match {difficulty} difficulty:
  * Easy: single-technique problems (hashmap lookup, two pointers, simple tree traversal)
  * Medium: requires a real algorithm — DP, graph traversal, heaps, binary search on answer
  * Hard: combined techniques — advanced DP, Dijkstra/topological sort, tries
- No trivia or definition questions. No two questions on the same topic.
""".strip()

    if req.interview_round == "Technical":
        return """
ROUND STYLE RULES (Technical):
- Deep conceptual and design questions for the role: architecture, trade-offs,
  debugging scenarios, scalability, technology internals.
- No coding-exercise questions; they belong to the Coding/DSA rounds.
""".strip()

    if req.interview_round == "HR":
        return """
ROUND STYLE RULES (HR):
- Behavioral questions: teamwork, conflict, deadlines, failure, motivation,
  leadership — answerable with concrete personal stories.
""".strip()

    return """
ROUND STYLE RULES (Communication):
- Questions that require structured verbal explanation of ideas, opinions or
  experiences — evaluating clarity, articulation and flow.
""".strip()


def build_question_generation_prompt(req: QuestionGenerationRequest, count: int) -> str:
    return f"""
You are a professional interviewer.

Interview Context:
- Role: {req.role}
- Experience Level: {req.experience}
- Company Type: {req.company_type}
- Interview Round: {req.interview_round}

{build_round_rules(req)}

QUESTION COUNT RULE:
- Generate EXACTLY {count} questions.

CRITICAL OUTPUT CONTRACT:
- Output ONLY one valid JSON object.
- Do NOT add any text before or after the JSON.
- Do NOT add explanations, notes, labels, or headings.
- Stop generating immediately after the final closing brace.

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
