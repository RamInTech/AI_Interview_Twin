import Navbar from '@/components/landing/Navbar';
import PageTransition from '@/components/PageTransition';
import InterviewHistory from '@/components/dashboard/InterviewHistory';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20">
          <InterviewHistory />
        </div>
      </div>
    </PageTransition>
  );
}
