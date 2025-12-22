📘 Frontend ↔ Backend Page Mapping Guide

AI Interview Twin – Real-Time Mock Interview System

This document explains when and where each backend API is called from the frontend, following the actual page flow of the application.

🧭 Overall Interview Flow
InterviewSelect
   ↓
InterviewSetup
   ↓
InterviewQuestion
   ↓
InterviewProcessing
   ↓
InterviewFeedback


Each page has a clear responsibility, and only specific pages communicate with the backend.

📁 Frontend Pages Location
frontend/
└── src/
    └── pages/
        ├── InterviewSelect.tsx
        ├── InterviewSetup.tsx
        ├── InterviewQuestion.tsx
        ├── InterviewProcessing.tsx
        └── InterviewFeedback.tsx

📁 Backend API Location
backend/
└── app/
    └── api/
        └── interview.py

🔗 Page-wise Backend Connection Guide
1️⃣ InterviewSelect.tsx

📍 Purpose: Select interview configuration

What happens on this page?

User selects:

Role

Experience

Company type

Interview round

Backend connection?

❌ NO backend call

Why?

This page only collects user choices and navigates to the next page.

2️⃣ InterviewSetup.tsx

📍 Purpose: Generate interview questions

Backend API called
POST /api/interview/generate-questions

When is it called?

👉 When the user clicks “Start Interview”

Request sent to backend
{
  "role": "Software Development Engineer",
  "experience": "Fresher",
  "company_type": "Service-Based",
  "interview_round": "HR"
}

Backend action

Uses LLM to generate interview questions

Enforces strict question count based on interview round

Response received
{
  "questions": [
    "Question 1",
    "Question 2",
    "... more questions ..."
  ]
}

What frontend does next

Stores questions in state

Navigates to InterviewQuestion.tsx

Displays first question

3️⃣ InterviewQuestion.tsx

📍 Purpose: Record candidate’s spoken answer

Backend connection?

❌ NO backend call during recording

What happens here?

Frontend:

Starts live audio recording (MediaRecorder)

Stops recording when user finishes

Converts recording into an audio file (Blob)

Important rule

🎤 Audio recording is 100% frontend-only

Backend does not:

access microphone

stream live audio

control recording

After recording stops

Audio file is stored temporarily in frontend

Frontend navigates to InterviewProcessing.tsx

4️⃣ InterviewProcessing.tsx

📍 Purpose: Send audio to backend & wait for evaluation

Backend API called
POST /api/interview/evaluate

When is it called?

👉 Immediately when this page loads

What frontend sends

multipart/form-data

Field	Description
audio	Recorded audio file
questions	JSON string of interview questions
Example
const formData = new FormData();
formData.append("audio", audioBlob, "answer.webm");
formData.append("questions", JSON.stringify(questions));

Backend actions (pipeline)

Transcribes audio (Whisper)

Computes Communication Score (CS)

Computes Technical Correctness Score (TCS)

Generates placement coaching feedback

Aggregates final score

Response received
{
  "transcript": "...",
  "cs_score": 82,
  "tcs": {...},
  "final_score": 80.5,
  "placement_feedback": {...}
}

What frontend does next

Stores response

Navigates to InterviewFeedback.tsx

5️⃣ InterviewFeedback.tsx

📍 Purpose: Display interview results

Backend connection?

❌ NO backend call

What happens here?

Frontend displays:

Final interview score

Communication feedback

Technical correctness feedback

Placement-ready rewritten answers

Areas to focus for placements

This page is purely UI.