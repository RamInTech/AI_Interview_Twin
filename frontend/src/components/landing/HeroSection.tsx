import { Button } from '@/components/ui/button';
import { Mic, MessageCircle, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import AnimatedBackground from './AnimatedBackground';

const features = [
  { icon: MessageCircle, label: 'Clarity of speech' },
  { icon: TrendingUp, label: 'Confidence & tone' },
  { icon: Clock, label: 'Speaking pace' },
  { icon: Mic, label: 'Filler words & pauses' },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate('/interview/select');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Animated AI Background */}
      <AnimatedBackground />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 backdrop-blur-sm mb-8 border border-border/50"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-sm font-medium text-secondary-foreground">AI-Powered Interview Practice</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
        >
          <span className="block">Master Your</span>
          <span className="gradient-text">Interview Skills</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Practice interviews and get AI-powered feedback on your communication. 
          Build confidence, one answer at a time.
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          {features.map(({ icon: Icon, label }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg"
            >
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.02, 1],
              boxShadow: [
                '0 0 0 0 hsl(var(--primary) / 0)',
                '0 0 0 8px hsl(var(--primary) / 0.15)',
                '0 0 0 0 hsl(var(--primary) / 0)'
              ]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="inline-block rounded-xl"
          >
            <Button
              size="lg"
              onClick={handleStart}
              className="gradient-bg text-primary-foreground font-semibold text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Mock Interview
            </Button>
          </motion.div>
        </motion.div>

        {/* Trust text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-6 text-sm text-muted-foreground"
        >
          This tool evaluates communication only, not knowledge or intelligence.
        </motion.p>
      </div>
    </section>
  );
}
