# app/prompts/coding_prompt.py

import json


def build_coding_problem_prompt(question: str, difficulty: str = "Medium") -> str:
    return f"""
You are a competitive-programming problem setter writing a LeetCode-style
problem for a technical interview platform.

Turn the following interview question into a fully-specified, stdin/stdout
problem that can be auto-judged:

QUESTION: "{question}"
DIFFICULTY: {difficulty}

LEETCODE-STYLE REQUIREMENTS:
- title: short and evocative, like a real LeetCode title.
- description: 2-3 paragraphs of plain text — a precise problem statement
  (optionally framed in a small real-world scenario), an exact definition of
  what to compute, and how to handle edge cases. It must read like a real
  LeetCode problem, not a one-liner.
- constraints: realistic LeetCode-style bounds using n, values and structure
  (e.g. "1 <= n <= 10^5", "-10^9 <= nums[i] <= 10^9", "The graph has no
  self-loops"). The intended solution must be efficient enough for these
  bounds, and the description should make brute force feel insufficient.
- ALGORITHMIC DEPTH — the problem must genuinely require the technique
  implied by the QUESTION (dynamic programming, BFS/DFS on graphs or grids,
  trees, heaps, binary search, two pointers, union-find, ...):
  * Easy: one clean technique (hashmap, two pointers, simple traversal)
  * Medium: a real algorithm or data structure is REQUIRED — DP with a
    state definition, graph traversal, heap-based selection, binary search
    on the answer. NOT solvable by one builtin call or a single loop.
  * Hard: combined techniques — multi-dimensional DP, Dijkstra/topological
    sort, tries, bitmasking.

JUDGING RULES:
- The solution is a complete program: it reads from standard input and
  writes the answer to standard output.
- input_format / output_format: exact, line-based, unambiguous (e.g.
  "First line: two integers n and m. Next m lines: two integers u v ...").
- Provide 3 sample test cases (shown to the candidate, each with an
  explanation that walks through the reasoning) and 5 hidden test cases
  (include edge cases: minimum size, duplicates/negatives, a structurally
  tricky case, and the largest case among the tests).
- Every test input must be internally consistent: if the format includes a
  count n, the data MUST contain exactly n values.
- Every test's expected_output must be EXACTLY what a correct program
  prints for that input (no extra spaces or blank lines).
- Keep actual test inputs small (each runs well under 1 second) even though
  the stated constraints are large.
- reference_solution: a correct, efficient, complete Python 3 program
  (reads stdin, prints to stdout). It is executed to verify every test.

CRITICAL OUTPUT CONTRACT:
- Output ONLY one valid JSON object.
- Do NOT add any text before or after the JSON.

MANDATORY JSON FORMAT:
{{
  "title": "short problem title",
  "description": "clear problem statement",
  "difficulty": "{difficulty}",
  "input_format": "description of stdin format",
  "output_format": "description of stdout format",
  "constraints": ["constraint_1", "constraint_2"],
  "sample_tests": [
    {{"input": "...", "expected_output": "...", "explanation": "..."}}
  ],
  "hidden_tests": [
    {{"input": "...", "expected_output": "..."}}
  ],
  "reference_solution": "complete Python 3 program as a string"
}}

Return the JSON now and stop.
""".strip()


def build_code_review_prompt(
    problem: dict,
    language: str,
    code: str,
    test_summary: dict,
) -> str:
    problem_context = json.dumps({
        "title": problem.get("title", ""),
        "description": problem.get("description", "")[:1500],
        "constraints": problem.get("constraints", []),
    }, ensure_ascii=False)

    return f"""
You are a senior engineer reviewing a coding interview submission.

PROBLEM (JSON):
{problem_context}

LANGUAGE: {language}

CANDIDATE'S CODE:
```
{code[:6000]}
```

ACTUAL TEST RESULTS (ground truth — do not contradict):
- Passed {test_summary.get('passed', 0)} of {test_summary.get('total', 0)} test cases.
- Average execution time: {test_summary.get('avg_time_ms', 'unknown')} ms.

REVIEW RULES:
- Judge algorithm selection, time/space complexity, code quality,
  readability, and edge-case handling.
- score: 0-100 for the code itself (correctness is already measured by
  tests — score design and implementation quality).
- Be specific: reference actual variable names, loops or decisions in the code.
- optimizations: concrete improvements (better algorithm, data structure,
  early exit, avoiding recomputation).
- issues: bugs, missed edge cases, style problems, common mistakes.

CRITICAL OUTPUT CONTRACT:
- Output ONLY one valid JSON object.
- Do NOT add any text before or after the JSON.

MANDATORY JSON FORMAT:
{{
  "score": 0,
  "verdict": "one-sentence overall judgement",
  "complexity": {{"time": "O(...)", "space": "O(...)"}},
  "algorithm_feedback": "assessment of the chosen approach",
  "strengths": ["..."],
  "issues": ["..."],
  "optimizations": ["..."]
}}

Return the JSON now and stop.
""".strip()
