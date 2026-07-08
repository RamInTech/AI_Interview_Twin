# app/api/interview.py

import json
import os
import tempfile
from typing import List, Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.services.interview_evaluator import evaluate_interview
from app.services.question_service import generate_interview_questions
from app.services.resume_service import (
    generate_followup_question,
    parse_resume_file,
)
from app.schemas.question import QuestionGenerationRequest
from app.utils.resume_parser import ResumeParseError

router = APIRouter(prefix="/api/interview")


class GenerateQuestionsRequest(BaseModel):
    role: str
    experience: str
    company_type: str
    interview_round: str
    resume_profile: Optional[dict] = None
    num_questions: Optional[int] = None
    difficulty: Optional[str] = None


@router.post("/generate-questions")
async def generate_questions_endpoint(request: GenerateQuestionsRequest):
    req = QuestionGenerationRequest(
        role=request.role,
        experience=request.experience,
        company_type=request.company_type,
        interview_round=request.interview_round,
        resume_profile=request.resume_profile,
        num_questions=request.num_questions,
        difficulty=request.difficulty
    )
    questions = generate_interview_questions(req)
    return {"questions": questions}


@router.post("/parse-resume")
async def parse_resume_endpoint(resume: UploadFile = File(...)):
    filename = resume.filename or "resume.pdf"
    tmp_dir = tempfile.mkdtemp(prefix="resume-")
    path = os.path.join(tmp_dir, filename)

    with open(path, "wb") as f:
        f.write(await resume.read())

    try:
        profile = parse_resume_file(path, filename)
        return {"resume_profile": profile}
    except ResumeParseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        try:
            os.remove(path)
        finally:
            os.rmdir(tmp_dir)


@router.post("/follow-up")
async def follow_up_endpoint(
    question: str = Form(...),
    asked_questions: str = Form("[]"),
    resume_profile: str = Form(""),
    audio: Optional[UploadFile] = File(None),
):
    """
    Generate one contextual follow-up question. If the candidate's recorded
    answer is attached, it is transcribed so the follow-up probes what they
    actually said; otherwise the follow-up is based on question + resume.
    """
    try:
        asked = json.loads(asked_questions)
        asked = [str(q) for q in asked] if isinstance(asked, list) else []
    except json.JSONDecodeError:
        asked = []

    profile: Optional[dict] = None
    if resume_profile:
        try:
            parsed_profile = json.loads(resume_profile)
            if isinstance(parsed_profile, dict):
                profile = parsed_profile
        except json.JSONDecodeError:
            pass

    transcript: Optional[str] = None
    if audio is not None:
        tmp_dir = tempfile.mkdtemp(prefix="followup-")
        path = os.path.join(tmp_dir, audio.filename or "answer.webm")
        with open(path, "wb") as f:
            f.write(await audio.read())
        try:
            from app.audio.transcriber import transcribe_audio
            tr = transcribe_audio(path)
            if tr and tr.text and tr.text.strip():
                transcript = tr.text
        except Exception as e:
            print(f"[FOLLOW-UP][WARN] Transcription failed, continuing without: {e}")
        finally:
            try:
                os.remove(path)
            finally:
                os.rmdir(tmp_dir)

    followup = generate_followup_question(question, transcript, profile, asked)
    return {"question": followup}


@router.post("/evaluate")
async def evaluate(
    audio: UploadFile = File(...),
    questions: str = Form(...),
    code_submissions: str = Form(""),
):
    tmp_dir = tempfile.mkdtemp(prefix="interview-")
    filename = audio.filename or "answer.webm"
    path = os.path.join(tmp_dir, filename)

    with open(path, "wb") as f:
        f.write(await audio.read())

    try:
        parsed: List[str]
        data = json.loads(questions)
        if isinstance(data, list):
            parsed = [str(q) for q in data]
        else:
            parsed = [str(data)]
    except json.JSONDecodeError:
        parsed = [questions]

    submissions: List[dict] = []
    if code_submissions:
        try:
            sub_data = json.loads(code_submissions)
            if isinstance(sub_data, list):
                submissions = [s for s in sub_data if isinstance(s, dict)]
        except json.JSONDecodeError:
            print("[EVAL][WARN] code_submissions was not valid JSON; ignoring")

    try:
        return evaluate_interview(path, parsed, submissions)
    finally:
        try:
            os.remove(path)
        finally:
            os.rmdir(tmp_dir)
