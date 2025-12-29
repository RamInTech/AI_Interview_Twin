# app/nlp/signals.py

from typing import List, Dict
from app.nlp.linguistics import nlp

FILLERS_SIMPLE = {"um", "uh", "umm", "uhh"}
MULTI_FILLERS = ["you know", "i mean"]

HEDGE_KEYWORDS = {"maybe", "probably", "possibly", "might"}
HEDGE_PHRASES = [
    "i think", "not sure", "kind of", "sort of",
    "i guess", "might be", "i don't remember"
]

OWNERSHIP_VERBS = {"build", "design", "lead", "implement", "create", "manage", "solve", "drive"}
APOLOGIES = ["sorry", "apologize", "i forgot", "i didn't prepare", "excuse me"]


def detect_signals(transcript: str, segments: List[Dict]) -> Dict:
    text_lower = transcript.lower()

    filler_count = hedge_count = own_count = passive_count = apology_count = 0

    if nlp:
        doc = nlp(transcript)

        for token in doc:
            t = token.text.lower()

            if t in FILLERS_SIMPLE:
                filler_count += 1

            if t == "like" and token.pos_ == "INTJ":
                filler_count += 1

            if t in HEDGE_KEYWORDS:
                hedge_count += 1

            if t == "think" and token.head.text.lower() == "i":
                hedge_count += 1

            if token.lemma_ in OWNERSHIP_VERBS:
                if any(tok.text.lower() == "i" for tok in token.subtree):
                    own_count += 1

            if token.dep_ == "auxpass":
                if not any(tok.text.lower() == "i" for tok in token.head.subtree):
                    passive_count += 1

        for f in MULTI_FILLERS:
            filler_count += text_lower.count(f)

        for h in HEDGE_PHRASES:
            hedge_count += text_lower.count(h)

    else:
        filler_count += sum(text_lower.count(f) for f in FILLERS_SIMPLE)
        filler_count += sum(text_lower.count(f) for f in MULTI_FILLERS)
        hedge_count += sum(text_lower.count(h) for h in HEDGE_PHRASES)

    apology_count = sum(text_lower.count(a) for a in APOLOGIES)

    long_pauses = 0
    long_speech_blocks = 0

    all_words = []
    for seg in segments:
        all_words.extend(seg.get("words", []))

    for i in range(1, len(all_words)):
        if all_words[i]["start"] - all_words[i - 1]["end"] > 1.2:
            long_pauses += 1

    for seg in segments:
        if (seg["end"] - seg["start"]) > 10.0:
            long_speech_blocks += 1

    uncertainty_patterns = [
        "or maybe",
        "not sure if",
        "i think it was",
        "can't remember"
    ]
    hedge_count += sum(text_lower.count(p) for p in uncertainty_patterns)

    return {
        "filler_count": filler_count,
        "hedge_count": hedge_count,
        "own_count": own_count,
        "passive_count": passive_count,
        "apology_count": apology_count,
        "long_pauses": long_pauses,
        "long_speech_blocks": long_speech_blocks
    }
