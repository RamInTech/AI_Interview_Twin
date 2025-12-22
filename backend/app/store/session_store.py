# app/store/session_store.py

from typing import Dict, Any
import uuid
import time

# -----------------------------
# In-memory session store
# -----------------------------
_SESSIONS: Dict[str, Dict[str, Any]] = {}


def create_session(metadata: Dict[str, Any]) -> str:
    """
    Create a new interview session.
    """
    session_id = str(uuid.uuid4())

    _SESSIONS[session_id] = {
        "created_at": time.time(),
        "metadata": metadata,
        "questions": [],
        "answers": [],
        "transcript": "",
        "cs_score": None,
        "tcs_result": None,
        "final_score": None,
        "placement_feedback": None,
    }

    return session_id


def get_session(session_id: str) -> Dict[str, Any]:
    if session_id not in _SESSIONS:
        raise KeyError(f"Session {session_id} not found")
    return _SESSIONS[session_id]


def update_session(session_id: str, updates: Dict[str, Any]):
    if session_id not in _SESSIONS:
        raise KeyError(f"Session {session_id} not found")

    _SESSIONS[session_id].update(updates)


def append_question(session_id: str, question: str):
    get_session(session_id)["questions"].append(question)


def append_answer(session_id: str, answer: str):
    get_session(session_id)["answers"].append(answer)


def clear_session(session_id: str):
    _SESSIONS.pop(session_id, None)
