def detect_signals(text, segments):
    return {
        "filler_count": text.lower().count("um"),
        "hedge_count": text.lower().count("maybe"),
        "own_count": text.lower().count("i "),
        "passive_count": 0,
        "apology_count": text.lower().count("sorry"),
        "long_pauses": 0,
        "long_speech_blocks": 0
    }
