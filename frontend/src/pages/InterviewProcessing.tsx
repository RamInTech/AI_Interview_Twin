import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import PageTransition from '@/components/PageTransition';
import { interviewApi, ApiError } from '@/lib/api';

export default function InterviewProcessing() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const processInterview = async () => {
      try {
        // Get audio blob and questions from URL params
        // Prefer sessionStorage audio to avoid URL bloat; fall back to query if present
        let audioBase64 = sessionStorage.getItem('recordedAudio') || searchParams.get('audio');
        const questionsStr = searchParams.get('questions');
        const questionIndexParam = searchParams.get('questionIndex');
        const questionIndex = questionIndexParam ? Number(questionIndexParam) : 0;
        
        if (!audioBase64) {
          throw new Error('No audio data found. Please go back and record your answer.');
        }
        
        if (!questionsStr) {
          throw new Error('No questions found. Please go back and restart the interview.');
        }

        // Convert base64 to blob
        const audioBytes = atob(audioBase64);
        const audioArray = new Uint8Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
          audioArray[i] = audioBytes.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: 'audio/webm' });
        
        // Convert blob to file (API expects File type)
        const audioFile = new File([audioBlob], 'answer.webm', { type: 'audio/webm' });
        
        // Parse questions
        const questions = JSON.parse(questionsStr);
        const selectedQuestion = Array.isArray(questions) && questions.length > 0
          ? questions[Math.max(0, Math.min(questionIndex, questions.length - 1))]
          : null;
        const questionsPayload = selectedQuestion ? [selectedQuestion] : questions;
        
        console.log('Evaluating interview with questions:', questions);

        // Call backend API
        const response = await interviewApi.evaluateInterview({
          audio: audioFile,
          questions: JSON.stringify(questionsPayload)
        });

        console.log('Evaluation response:', response);

        // Store results in sessionStorage and navigate
        sessionStorage.setItem('interviewResults', JSON.stringify(response));
        navigate(`/interview/feedback`);
        
      } catch (error) {
        console.error('Interview evaluation failed:', error);
        setError(error instanceof ApiError ? error.message : 'Failed to process interview');
        
        // Redirect to question page after error
        setTimeout(() => {
          navigate('/interview/question');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    processInterview();
  }, [navigate, searchParams]);

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-center space-y-8 max-w-lg mx-auto">
          {error ? (
            // Error state
            <>
              <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center">
                  <span className="text-destructive-foreground text-sm">!</span>
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-destructive">Processing Failed</h1>
                <p className="text-lg text-muted-foreground">
                  {error}
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting you back to try again...
                </p>
              </div>
            </>
          ) : isProcessing ? (
            // Loading state
            <>
              {/* Animated loader */}
              <div className="relative">
                <div className="h-24 w-24 mx-auto rounded-full gradient-bg opacity-20 animate-ping" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full gradient-bg flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold">Analyzing Your Response...</h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  We're evaluating communication patterns and preparing personalized feedback
                </p>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </>
          ) : (
            // Success state
            <>
              <div className="h-16 w-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-green-100 text-sm">✓</span>
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">Analysis Complete!</h1>
                <p className="text-lg text-muted-foreground">
                  Preparing your personalized feedback report...
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
    </PageTransition>
  );
}
