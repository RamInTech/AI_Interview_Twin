import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Mic, Volume2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import PageTransition from '@/components/PageTransition';
import { interviewApi, ApiError } from '@/lib/api';

const instructions = [
  { id: 1, text: 'Find a quiet place with minimal background noise', icon: Volume2 },
  { id: 2, text: 'Speak naturally, as you would in a real interview', icon: Mic },
  { id: 3, text: 'Pausing or thinking before answering is perfectly okay', icon: CheckCircle2 },
  { id: 4, text: 'There is no strict time limit — take your time', icon: Circle },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function InterviewSetup() {
  const [searchParams] = useSearchParams();
  const interviewType = searchParams.get('type') || 'hr';
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const navigate = useNavigate();

  // Extract interview configuration from search params
  const role = searchParams.get('role') || 'sde';
  const experience = searchParams.get('experience') || 'fresher';
  const rounds = searchParams.get('rounds')?.split(',') || ['hr'];
  const companyType = 'Service-Based'; // Default value from README
  const interviewRound = rounds[0] || 'hr'; // Use first selected round

  useEffect(() => {
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then((result) => {
        setMicPermission(result.state === 'granted' ? 'granted' : 'pending');
        result.onchange = () => {
          setMicPermission(result.state === 'granted' ? 'granted' : 'denied');
        };
      })
      .catch(() => setMicPermission('pending'));
  }, []);

  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
    } catch {
      setMicPermission('denied');
    }
  };

  const toggleItem = (id: number) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    try {
      setIsGeneratingQuestions(true);
      
      // Map role IDs to display names
      const roleMap: Record<string, string> = {
        'sde': 'Software Development Engineer',
        'frontend': 'Frontend Developer',
        'backend': 'Backend Developer',
        'fullstack': 'Full Stack Developer',
        'data-analyst': 'Data Analyst',
        'ml-engineer': 'Machine Learning Engineer',
        'communication': 'Communication Skills Interview'
      };

      // Map experience IDs to display names
      const experienceMap: Record<string, string> = {
        'fresher': 'Fresher',
        '1-3': '1-3 Years',
        '3+': '3+ Years'
      };

      // Map interview round IDs to display names
      const roundMap: Record<string, string> = {
        'hr': 'HR',
        'technical': 'Technical',
        'dsa': 'DSA',
        'coding': 'Coding',
        'communication': 'Communication'
      };

      const request = {
        role: roleMap[role] || role,
        experience: experienceMap[experience] || experience,
        company_type: companyType,
        interview_round: roundMap[interviewRound] || interviewRound
      };

      console.log('Generating questions with request:', request);

      const response = await interviewApi.generateQuestions(request);
      console.log('Generated questions:', response);

      // Navigate to InterviewQuestion with questions
      const params = new URLSearchParams(searchParams);
      params.set('questions', JSON.stringify(response.questions));
      navigate(`/interview/question?${params.toString()}`);
      
    } catch (error) {
      console.error('Failed to generate questions:', error);
      
      // Show user-friendly error message
      if (error instanceof ApiError) {
        alert(`Failed to generate questions: ${error.message}`);
      } else {
        alert('Failed to generate questions. Please check your connection and try again.');
      }
      
      // Still navigate to question page with empty questions so user can proceed
      const params = new URLSearchParams(searchParams);
      params.set('questions', JSON.stringify([]));
      navigate(`/interview/question?${params.toString()}`);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                onClick={() => navigate('/interview/select')}
                className="mb-6 -ml-2 group"
              >
                <motion.div
                  className="flex items-center"
                  whileHover={{ x: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                  Back
                </motion.div>
              </Button>
            </motion.div>

            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-4xl font-bold mb-4">Before You Begin</h1>
              <p className="text-lg text-muted-foreground">
                A few tips to help you get the most out of your practice
              </p>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <Card className="mb-8 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {instructions.map(({ id, text, icon: Icon }) => (
                      <motion.button
                        key={id}
                        variants={itemVariants}
                        onClick={() => toggleItem(id)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                            checkedItems.includes(id)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                          animate={{
                            scale: checkedItems.includes(id) ? [1, 1.2, 1] : 1,
                            rotate: checkedItems.includes(id) ? [0, 10, 0] : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <AnimatePresence mode="wait">
                            {checkedItems.includes(id) ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="icon"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Icon className="h-4 w-4" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        <motion.span
                          className={checkedItems.includes(id) ? 'text-muted-foreground' : ''}
                          animate={{
                            textDecoration: checkedItems.includes(id) ? 'line-through' : 'none',
                          }}
                        >
                          {text}
                        </motion.span>
                      </motion.button>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <Card className="mb-10 overflow-hidden">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          micPermission === 'granted' ? 'bg-green-100 text-green-600' :
                          micPermission === 'denied' ? 'bg-destructive/10 text-destructive' :
                          'bg-secondary text-secondary-foreground'
                        }`}
                        animate={{
                          scale: micPermission === 'granted' ? [1, 1.1, 1] : 1,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          animate={{
                            rotate: micPermission === 'granted' ? [0, 10, -10, 0] : 0,
                          }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        >
                          <Mic className="h-5 w-5" />
                        </motion.div>
                      </motion.div>
                      <div>
                        <p className="font-medium">Microphone Access</p>
                        <p className="text-sm text-muted-foreground">
                          {micPermission === 'granted' && 'Ready to record'}
                          {micPermission === 'denied' && 'Permission denied - please enable in browser settings'}
                          {micPermission === 'pending' && 'Required to record your answers'}
                        </p>
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      {micPermission !== 'granted' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Button
                            variant="outline"
                            onClick={requestMicPermission}
                            className="relative overflow-hidden"
                          >
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Enable
                            </motion.span>
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={micPermission === 'denied' || isGeneratingQuestions}
                  className="gradient-bg text-primary-foreground font-semibold px-8 group"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      Start Interview
                      <motion.div
                        className="ml-2"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
