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

📍 Purpose: Select interview configuration, upload resume, generate questions

What happens on this page?

User selects role, experience, interview rounds (+ language/difficulty for
Coding/DSA), and can optionally upload a resume.

Backend APIs called
POST /api/interview/parse-resume        (optional, when a resume is uploaded)
POST /api/interview/generate-questions  (on "Start Interview")

The parsed resume profile is shown as skill chips, stored in
sessionStorage, and sent as resume_profile with generate-questions so the
questions reference the candidate's actual projects and technologies.
This page then navigates DIRECTLY to InterviewQuestion (the Setup page is
a legacy alternative flow).

2️⃣ InterviewSetup.tsx

📍 Purpose: Upload resume (optional) + generate interview questions

Backend APIs called
POST /api/interview/parse-resume      (optional, when a resume is uploaded)
POST /api/interview/generate-questions

Resume upload (optional)

User uploads a PDF/DOCX/TXT resume → backend extracts text locally and
structures it via LLM into a profile (projects, skills, experience,
certifications, achievements, internships). The profile is stored in
sessionStorage and shown as skill chips.

When is generate-questions called?

👉 When the user clicks “Start Interview”

Request sent to backend
{
  "role": "Software Development Engineer",
  "experience": "Fresher",
  "company_type": "Service-Based",
  "interview_round": "HR",
  "resume_profile": { ... }   // optional — personalizes the questions
}

With a resume_profile, questions reference the candidate's actual projects
and technologies by name (architecture, trade-offs, challenges, scaling,
individual contribution) and match the selected round.

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

📍 Purpose: Record candidate’s spoken answer, coding IDE, follow-ups

Backend APIs called (on user action)
POST /api/interview/follow-up        (after recording: contextual follow-up question)
POST /api/interview/code/problem     (Coding/DSA rounds: structured problem + tests)
POST /api/interview/code/run         (Run: sample tests + custom stdin)
POST /api/interview/code/submit      (Submit: sample + hidden tests + AI code review)

Follow-up questions

After recording an answer, the user can press “Ask Follow-up Question”.
The recorded answer is transcribed server-side and one contextual
follow-up (grounded in the answer + resume profile, avoiding repeats)
is inserted after the current question.

Coding IDE (Coding/DSA rounds)

The integrated Monaco editor supports C++, Java, Python, JavaScript,
Go and Rust with a problem statement, sample tests, custom stdin,
Run/Submit, per-test pass/fail, and AI code review. Test cases are
verified at generation time by executing an LLM reference solution.
Judged submissions are kept in the session and sent with the final
evaluation.

Backend connection during recording?

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
audio	Recorded audio/video file
questions	JSON string of interview questions
code_submissions	JSON string of judged IDE submissions (optional)
Example
const formData = new FormData();
formData.append("audio", audioBlob, "answer.webm");
formData.append("questions", JSON.stringify(questions));
formData.append("code_submissions", JSON.stringify(codeSubmissions));

Backend actions (pipeline)

Transcribes audio (Whisper)

Computes Communication Score (CS)

Computes Camera Presence Score (CPS) from the video track — eye contact,
facial expressions, posture, engagement, composure (runs in parallel with CS;
skipped automatically for audio-only uploads)

Computes Technical Correctness Score (TCS)

Generates placement coaching feedback

Averages coding submission scores (Coding/DSA rounds)

Aggregates final score (CS 45% + TCS 40% + CPS 15%; CS 60% + TCS 40% when
no video; when coding submissions exist they take a 20% share and the
other weights scale by 0.8)

Response received
{
  "transcript": "...",
  "cs_score": 82,
  "coding_score": 76.5,
  "code_submissions": [ ... ],
  "camera_presence": {
    "overall_score": 78.5,
    "classification": "Good",
    "metric_scores": {...},
    "strengths": [...],
    "improvements": [...],
    "observations": {...},
    "coaching_suggestions": [...],
    "summary": "..."
  },
  "tcs": {...},
  "final_score": 80.5,
  "overall_assessment": {...},
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

Camera presence analysis (per-metric scores, observations, coaching)

Technical correctness feedback

Placement-ready rewritten answers

Areas to focus for placements

This page is purely UI.