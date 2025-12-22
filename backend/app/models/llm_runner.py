import json, re, torch
from app.models.llm_loader import load_llm

def run_llm(prompt: str, max_new_tokens=1000) -> dict:
    tokenizer, model = load_llm()

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1536)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    with torch.no_grad():
        output = model.generate(**inputs, max_new_tokens=max_new_tokens)

    text = tokenizer.decode(output[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)

    for block in re.findall(r"\{[\s\S]*?\}", text):
        try:
            return json.loads(block)
        except json.JSONDecodeError:
            continue

    raise RuntimeError("Invalid LLM JSON output")
