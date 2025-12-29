import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, ArrowLeft, Upload, ArrowRight, ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import PageTransition from '@/components/PageTransition';
import CodeEditor from '@/components/interview/CodeEditor';

/* ---------------- MOCK QUESTIONS ---------------- */

const mockQuestions = {
  hr: [
    "Tell me about a time when you had to work with a difficult team member.",
    "Describe a situation where you had to meet a tight deadline.",
    "How do you handle constructive criticism?"
  ],
  technical: [
    "Explain REST vs GraphQL.",
    "How would you optimize a slow DB query?",
    "Design a scalable notification system."
  ],
  coding: [
    "Two Sum problem.",
    "Reverse a linked list.",
    "Check if a binary tree is balanced."
  ],
  dsa: [
    "Longest palindromic substring.",
    "Serialize and deserialize a tree.",
    "Shortest path in a matrix."
  ],
};

export default function InterviewQuestion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const rounds = searchParams.get('rounds')?.split(',') || [];
  const initialLanguage = searchParams.get('language') || 'python';

  /* ---------------- QUESTION ---------------- */

  const questionsParam = searchParams.get('questions');
  let questions: string[] = [];

  try {
    questions = questionsParam ? JSON.parse(questionsParam) : [];
  } catch {
    questions = [];
  }

  if (!questions.length) {
    const type =
      rounds.includes('dsa') ? 'dsa' :
      rounds.includes('coding') ? 'coding' :
      rounds.includes('technical') ? 'technical' : 'hr';

    questions = mockQuestions[type];
  }

  const [questionIndex, setQuestionIndex] = useState(0);
  const question = questions[questionIndex] || '';
  const hasMultipleQuestions = questions.length > 1;

  const showCodeEditor = rounds.includes('coding') || rounds.includes('dsa');
  const progressPercent = questions.length
    ? Math.round(((questionIndex + 1) / questions.length) * 100)
    : 0;

  /* ---------------- AUDIO STATE ---------------- */

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const hasPendingAudio = Boolean(pendingAudioBlob);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------------- START RECORDING ---------------- */

  const startRecording = async () => {
    setEvaluationError(null);
    setPendingAudioBlob(null);
    setAudioUrl(null);
    setPendingQuestion(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioChunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setAudioUrl(URL.createObjectURL(audioBlob));
      setPendingAudioBlob(audioBlob);
      setPendingQuestion(question);
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  /* ---------------- STOP RECORDING ---------------- */

  const stopRecording = () => {
    setIsRecording(false);
    timerRef.current && clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  /* ---------------- AUDIO FILE UPLOAD ---------------- */

  const handleAudioUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEvaluationError(null);
    setAudioUrl(URL.createObjectURL(file));
    setPendingAudioBlob(file);
    setPendingQuestion(question);
  };

  /* ---------------- BACKEND CALL ---------------- */

  const sendAudioToBackend = async (audioBlob: Blob, questionText: string) => {
    try {
      setIsEvaluating(true);
      setEvaluationError(null);
      const formData = new FormData();
      const audioFile =
        audioBlob instanceof File
          ? audioBlob
          : new File([audioBlob], 'answer.webm', { type: 'audio/webm' });
      formData.append('audio', audioFile, audioFile.name);
      formData.append('questions', JSON.stringify([questionText]));

      const res = await fetch(`${API_BASE_URL}/api/interview/evaluate`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Evaluation failed');

      const result = await res.json();

      // Persist results so feedback page can load them
      sessionStorage.setItem('interviewResults', JSON.stringify(result));

      // Clear pending data once processing completes successfully
      setPendingAudioBlob(null);
      setPendingQuestion(null);
      setAudioUrl(null);

      // Preserve existing query params (role, rounds, etc.) when moving to feedback
      const params = new URLSearchParams(searchParams);
      navigate(`/interview/feedback?${params.toString()}`);

    } catch (err) {
      console.error('Backend error:', err);
      setEvaluationError('Evaluation failed. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleEvaluateInterview = async () => {
    if (!pendingAudioBlob) {
      setEvaluationError('Record or upload audio before evaluating.');
      return;
    }
    const questionForEvaluation = pendingQuestion || question;
    await sendAudioToBackend(pendingAudioBlob, questionForEvaluation);
  };

  /* ---------------- CODE SUBMIT ---------------- */

  const handleCodeSubmit = (code: string, language: string) => {
    navigate('/interview/processing', {
      state: { code, language, question },
    });
  };

  /* ---------------- QUESTION NAV ---------------- */

  const goToPrevQuestion = () => {
    setQuestionIndex((idx) => (idx > 0 ? idx - 1 : idx));
  };

  const goToNextQuestion = () => {
    setQuestionIndex((idx) =>
      idx + 1 < questions.length ? idx + 1 : idx
    );
  };

  const handleSelectQuestion = (index: number) => {
    setQuestionIndex(index);
  };

  /* ---------------- HELPERS ---------------- */

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const getRoundLabel = () => {
    if (rounds.includes('dsa')) return 'DSA Round';
    if (rounds.includes('coding')) return 'Coding Round';
    if (rounds.includes('technical')) return 'Technical Round';
    return 'HR / Behavioral';
  };

  const getAudioStatus = () => {
    if (isRecording) return 'Recording in progress';
    if (hasPendingAudio && !isEvaluating) return 'Response ready to evaluate';
    if (isEvaluating) return 'Evaluating answer';
    return 'Awaiting your response';
  };
  const audioStatus = getAudioStatus();
  const statusDotClass = (() => {
    if (isRecording) return 'bg-red-400 animate-pulse';
    if (isEvaluating) return 'bg-amber-300 animate-pulse';
    if (hasPendingAudio) return 'bg-emerald-400';
    return 'bg-muted-foreground/40';
  })();

  /* ---------------- CLEANUP ---------------- */

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream
        ?.getTracks()
        .forEach((t) => t.stop());
    };
  }, []);

  /* ---------------- UI ---------------- */

  return (
    <PageTransition>
      <div className="min-h-screen bg-background bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)]">
        <Navbar />

        <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <div className="text-center my-8">
            <span className="px-4 py-1.5 rounded-full bg-secondary/70 text-xs font-semibold tracking-wide uppercase text-foreground/80">
              {getRoundLabel()}
            </span>
            <h1 className="text-3xl font-bold mt-4 text-foreground">
              {isRecording ? 'Recording...' : 'Interview Question'}
            </h1>
            <p className="mt-2 text-base text-muted-foreground max-w-2xl mx-auto">
              Stay focused and speak naturally. You can re-record or upload a file, then evaluate when ready.
            </p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Question {questionIndex + 1} of {questions.length}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevQuestion}
                disabled={!hasMultipleQuestions || questionIndex === 0}
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextQuestion}
                disabled={
                  !hasMultipleQuestions ||
                  questionIndex === questions.length - 1
                }
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-sky-400 to-cyan-300 transition-[width] duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <Card className="mb-8 border border-primary/20 shadow-xl shadow-primary/10 bg-gradient-to-br from-card/95 via-background/80 to-card/95">
            <CardContent className="py-10 px-6 text-center text-xl relative">
              <span className="absolute inset-x-10 top-4 text-xs tracking-[0.3em] uppercase text-primary/60">
                Active Question
              </span>
              "{question}"
            </CardContent>
          </Card>

          <AnimatePresence>
            {showCodeEditor && (
              <CodeEditor
                initialLanguage={initialLanguage}
                onSubmit={handleCodeSubmit}
              />
            )}
          </AnimatePresence>

          <div className="mt-10 space-y-6 text-center rounded-3xl border border-border/40 bg-card/70 backdrop-blur-md p-8 shadow-xl shadow-primary/10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
              {audioStatus}
            </div>

            <div className="font-mono text-3xl text-foreground">
              {formatTime(recordingTime)}
            </div>

            {isRecording ? (
              <Button variant="destructive" onClick={stopRecording} className="shadow-md shadow-rose-400/30">
                <Square className="mr-2" /> Stop Recording
              </Button>
            ) : (
              <Button
                onClick={startRecording}
                className="gradient-bg shadow-lg shadow-primary/40 hover:shadow-primary/60"
              >
                <Mic className="mr-2" /> Start Recording
              </Button>
            )}

            <div className="pt-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <Upload className="h-5 w-5" />
                <span className="font-medium">Upload audio file</span>
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={handleAudioUpload}
                />
              </label>
            </div>

            {audioUrl && (
              <audio controls className="w-full mt-4 rounded-2xl border border-border/40" src={audioUrl} />
            )}

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleEvaluateInterview}
                disabled={!hasPendingAudio || isEvaluating}
                className="w-full sm:w-auto bg-gradient-to-r from-primary via-sky-500 to-cyan-400 text-primary-foreground shadow-lg shadow-sky-500/30 hover:opacity-95"
              >
                {isEvaluating ? 'Evaluating...' : 'Evaluate Interview'}
              </Button>
              {evaluationError && (
                <p className="text-sm text-destructive">{evaluationError}</p>
              )}
              {!hasPendingAudio && (
                <p className="text-sm text-muted-foreground">
                  Record or upload audio before evaluating.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
