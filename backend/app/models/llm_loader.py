# app/models/llm_loader.py

import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from app.utils.device import detect_device
from app.config import HF_TOKEN

TCS_MODEL_NAME = "google/gemma-2-2b-it"

_tokenizer = None
_model = None


def load_tcs_model():
    global _tokenizer, _model

    if _model is not None:
        return _tokenizer, _model

    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        raise RuntimeError("HF_TOKEN environment variable not set")

    device = detect_device()

    _tokenizer = AutoTokenizer.from_pretrained(
        MODEL_NAME,
        use_fast=True,
        token=hf_token
    )

    if _tokenizer.pad_token is None:
        _tokenizer.pad_token = _tokenizer.eos_token

    if device == "cuda":
        dtype = torch.float16
        device_map = "auto"
    else:
        dtype = torch.float32
        device_map = None

    _model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=dtype,
        device_map=device_map,
        token=hf_token
    )

    _model.eval()
    torch.set_grad_enabled(False)

    return _tokenizer, _model
