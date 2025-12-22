import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import InterviewSelect from '@/pages/InterviewSelect';
import InterviewSetup from '@/pages/InterviewSetup';
import InterviewQuestion from '@/pages/InterviewQuestion';
import InterviewProcessing from '@/pages/InterviewProcessing';
import InterviewFeedback from '@/pages/InterviewFeedback';
import NotFound from '@/pages/NotFound';

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/interview/select" element={<InterviewSelect />} />
        <Route path="/interview/setup" element={<InterviewSetup />} />
        <Route path="/interview/question" element={<InterviewQuestion />} />
        <Route path="/interview/processing" element={<InterviewProcessing />} />
        <Route path="/interview/feedback" element={<InterviewFeedback />} />
        <Route path="/interview/result" element={<Navigate to="/interview/feedback" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}
