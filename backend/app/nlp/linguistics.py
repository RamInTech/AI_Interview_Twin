# app/nlp/linguistics.py

nlp = None
NLP_MODE = "regex"

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    NLP_MODE = "spacy"
except Exception:
    nlp = None
    NLP_MODE = "regex"
