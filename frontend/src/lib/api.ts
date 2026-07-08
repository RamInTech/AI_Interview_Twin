// API service layer for frontend-backend communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface GenerateQuestionsRequest {
  role: string;
  experience: string;
  company_type: string;
  interview_round: string;
  resume_profile?: ResumeProfile;
  num_questions?: number;
  difficulty?: string;
}

export interface GenerateQuestionsResponse {
  questions: string[];
}

export interface EvaluateRequest {
  audio: File;
  questions: string;
}

export interface TcsResult {
  score: number;
  band: string;
  verdict: string;
  issues: string[];
  improvement_points: string[];
}

export interface PlacementFeedback {
  revised_answer: string;
  lags: string[];
  improvements: string[];
  focus_areas: string[];
}

export interface CameraPresenceResult {
  overall_score: number;
  classification: string;
  metric_scores: Record<string, number>;
  strengths: string[];
  improvements: string[];
  observations: Record<string, string>;
  coaching_suggestions: string[];
  summary: string;
  metrics_raw: Record<string, number>;
}

export interface OverallAssessment {
  performance_summary: string;
  score_breakdown: {
    communication: number;
    technical: number;
    camera_presence: number | null;
    coding: number | null;
    final: number;
  };
  recommendations: string[];
}

export interface EvaluateResponse {
  transcript: string;
  cs_score: number;
  tcs: TcsResult;
  camera_presence: CameraPresenceResult | null;
  cps_score: number | null;
  coding_score: number | null;
  code_submissions: CodeSubmission[];
  final_score: number;
  overall_assessment: OverallAssessment;
  placement_feedback: PlacementFeedback;
}

/* ---------------- Resume ---------------- */

export interface ResumeProject {
  name: string;
  description: string;
  technologies: string[];
  highlights: string[];
}

export interface ResumeExperience {
  title: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface ResumeProfile {
  name: string;
  summary: string;
  education: { degree: string; institution: string; year: string }[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  skills: string[];
  technologies: string[];
  certifications: string[];
  achievements: string[];
  internships: ResumeExperience[];
}

/* ---------------- Coding ---------------- */

export interface CodingTestCase {
  input: string;
  expected_output: string;
  explanation?: string;
}

export interface CodingProblem {
  title: string;
  description: string;
  difficulty: string;
  input_format: string;
  output_format: string;
  constraints: string[];
  sample_tests: CodingTestCase[];
  hidden_tests: CodingTestCase[];
}

export interface TestCaseResult {
  index: number;
  passed: boolean;
  hidden?: boolean;
  input: string;
  expected_output: string;
  actual_output: string;
  stderr: string;
  compile_output: string;
  time_ms: number | null;
  memory_kb: number | null;
}

export interface TestRunSummary {
  results: TestCaseResult[];
  passed: number;
  total: number;
  all_passed: boolean;
  avg_time_ms: number | null;
  max_memory_kb: number | null;
}

export interface CodeExecution {
  success: boolean;
  stdout: string;
  stderr: string;
  compile_output: string;
  exit_code: number;
  time_ms: number | null;
  memory_kb: number | null;
}

export interface RunCodeResponse {
  test_run?: TestRunSummary;
  execution?: CodeExecution;
}

export interface CodeEvaluation {
  score: number;
  review_score: number;
  test_pass_pct: number;
  verdict: string;
  complexity: { time: string; space: string };
  algorithm_feedback: string;
  strengths: string[];
  issues: string[];
  optimizations: string[];
}

export interface CodeSubmission {
  problem_title: string;
  language: string;
  test_summary: TestRunSummary;
  evaluation: CodeEvaluation;
  code?: string;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }
  return response.json();
}

export const interviewApi = {
  /**
   * Generate interview questions based on user selection
   */
  async generateQuestions(request: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/interview/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return handleResponse<GenerateQuestionsResponse>(response);
  },

  /**
   * Evaluate interview audio and questions
   */
  async evaluateInterview(request: EvaluateRequest): Promise<EvaluateResponse> {
    const formData = new FormData();
    formData.append('audio', request.audio);
    formData.append('questions', request.questions);

    const response = await fetch(`${API_BASE_URL}/api/interview/evaluate`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<EvaluateResponse>(response);
  },

  /**
   * Upload a resume (PDF/DOCX/TXT) and get a structured profile back
   */
  async parseResume(file: File): Promise<{ resume_profile: ResumeProfile }> {
    const formData = new FormData();
    formData.append('resume', file, file.name);

    const response = await fetch(`${API_BASE_URL}/api/interview/parse-resume`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<{ resume_profile: ResumeProfile }>(response);
  },

  /**
   * Generate one contextual follow-up question. Attach the recorded
   * answer so the follow-up probes what the candidate actually said.
   */
  async generateFollowUp(params: {
    question: string;
    askedQuestions: string[];
    resumeProfile?: ResumeProfile | null;
    audio?: Blob | null;
  }): Promise<{ question: string }> {
    const formData = new FormData();
    formData.append('question', params.question);
    formData.append('asked_questions', JSON.stringify(params.askedQuestions));
    if (params.resumeProfile) {
      formData.append('resume_profile', JSON.stringify(params.resumeProfile));
    }
    if (params.audio) {
      formData.append('audio', params.audio, 'answer.webm');
    }

    const response = await fetch(`${API_BASE_URL}/api/interview/follow-up`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<{ question: string }>(response);
  },

  /**
   * Turn an interview question into an auto-judgeable coding problem
   */
  async getCodingProblem(question: string, difficulty = 'Medium'): Promise<CodingProblem> {
    const response = await fetch(`${API_BASE_URL}/api/interview/code/problem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, difficulty }),
    });

    return handleResponse<CodingProblem>(response);
  },

  /**
   * Run code against sample tests and/or custom stdin (not scored)
   */
  async runCode(params: {
    language: string;
    code: string;
    stdin?: string;
    tests?: CodingTestCase[];
  }): Promise<RunCodeResponse> {
    const response = await fetch(`${API_BASE_URL}/api/interview/code/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: params.language,
        code: params.code,
        stdin: params.stdin ?? '',
        tests: params.tests,
      }),
    });

    return handleResponse<RunCodeResponse>(response);
  },

  /**
   * Submit code: judged against sample + hidden tests, then AI-reviewed
   */
  async submitCode(params: {
    language: string;
    code: string;
    problem: CodingProblem;
  }): Promise<CodeSubmission> {
    const response = await fetch(`${API_BASE_URL}/api/interview/code/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    return handleResponse<CodeSubmission>(response);
  },
};
