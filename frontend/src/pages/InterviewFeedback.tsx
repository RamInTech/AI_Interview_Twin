import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, AlertCircle, Lightbulb, ChevronDown, RefreshCw, ArrowRight } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import PageTransition from '@/components/PageTransition';

// Role labels
const roleLabels: Record<string, string> = {
  'sde': 'Software Development Engineer',
  'frontend': 'Frontend Developer',
  'backend': 'Backend Developer',
  'fullstack': 'Full Stack Developer',
  'data-analyst': 'Data Analyst',
  'ml-engineer': 'Machine Learning Engineer',
  'communication': 'Communication Skills',
};

// Round labels
const roundLabels: Record<string, string> = {
  'hr': 'HR / Behavioral',
  'technical': 'Technical',
  'dsa': 'DSA',
  'coding': 'Coding',
  'communication': 'Communication',
};

// Experience labels
const experienceLabels: Record<string, string> = {
  'fresher': 'Fresher',
  '1-3': '1–3 Years',
  '3+': '3+ Years',
};

// Dynamic feedback based on interview type
const getFeedbackByType = (rounds: string[], role: string) => {
  const hasCoding = rounds.includes('coding') || rounds.includes('dsa');
  const hasTechnical = rounds.includes('technical');
  const hasCommunication = rounds.includes('communication');
  const hasHR = rounds.includes('hr');
  const isCodingRole = ['sde', 'frontend', 'backend', 'fullstack'].includes(role);

  if (hasCoding || isCodingRole) {
    return {
      overallScore: 75,
      strengths: [
        'Good understanding of data structures',
        'Clean and readable code structure',
        'Efficient algorithm choice for the problem',
        'Proper handling of edge cases',
      ],
      improvements: [
        'Consider optimizing time complexity further',
        'Add more inline comments for clarity',
        'Think aloud more while solving problems',
      ],
      tips: [
        'Practice explaining your thought process as you code',
        'Always analyze time and space complexity before coding',
        'Start with brute force, then optimize incrementally',
      ],
      sampleAnswer: `"I would approach this problem by first understanding the constraints. Given an array of integers, I'd use a hash map to store complements. For each element, I check if its complement exists in the map. This gives us O(n) time complexity instead of O(n²) with nested loops. I'd also handle edge cases like empty arrays and duplicate values."`,
    };
  }

  if (hasTechnical) {
    return {
      overallScore: 80,
      strengths: [
        'Strong technical vocabulary usage',
        'Clear explanation of complex concepts',
        'Good use of real-world examples',
        'Demonstrated depth of knowledge',
      ],
      improvements: [
        'Could provide more concrete examples',
        'Consider trade-offs more explicitly',
        'Structure answers with clear sections',
      ],
      tips: [
        'Use the "What, Why, How" framework for technical explanations',
        'Always mention trade-offs when discussing solutions',
        'Relate abstract concepts to practical applications',
      ],
      sampleAnswer: `"REST APIs follow a resource-oriented architecture using HTTP methods like GET, POST, PUT, DELETE. They're stateless and use URLs to identify resources. GraphQL, on the other hand, uses a single endpoint with a query language that lets clients specify exactly what data they need. REST is simpler to cache and debug, while GraphQL reduces over-fetching and is better for complex data relationships."`,
    };
  }

  if (hasCommunication) {
    return {
      overallScore: 82,
      strengths: [
        'Clear and articulate speech',
        'Good use of professional vocabulary',
        'Confident and engaging tone',
        'Well-structured responses',
      ],
      improvements: [
        'Vary your tone for emphasis',
        'Use more transitional phrases',
        'Practice active listening cues',
      ],
      tips: [
        'Mirror the interviewer\'s communication style',
        'Use the "pause and breathe" technique before responding',
        'Practice summarizing key points at the end of answers',
      ],
      sampleAnswer: `"I believe effective communication starts with active listening. When presenting ideas, I structure my thoughts into three main points, use concrete examples, and always check for understanding. In cross-functional teams, I adapt my language based on the audience—technical details for engineers, business impact for stakeholders."`,
    };
  }

  // Default HR/Behavioral
  return {
    overallScore: 78,
    strengths: [
      'Clear articulation of main points',
      'Good use of specific examples',
      'Confident tone throughout the response',
      'Logical structure in your answer',
    ],
    improvements: [
      'Consider reducing filler words (um, uh)',
      'Slightly faster pace in the middle section',
      'Could add more pauses for emphasis',
    ],
    tips: [
      'Practice the STAR method (Situation, Task, Action, Result) for behavioral questions',
      'Record yourself and listen back to identify filler words',
      'Take a breath before answering to gather your thoughts',
    ],
    sampleAnswer: `"In my previous role, I encountered a situation where a team member was consistently missing deadlines. Rather than escalating immediately, I scheduled a one-on-one coffee chat to understand their perspective. I discovered they were dealing with personal challenges and feeling overwhelmed. Together, we worked out a temporary redistribution of tasks and I helped them prioritize their workload. Within a few weeks, they were back on track and our team dynamic improved significantly. This experience taught me the importance of empathy and open communication in leadership."`,
  };
};

export default function InterviewFeedback() {
  const [searchParams] = useSearchParams();
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const role = searchParams.get('role') || '';
  const rounds = searchParams.get('rounds')?.split(',') || ['hr'];
  const experience = searchParams.get('experience') || '';
  const language = searchParams.get('language') || '';
  const difficulty = searchParams.get('difficulty') || '';
  
  const [showSample, setShowSample] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load evaluation results from sessionStorage
    try {
      const results = sessionStorage.getItem('interviewResults');
      if (results) {
        setEvaluationResults(JSON.parse(results));
      }
    } catch (error) {
      console.error('Failed to load evaluation results:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use real evaluation data if available, otherwise fall back to mock data
  const feedback = evaluationResults ? {
    overallScore: Math.round(evaluationResults.final_score),
    transcript: evaluationResults.transcript,
    csScore: evaluationResults.cs_score,
    tcsFeedback: evaluationResults.tcs?.verdict || '',
    tcsImprovements: evaluationResults.tcs?.improvement_points || [],
    placementRecommendations: evaluationResults.placement_feedback?.improvements || [],
    placementFocusAreas: evaluationResults.placement_feedback?.focus_areas || [],
    placementReadiness: 0,
    strengths: [
      'Clear communication and articulation',
      'Good technical understanding demonstrated',
      'Confident and engaging responses',
      'Well-structured approach to problem solving'
    ],
    improvements: (evaluationResults.tcs?.improvement_points && evaluationResults.tcs.improvement_points.length > 0)
      ? evaluationResults.tcs.improvement_points
      : [
        'Could provide more concrete examples',
        'Consider optimizing time complexity further',
        'Structure answers with clear sections'
      ],
    tips: [
      'Practice explaining your thought process clearly',
      'Use specific examples to support your points',
      'Always mention trade-offs when discussing solutions',
      'Structure answers with clear introduction, body, and conclusion'
    ],
    sampleAnswer: `Based on your response, here's a more polished version: "${evaluationResults.placement_feedback?.revised_answer || evaluationResults.transcript || 'I would approach this problem by first understanding the requirements, then breaking it down into smaller components. I\'d consider edge cases and optimize for both time and space complexity while ensuring the solution is maintainable and follows best practices.'}"`
  } : getFeedbackByType(rounds, role);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Build interview summary label
  const getInterviewSummary = () => {
    const parts: string[] = [];
    
    if (role && roleLabels[role]) {
      parts.push(roleLabels[role]);
    }
    
    if (experience && experienceLabels[experience]) {
      parts.push(`(${experienceLabels[experience]})`);
    }
    
    return parts.join(' ');
  };

  const getRoundsLabel = () => {
    return rounds.map(r => roundLabels[r] || r).join(', ');
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">Your Feedback</h1>
            <p className="text-lg text-muted-foreground">
              {getInterviewSummary() && (
                <span className="block mb-1">{getInterviewSummary()}</span>
              )}
              <span>Rounds: {getRoundsLabel()}</span>
            </p>
          </div>

          {/* Overall Score */}
          <Card className="mb-8 overflow-hidden">
            <CardContent className="pt-8 pb-6">
              <div className="text-center mb-6">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(feedback.overallScore)}`}>
                  {feedback.overallScore}
                </div>
                <p className="text-muted-foreground">Performance Score</p>
              </div>
              <Progress value={feedback.overallScore} className="h-3" />
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 mt-2 shrink-0" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Actionable Tips */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Lightbulb className="h-5 w-5" />
                Actionable Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedback.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <span className="font-bold text-primary">{index + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Sample Answer */}
          <Collapsible open={showSample} onOpenChange={setShowSample}>
            <Card className="mb-10">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span>Polished Sample Answer</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${showSample ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground italic leading-relaxed">
                    {feedback.sampleAnswer}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(`/interview/question?${searchParams.toString()}`)}
              className="px-8"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Another Question
            </Button>
            <Button
              size="lg"
              onClick={() => navigate('/')}
              className="gradient-bg text-primary-foreground font-semibold px-8"
            >
              Finish Session
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Encouragement */}
          <p className="text-center text-muted-foreground mt-8">
            Consistent practice improves communication. Keep going!
          </p>
        </div>
      </main>
    </div>
    </PageTransition>
  );
}
