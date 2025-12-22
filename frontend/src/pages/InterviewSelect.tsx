import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Code, ArrowRight, ArrowLeft, Check, Briefcase, Brain, MessageSquare, Terminal } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import PageTransition from '@/components/PageTransition';

const roles = [
  { id: 'sde', label: 'Software Development Engineer (SDE)' },
  { id: 'frontend', label: 'Frontend Developer' },
  { id: 'backend', label: 'Backend Developer' },
  { id: 'fullstack', label: 'Full Stack Developer' },
  { id: 'data-analyst', label: 'Data Analyst' },
  { id: 'ml-engineer', label: 'Machine Learning Engineer' },
  { id: 'communication', label: 'Communication Skills Interview' },
];

const experienceLevels = [
  { id: 'fresher', label: 'Fresher' },
  { id: '1-3', label: '1–3 Years' },
  { id: '3+', label: '3+ Years' },
];

const interviewRounds = [
  {
    id: 'hr',
    title: 'HR / Behavioral',
    description: 'Practice answering questions about your experience, teamwork, and soft skills.',
    icon: Users,
    evaluates: ['Communication clarity', 'Storytelling ability', 'Confidence level', 'Answer structure'],
  },
  {
    id: 'technical',
    title: 'Technical Interview',
    description: 'Explain technical concepts and problem-solving approaches clearly.',
    icon: Code,
    evaluates: ['Explanation clarity', 'Technical communication', 'Logical flow', 'Engagement level'],
  },
  {
    id: 'dsa',
    title: 'DSA Round',
    description: 'Solve data structure and algorithm problems with optimal solutions.',
    icon: Brain,
    evaluates: ['Problem solving', 'Code optimization', 'Time complexity', 'Space complexity'],
  },
  {
    id: 'coding',
    title: 'Coding Round',
    description: 'Write clean, efficient code to solve real-world programming challenges.',
    icon: Terminal,
    evaluates: ['Code quality', 'Logic building', 'Edge case handling', 'Best practices'],
  },
  {
    id: 'communication',
    title: 'Communication Round',
    description: 'Demonstrate your verbal and written communication skills effectively.',
    icon: MessageSquare,
    evaluates: ['Clarity of thought', 'Articulation', 'Active listening', 'Professional tone'],
  },
];

const programmingLanguages = [
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
];

const difficultyLevels = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

const communicationModes = [
  { id: 'text', label: 'Text Based' },
  { id: 'voice', label: 'Voice Based' },
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
    transition: { duration: 0.3, ease: 'easeOut' as const }
  },
  exit: { 
    opacity: 0, 
    height: 0, 
    marginTop: 0,
    transition: { duration: 0.2, ease: 'easeIn' as const }
  },
};

export default function InterviewSelect() {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [selectedRounds, setSelectedRounds] = useState<string[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [programmingLanguage, setProgrammingLanguage] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [communicationMode, setCommunicationMode] = useState<string>('');
  const navigate = useNavigate();

  const handleRoundToggle = (roundId: string) => {
    setSelectedRounds(prev => 
      prev.includes(roundId) 
        ? prev.filter(id => id !== roundId)
        : [...prev, roundId]
    );
  };

  const showCodingOptions = selectedRounds.includes('dsa') || selectedRounds.includes('coding');
  const showCommunicationOptions = selectedRounds.includes('communication');

  const canContinue = selectedRole && experienceLevel && selectedRounds.length > 0 &&
    (!showCodingOptions || (programmingLanguage && difficulty)) &&
    (!showCommunicationOptions || communicationMode);

  const handleContinue = () => {
    if (canContinue) {
      const params = new URLSearchParams({
        role: selectedRole,
        experience: experienceLevel,
        rounds: selectedRounds.join(','),
        ...(programmingLanguage && { language: programmingLanguage }),
        ...(difficulty && { difficulty }),
        ...(communicationMode && { communicationMode }),
      });
      navigate(`/interview/setup?${params.toString()}`);
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
              <h1 className="text-4xl font-bold mb-4">Configure Your Interview</h1>
              <p className="text-lg text-muted-foreground">
                Customize your mock interview experience
              </p>
            </motion.div>

            {/* Role Selection */}
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
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>

            {/* Experience Level */}
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
                    {experienceLevels.map(level => (
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

            {/* Interview Rounds */}
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
                            <Icon className={`h-5 w-5 transition-colors duration-300 ${
                              selectedRounds.includes(id) ? 'text-primary-foreground' : 'text-secondary-foreground'
                            }`} />
                          </motion.div>
                          
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                              scale: selectedRounds.includes(id) ? 1 : 0, 
                              opacity: selectedRounds.includes(id) ? 1 : 0 
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
                                  scale: hoveredCard === id || selectedRounds.includes(id) ? [1, 1.5, 1] : 1 
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

            {/* Conditional: Programming Language & Difficulty */}
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
                            {programmingLanguages.map(lang => (
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
                          {difficultyLevels.map(level => (
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

            {/* Conditional: Communication Mode */}
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
                        {communicationModes.map(mode => (
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

            {/* Action Button */}
            <motion.div 
              className="flex justify-center mt-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: canContinue ? 1.02 : 1 }}
                whileTap={{ scale: canContinue ? 0.98 : 1 }}
              >
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="gradient-bg text-primary-foreground font-semibold px-8"
                >
                  Start Interview
                  <motion.span
                    animate={{ x: canContinue ? [0, 4, 0] : 0 }}
                    transition={{ repeat: canContinue ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }}
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
