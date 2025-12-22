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

  /* ---------------- AUDIO STATE ---------------- */

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------------- START RECORDING ---------------- */

  const startRecording = async () => {
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
      await sendAudioToBackend(audioBlob);
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

  const handleAudioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setAudioUrl(URL.createObjectURL(file));
    await sendAudioToBackend(file);
    setIsUploading(false);
  };

  /* ---------------- BACKEND CALL ---------------- */

  const sendAudioToBackend = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      const audioFile = new File([audioBlob], 'answer.webm', { type: 'audio/webm' });
      formData.append('audio', audioFile);
      formData.append('questions', JSON.stringify([question]));

      const res = await fetch(`${API_BASE_URL}/api/interview/evaluate`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Evaluation failed');

      const result = await res.json();

      // Persist results so feedback page can load them
      sessionStorage.setItem('interviewResults', JSON.stringify(result));

      // Preserve existing query params (role, rounds, etc.) when moving to feedback
      const params = new URLSearchParams(searchParams);
      navigate(`/interview/feedback?${params.toString()}`);

    } catch (err) {
      console.error('Backend error:', err);
    }
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
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-24 px-4 max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <div className="text-center my-8">
            <span className="px-3 py-1 rounded-full bg-secondary text-sm">
              {getRoundLabel()}
            </span>
            <h1 className="text-3xl font-bold mt-4">
              {isRecording ? 'Recording...' : 'Interview Question'}
            </h1>
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

          <Card className="mb-8">
            <CardContent className="py-8 text-center text-xl">
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

          {/* AUDIO CONTROLS */}
          <div className="mt-10 space-y-6 text-center">
            <div className="font-mono text-xl">{formatTime(recordingTime)}</div>

            {isRecording ? (
              <Button variant="destructive" onClick={stopRecording}>
                <Square className="mr-2" /> Stop Recording
              </Button>
            ) : (
              <Button onClick={startRecording} className="gradient-bg">
                <Mic className="mr-2" /> Start Recording
              </Button>
            )}

            {/* UPLOAD OPTION */}
            <div className="pt-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <Upload className="h-5 w-5" />
                <span className="font-medium">
                  Upload audio file
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={handleAudioUpload}
                />
              </label>
            </div>

            {isUploading && (
              <p className="text-sm text-muted-foreground">
                Uploading & evaluating...
              </p>
            )}

            {audioUrl && (
              <audio controls className="w-full mt-4" src={audioUrl} />
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
