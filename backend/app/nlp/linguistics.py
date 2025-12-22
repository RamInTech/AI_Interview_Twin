try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None
