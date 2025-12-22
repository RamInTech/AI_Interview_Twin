import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from app.config import HF_TOKEN
from app.utils.device import detect_device

MODEL = "meta-llama/Llama-3.2-3B-Instruct"

_tokenizer = None
_model = None

def load_llm():
    global _tokenizer, _model
    if _model:
        return _tokenizer, _model

    device = detect_device()
    dtype = torch.float16 if device == "cuda" else torch.float32

    _tokenizer = AutoTokenizer.from_pretrained(MODEL, token=HF_TOKEN)
    if _tokenizer.pad_token is None:
        _tokenizer.pad_token = _tokenizer.eos_token

    _model = AutoModelForCausalLM.from_pretrained(
        MODEL,
        torch_dtype=dtype,
        device_map="auto" if device == "cuda" else None,
        token=HF_TOKEN
    )
    _model.eval()
    return _tokenizer, _model
