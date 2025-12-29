# app/models/question_llm_runner.py

import json
import re
import torch
from typing import Dict
from app.models.llm_loader import load_tcs_model


def _fix_and_load(block: str) -> Dict:
    cleaned = re.sub(r",\s*\}", "}", block)
    cleaned = re.sub(r",\s*\]", "]", cleaned)

    bracket_diff = cleaned.count("[") - cleaned.count("]")
    brace_diff = cleaned.count("{") - cleaned.count("}")

    if bracket_diff > 0:
        cleaned += "]" * bracket_diff
    if brace_diff > 0:
        cleaned += "}" * brace_diff

    return json.loads(cleaned)


def run_llm_question(prompt: str, max_new_tokens: int = 512) -> Dict:
    tokenizer, model = load_tcs_model()

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=1024
    )

    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.pad_token_id
        )

    input_len = inputs["input_ids"].shape[1]
    decoded = tokenizer.decode(
        outputs[0][input_len:],
        skip_special_tokens=True
    ).strip()

    json_blocks = re.findall(r"\{[\s\S]*?\}", decoded)
    for block in reversed(json_blocks):
        try:
            return json.loads(block)
        except json.JSONDecodeError:
            try:
                return _fix_and_load(block)
            except Exception:
                continue

    if "{" in decoded:
        try:
            return _fix_and_load(decoded[decoded.find("{"):])
        except Exception:
            pass

    raise RuntimeError(
        "Question LLM returned invalid JSON.\nRaw output:\n" + decoded
    )
