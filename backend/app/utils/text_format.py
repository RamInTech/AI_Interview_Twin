# app/utils/text_format.py

def pretty_print_transcript(text: str, line_width: int = 100):
    words = text.split()
    line = []
    for w in words:
        line.append(w)
        if sum(len(x) + 1 for x in line) >= line_width:
            print(" ".join(line))
            line = []
    if line:
        print(" ".join(line))
