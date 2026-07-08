import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Code,
  ArrowRight,
  ArrowLeft,
  Check,
  Briefcase,
  Brain,
  MessageSquare,
  Terminal,
  Layers,
  Sparkles,
  Cpu,
  FileUp,
  FileCheck2,
  X,
  Loader2,
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import PageTransition from '@/components/PageTransition';
import { interviewApi, ApiError, ResumeProfile } from '@/lib/api';

const roles = [
  { id: 'Software Development Engineer', label: 'Software Development Engineer (SDE)' },
  { id: 'Frontend Developer', label: 'Frontend Developer' },
  { id: 'Backend Developer', label: 'Backend Developer' },
  { id: 'Full Stack Developer', label: 'Full Stack Developer' },
  { id: 'Data Analyst', label: 'Data Analyst' },
  { id: 'Machine Learning Engineer', label: 'Machine Learning Engineer' },
  { id: 'Communication', label: 'Communication Skills Interview' },
  { id: 'GenAI Engineer', label: 'Generative AI Engineer' },
  { id: 'Prompt Engineer', label: 'Prompt Engineer' },
  { id: 'Cloud Architect', label: 'Cloud / Solutions Architect' },
  { id: 'DevOps Engineer', label: 'DevOps / SRE' },
  { id: 'Product Manager', label: 'Product Manager' },
];

const experienceLevels = [
  { id: 'Fresher', label: 'Fresher' },
  { id: '1-3 Years', label: '1–3 Years' },
  { id: '3+ Years', label: '3+ Years' },
];

const interviewRounds = [
  {
    id: 'HR',
    title: 'HR / Behavioral',
    description: 'Practice answering questions about your experience, teamwork, and soft skills.',
    icon: Users,
    evaluates: ['Communication clarity', 'Storytelling ability', 'Confidence level', 'Answer structure'],
  },
  {
    id: 'Technical',
    title: 'Technical Interview',
    description: 'Explain technical concepts and problem-solving approaches clearly.',
    icon: Code,
    evaluates: ['Explanation clarity', 'Technical communication', 'Logical flow', 'Engagement level'],
  },
  {
    id: 'DSA',
    title: 'DSA Round',
    description: 'Solve data structure and algorithm problems with optimal solutions.',
    icon: Brain,
    evaluates: ['Problem solving', 'Code optimization', 'Time complexity', 'Space complexity'],
  },
  {
    id: 'Coding',
    title: 'Coding Round',
    description: 'Write clean, efficient code to solve real-world programming challenges.',
    icon: Terminal,
    evaluates: ['Code quality', 'Logic building', 'Edge case handling', 'Best practices'],
  },
  {
    id: 'Communication',
    title: 'Communication Round',
    description: 'Demonstrate your verbal and written communication skills effectively.',
    icon: MessageSquare,
    evaluates: ['Clarity of thought', 'Articulation', 'Active listening', 'Professional tone'],
  },
  {
    id: 'SystemDesign',
    title: 'System Design',
    description: 'Architect scalable products and defend trade-offs in real time.',
    icon: Layers,
    evaluates: ['Component reasoning', 'Scaling strategy', 'Trade-off clarity', 'Diagram narration'],
  },
  {
    id: 'GenAI',
    title: 'GenAI Deep Dive',
    description: 'Discuss prompting strategies, safety guardrails, and evaluation metrics.',
    icon: Sparkles,
    evaluates: ['Prompt strategy', 'Safety awareness', 'Evaluation rigor', 'Tooling knowledge'],
  },
  {
    id: 'Performance',
    title: 'Performance Debugging',
    description: 'Identify latency bottlenecks and narrate your investigation plan.',
    icon: Cpu,
    evaluates: ['Bottleneck detection', 'Metrics literacy', 'Instrumentation plan', 'Optimization roadmap'],
  },
];

const programmingLanguages = [
  { id: 'C++', label: 'C++' },
  { id: 'Java', label: 'Java' },
  { id: 'Python', label: 'Python' },
  { id: 'JavaScript', label: 'JavaScript' },
];

const difficultyLevels = [
  { id: 'Easy', label: 'Easy' },
  { id: 'Medium', label: 'Medium' },
  { id: 'Hard', label: 'Hard' },
];

const communicationModes = [
  { id: 'text', label: 'Text Based' },
  { id: 'voice', label: 'Voice Based' },
];

const questionCountOptions = [
  { id: 'auto', label: 'Auto (recommended per round)' },
  { id: '3', label: '3 questions' },
  { id: '5', label: '5 questions' },
  { id: '7', label: '7 questions' },
  { id: '10', label: '10 questions' },
  { id: '12', label: '12 questions' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

const iconVariants = {
  idle: { scale: 1, rotate: 0 },
  hover: { scale: 1.1, rotate: 5 },
  tap: { scale: 0.95 },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

const fieldVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    marginTop: 24,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
};


export default function InterviewSelect() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [selectedRounds, setSelectedRounds] = useState<string[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [programmingLanguage, setProgrammingLanguage] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [communicationMode, setCommunicationMode] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<string>('auto');
  const [loading, setLoading] = useState(false);

  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      setIsParsingResume(true);
      setResumeError(null);
      const { resume_profile } = await interviewApi.parseResume(file);
      setResumeProfile(resume_profile);
      setResumeFileName(file.name);
      // Persist for follow-up question generation during the interview
      sessionStorage.setItem('resumeProfile', JSON.stringify(resume_profile));
    } catch (error) {
      console.error('Resume parsing failed:', error);
      setResumeError(
        error instanceof ApiError
          ? error.message
          : 'Failed to parse resume. Is the backend running?'
      );
    } finally {
      setIsParsingResume(false);
    }
  };

  const clearResume = () => {
    setResumeProfile(null);
    setResumeFileName(null);
    setResumeError(null);
    sessionStorage.removeItem('resumeProfile');
  };

  const showCodingOptions =
    selectedRounds.includes('DSA') || selectedRounds.includes('Coding');
  const showCommunicationOptions = selectedRounds.includes('Communication');

  const canContinue =
    selectedRole &&
    experienceLevel &&
    selectedRounds.length > 0 &&
    (!showCodingOptions || (programmingLanguage && difficulty)) &&
    (!showCommunicationOptions || communicationMode);

  const handleRoundToggle = (roundId: string) => {
    setSelectedRounds((prev) =>
      prev.includes(roundId)
        ? prev.filter((id) => id !== roundId)
        : [...prev, roundId]
    );
  };

  const handleContinue = async () => {
    if (!canContinue || loading) return;

    setLoading(true);

    try {
      const interviewRound =
        selectedRounds.includes('DSA')
          ? 'DSA'
          : selectedRounds.includes('Coding')
          ? 'Coding'
          : selectedRounds.includes('Technical')
          ? 'Technical'
          : selectedRounds.includes('Communication')
          ? 'Communication'
          : 'HR';

      const payload = {
        role: selectedRole,
        experience: experienceLevel,
        company_type: 'Service-Based',
        interview_round: interviewRound,
        ...(resumeProfile ? { resume_profile: resumeProfile } : {}),
        ...(questionCount !== 'auto' ? { num_questions: Number(questionCount) } : {}),
        ...(difficulty ? { difficulty } : {}),
      };

      const data = await interviewApi.generateQuestions(payload);

      const params = new URLSearchParams({
        role: selectedRole,
        experience: experienceLevel,
        rounds: selectedRounds.join(','),
        ...(programmingLanguage && { language: programmingLanguage }),
        ...(difficulty && { difficulty }),
        ...(communicationMode && { communicationMode }),
      });

      params.set('questions', JSON.stringify(data.questions));

      navigate(`/interview/question?${params.toString()}`);
    } catch (err) {
      console.error(err);
      const message = err instanceof ApiError ? err.message : 'Failed to generate questions. Please try again.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mb-6 -ml-2 group"
              >
                <motion.span
                  className="inline-flex items-center"
                  whileHover={{ x: -3 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </motion.span>
              </Button>
            </motion.div>

            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Badge className="inline-flex items-center gap-2 mb-4 bg-primary/10 text-primary border-primary/30">
                <Sparkles className="h-3.5 w-3.5" />
                Intelligent practice studio
              </Badge>
              <h1 className="text-4xl font-bold mb-4">Configure Your Interview</h1>
              <p className="text-lg text-muted-foreground">
                Customize your mock interview experience
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Select Role</CardTitle>
                      <CardDescription>Choose the role you're interviewing for</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Experience Level</CardTitle>
                  <CardDescription>Select your years of experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={experienceLevel}
                    onValueChange={setExperienceLevel}
                    className="flex flex-wrap gap-4"
                  >
                    {experienceLevels.map((level) => (
                      <div key={level.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={level.id} id={`exp-${level.id}`} />
                        <Label htmlFor={`exp-${level.id}`} className="cursor-pointer">
                          {level.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <FileUp className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Personalize with Your Resume
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(optional)</span>
                      </CardTitle>
                      <CardDescription>
                        Get questions tailored to your projects, skills and experience
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!resumeProfile ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => resumeInputRef.current?.click()}
                        disabled={isParsingResume}
                        className="w-full flex items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 transition-colors text-muted-foreground"
                      >
                        {isParsingResume ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Analyzing your resume...
                          </>
                        ) : (
                          <>
                            <FileUp className="h-5 w-5" />
                            Upload resume (PDF, DOCX or TXT)
                          </>
                        )}
                      </button>
                      <input
                        ref={resumeInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        hidden
                        onChange={handleResumeUpload}
                      />
                      {resumeError && (
                        <p className="text-sm text-destructive">{resumeError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                        <div className="flex items-center gap-3">
                          <FileCheck2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">{resumeFileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {resumeProfile.projects.length} projects •{' '}
                              {resumeProfile.skills.length} skills •{' '}
                              {resumeProfile.experience.length + resumeProfile.internships.length}{' '}
                              roles detected
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearResume} title="Remove resume">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[...resumeProfile.technologies, ...resumeProfile.skills]
                          .slice(0, 10)
                          .map((skill, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your interview questions will reference these projects and technologies.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold mb-4">Select Interview Rounds</h2>
              <p className="text-muted-foreground mb-6">Choose one or more rounds to practice</p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {interviewRounds.map(({ id, title, description, icon: Icon, evaluates }, index) => (
                  <motion.div
                    key={id}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    onHoverStart={() => setHoveredCard(id)}
                    onHoverEnd={() => setHoveredCard(null)}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 h-full ${
                        selectedRounds.includes(id)
                          ? 'ring-2 ring-primary border-primary shadow-lg shadow-primary/20'
                          : 'hover:border-primary/50 hover:shadow-xl'
                      }`}
                      onClick={() => handleRoundToggle(id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <motion.div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                              selectedRounds.includes(id) ? 'gradient-bg' : 'bg-secondary'
                            }`}
                            variants={iconVariants}
                            initial="idle"
                            animate={hoveredCard === id || selectedRounds.includes(id) ? 'hover' : 'idle'}
                            whileTap="tap"
                          >
                            <Icon
                              className={`h-5 w-5 transition-colors duration-300 ${
                                selectedRounds.includes(id)
                                  ? 'text-primary-foreground'
                                  : 'text-secondary-foreground'
                              }`}
                            />
                          </motion.div>

                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              scale: selectedRounds.includes(id) ? 1 : 0,
                              opacity: selectedRounds.includes(id) ? 1 : 0,
                            }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            className="h-5 w-5 rounded-full gradient-bg flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </motion.div>
                        </div>
                        <CardTitle className="text-base mt-2">{title}</CardTitle>
                        <CardDescription className="text-sm">{description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs font-medium text-muted-foreground mb-2">We'll evaluate:</p>
                        <ul className="space-y-1">
                          {evaluates.slice(0, 3).map((item, i) => (
                            <motion.li
                              key={item}
                              className="text-xs flex items-center gap-2"
                              custom={i}
                              variants={listItemVariants}
                              initial="hidden"
                              animate={hoveredCard === id || selectedRounds.includes(id) ? 'visible' : 'hidden'}
                            >
                              <motion.span
                                className="h-1 w-1 rounded-full bg-primary"
                                animate={{
                                  scale:
                                    hoveredCard === id || selectedRounds.includes(id)
                                      ? [1, 1.5, 1]
                                      : 1,
                                }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                              />
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Number of Questions</CardTitle>
                  <CardDescription>
                    How many questions should this interview have?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger className="w-full md:w-72">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionCountOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Auto uses the standard count for the selected round
                    (HR 6 • Technical 8 • DSA 7 • Coding 5 • Communication 5).
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <AnimatePresence>
              {showCodingOptions && (
                <motion.div
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="text-lg">Coding Preferences</CardTitle>
                      <CardDescription>Configure your DSA/Coding round settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="mb-2 block">Preferred Programming Language</Label>
                        <Select value={programmingLanguage} onValueChange={setProgrammingLanguage}>
                          <SelectTrigger className="w-full md:w-64">
                            <SelectValue placeholder="Select language..." />
                          </SelectTrigger>
                          <SelectContent>
                            {programmingLanguages.map((lang) => (
                              <SelectItem key={lang.id} value={lang.id}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-3 block">Difficulty Level</Label>
                        <RadioGroup
                          value={difficulty}
                          onValueChange={setDifficulty}
                          className="flex flex-wrap gap-4"
                        >
                          {difficultyLevels.map((level) => (
                            <div key={level.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={level.id} id={`diff-${level.id}`} />
                              <Label htmlFor={`diff-${level.id}`} className="cursor-pointer">
                                {level.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showCommunicationOptions && (
                <motion.div
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="text-lg">Communication Mode</CardTitle>
                      <CardDescription>Choose how you'd like to communicate</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={communicationMode}
                        onValueChange={setCommunicationMode}
                        className="flex flex-wrap gap-4"
                      >
                        {communicationModes.map((mode) => (
                          <div key={mode.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={mode.id} id={`comm-${mode.id}`} />
                            <Label htmlFor={`comm-${mode.id}`} className="cursor-pointer">
                              {mode.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="flex justify-center mt-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: canContinue && !loading ? 1.02 : 1 }}
                whileTap={{ scale: canContinue && !loading ? 0.98 : 1 }}
              >
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={!canContinue || loading}
                  className="gradient-bg text-primary-foreground font-semibold px-8"
                >
                  {loading ? 'Generating Questions...' : 'Start Interview'}
                  <motion.span
                    animate={{ x: !loading && canContinue ? [0, 4, 0] : 0 }}
                    transition={{ repeat: !loading && canContinue ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.span>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
