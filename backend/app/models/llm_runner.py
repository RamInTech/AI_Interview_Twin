# app/models/llm_runner.py

import torch
from app.models.llm_loader import load_tcs_model
from app.models.llm_utils import extract_valid_json_objects


def run_llm(prompt: str, max_new_tokens: int = 1600) -> dict:
    tokenizer, model = load_tcs_model()

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=2536
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

    decoded = tokenizer.decode(
        outputs[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True
    ).strip()

    parsed_objects = extract_valid_json_objects(decoded)
    if parsed_objects:
        return parsed_objects[-1]

    raise RuntimeError(
        "LLM output could not be parsed into valid JSON.\n"
        "Raw output:\n" + decoded[-1000:]
    )
