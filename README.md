# 🎙️ AI Interview Twin

> A real-time mock-interview system that listens to your spoken answers and gives you placement-grade feedback on **how you speak**, **what you say**, and **how to improve**.

AI Interview Twin generates role-specific interview questions, records your spoken response, and runs it through a multi-stage evaluation pipeline — speech-to-text, communication analysis, technical correctness scoring, and AI placement coaching — to produce a single, realistic interview score with actionable feedback.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Groq](https://img.shields.io/badge/LLM-Groq-orange)

---

## ✨ Features

- **Role-aware question generation** — questions tailored to role, experience, company type, and interview round (HR, Technical, DSA, Coding, Communication).
- **Voice-first answering** — answers are recorded in the browser (`MediaRecorder`); no microphone access on the server.
- **Communication Score (CS)** — analyzes pace (WPM), filler words, hedging, ownership language, long pauses, voice monotone, and sentiment.
- **Technical Correctness Score (TCS)** — an LLM judges the substance of your answer and assigns a score, band, and verdict.
- **Placement Coaching** — standout strengths, top improvements, current gaps, and focus areas for getting placement-ready.
- **Aggregated final score** — a weighted, realism-bounded fusion of CS and TCS.
- **Fast, API-first inference** — Groq-hosted Whisper + Llama models keep the pipeline responsive on plain CPU hardware.

---

## 🧭 How It Works

The app follows a linear interview flow. Only two pages talk to the backend:

```
InterviewSelect ──► InterviewSetup ──► InterviewQuestion ──► InterviewProcessing ──► InterviewFeedback
  (pick config)     (generate Qs)      (record answer)        (evaluate audio)         (show results)
                          │                                          │
                          ▼                                          ▼
                 POST /generate-questions                     POST /evaluate
```

### Evaluation pipeline (`POST /api/interview/evaluate`)

```
 recorded audio
       │
       ▼
┌──────────────────────────────────────────────┐
│ 1. Transcribe (Groq Whisper large-v3-turbo)   │
├──────────────────────────────────────────────┤
│ 2. Communication Score (CS)                   │
│    • pitch dynamics  (librosa)                │
│    • linguistic signals (spaCy)               │
│    • sentiment (VADER)                         │
│    • scoring engine → CS                       │
├──────────────────────────────────────────────┤
│ 3. Technical Correctness (TCS)                │
│    • LLM judge (Groq Llama-3.3-70b)           │
├──────────────────────────────────────────────┤
│ 4. Placement Coaching (Groq Llama-3.3-70b)    │
├──────────────────────────────────────────────┤
│ 5. Aggregate → final_score (0.6·CS + 0.4·TCS) │
└──────────────────────────────────────────────┘
       │
       ▼
  JSON feedback
```

Transcription and pitch analysis run **in parallel** to shave seconds off each request.

---

## 🛠️ Tech Stack

| Layer        | Technologies |
|--------------|--------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), React Router, TanStack Query, Framer Motion, Firebase Auth |
| **Backend**  | FastAPI, Uvicorn, Pydantic |
| **Speech/NLP** | Groq Whisper (`whisper-large-v3-turbo`), librosa, spaCy (`en_core_web_sm`), VADER sentiment |
| **LLM**      | Groq — `llama-3.3-70b-versatile` (scoring & coaching), `llama-3.1-8b-instant` (question generation) |

---

## 📁 Repository Structure

```
AI_Interview_Twin/
├── backend/                  # FastAPI evaluation service
│   └── app/
│       ├── main.py           # App entrypoint + CORS
│       ├── config.py         # Models, API keys, scoring config
│       ├── api/              # interview.py — HTTP routes
│       ├── services/         # pipeline: analysis, tcs, placement, aggregation
│       ├── audio/            # transcriber, pitch analysis, audio utils
│       ├── nlp/              # linguistic signal detection
│       ├── scoring/          # communication-score engine
│       ├── prompts/          # LLM prompt builders
│       ├── models/           # Groq/LLM runners
│       └── schemas/          # Pydantic models
├── frontend/                 # React + Vite client
│   └── src/
│       ├── pages/            # InterviewSelect/Setup/Question/Processing/Feedback…
│       ├── lib/api.ts        # backend API client
│       └── hooks/useAuth.tsx # Firebase auth
└── model/                    # Research / prototyping notebook (main_model.ipynb)
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+ (or [Bun](https://bun.sh))
- **ffmpeg** (audio decoding — bundled via `imageio-ffmpeg`)
- A free **Groq API key** → https://console.groq.com/keys

### 1. Backend

```bash
cd backend

# create & activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# install dependencies
pip install -r requirements.txt

# the pipeline also uses these runtime packages:
pip install groq python-multipart python-dotenv vaderSentiment

# download the spaCy English model
python -m spacy download en_core_web_sm
```

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
# HF_TOKEN=...                       # optional: only for local LLM fallback
# CORS_ALLOW_ORIGINS=http://localhost:5173,http://localhost:8080   # optional
```

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

The server starts at `http://localhost:8000` (interactive docs at `/docs`).

### 2. Frontend

```bash
cd frontend
npm install          # or: bun install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000

# Firebase web config (from your Firebase project settings)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Run the dev server:

```bash
npm run dev          # http://localhost:5173
```

---

## 🔌 API Reference

Base URL: `http://localhost:8000`

### `POST /api/interview/generate-questions`

Generate interview questions for the chosen configuration.

**Request**
```json
{
  "role": "Software Development Engineer",
  "experience": "Fresher",
  "company_type": "Service-Based",
  "interview_round": "HR"
}
```

**Response**
```json
{ "questions": ["Question 1", "Question 2", "..."] }
```

Question count is enforced per round (HR: 6, Technical: 8, DSA: 7, Coding: 5, Communication: 5).

### `POST /api/interview/evaluate`

Evaluate a recorded answer. Sent as `multipart/form-data`.

| Field       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `audio`     | file   | Recorded answer (e.g. `answer.webm`) |
| `questions` | string | JSON-encoded array of questions      |

**Response (abridged)**
```json
{
  "transcript": "...",
  "cs_score": 82.0,
  "cs_metrics": { "wpm": 138, "fillers_per_min": 1.2, "...": "..." },
  "cs_feedback": ["Good ownership language detected.", "..."],
  "tcs_score": 74,
  "tcs_band": "Partial",
  "tcs_verdict": "...",
  "tcs_issues": ["..."],
  "tcs_improvements": ["..."],
  "final_score": 78.5,
  "placement_feedback": { "standout_strengths": [], "top_improvements": [], "placement_coaching": {} }
}
```

---

## 📊 Scoring Model

- **Communication Score (CS)** starts at 100 and is adjusted by delivery signals — hedging, apologies, passive voice, fillers, long pauses, WPM (ideal ~125–145), monotone, and sentiment.
- **Technical Correctness (TCS)** is an LLM-assigned score with a band (`Poor` / `Weak` / `Partial` / strong) and verdict.
- **Final Score** = `0.6 · CS + 0.4 · TCS`, then capped by the TCS band for realism (e.g. a `Poor` band caps the final score at 45) and bounded to `[0, 95]`.

---

## 🤝 Contributing

Issues and pull requests are welcome. For larger changes, open an issue first to discuss the direction.

## 📄 License

Licensed under the [MIT License](LICENSE) — © 2025 Ramkumar M ([@RamInTech](https://github.com/RamInTech)).
