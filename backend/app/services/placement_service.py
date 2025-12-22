from app.prompts.placement_prompt import build_placement_coaching_prompt
from app.models.llm_runner import run_llm

def generate_placement_feedback(transcript, question):
    return run_llm(build_placement_coaching_prompt(question, transcript))
