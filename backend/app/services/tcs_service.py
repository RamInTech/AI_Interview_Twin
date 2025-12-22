from app.prompts.tcs_prompt import build_tcs_prompt
from app.models.llm_runner import run_llm

def compute_tcs(transcript, question):
    raw = run_llm(build_tcs_prompt(question, transcript))
    return raw
