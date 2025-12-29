# app/models/llm_utils.py

import json
import re
from typing import List, Dict


def extract_last_json(text: str) -> Dict:
    """
    Extract the LAST valid JSON object from text.
    Useful when LLM emits multiple JSON blocks.
    """
    matches = re.findall(r"\{[\s\S]*?\}", text)
    if not matches:
        raise RuntimeError("No JSON object found in LLM output")

    for candidate in reversed(matches):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue

    raise RuntimeError("No valid JSON object could be parsed")


def extract_valid_json_objects(text: str) -> List[Dict]:
    """
    Extract ALL fully balanced JSON objects from text.
    """
    results = []
    stack = []
    start = None

    for i, ch in enumerate(text):
        if ch == "{":
            if not stack:
                start = i
            stack.append("{")

        elif ch == "}":
            if stack:
                stack.pop()
                if not stack and start is not None:
                    candidate = text[start:i + 1]
                    try:
                        results.append(json.loads(candidate))
                    except json.JSONDecodeError:
                        pass
                    start = None

    return results
