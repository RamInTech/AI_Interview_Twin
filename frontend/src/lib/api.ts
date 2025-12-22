// API service layer for frontend-backend communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface GenerateQuestionsRequest {
  role: string;
  experience: string;
  company_type: string;
  interview_round: string;
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

export interface EvaluateResponse {
  transcript: string;
  cs_score: number;
  tcs: TcsResult;
  final_score: number;
  placement_feedback: PlacementFeedback;
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
};
