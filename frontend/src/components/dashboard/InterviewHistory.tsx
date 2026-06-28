import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Briefcase, ChevronRight, Loader2, Target, Mic, Activity, TrendingUp, Trophy, ClipboardList } from 'lucide-react';

interface InterviewRecord {
  id: string;
  role: string;
  timestamp: any;
  data: {
    final_score: number;
    cs_score: number;
    tcs_score: number;
    transcript?: string;
    placement_feedback?: {
      improvements?: string[];
      standout_strengths?: string[];
      placement_coaching?: {
        placement_focus?: string[];
        current_gaps?: string[];
      };
    };
  };
}

export default function InterviewHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, 'interviews'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const results: InterviewRecord[] = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as InterviewRecord);
        });
        
        setInterviews(results);
      } catch (err) {
        console.error('Failed to fetch interview history:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [user]);

  const stats = useMemo(() => {
    if (!interviews.length) {
      return {
        total: 0,
        avgFinal: 0,
        bestFinal: 0,
        latestTranscript: '',
        latestCoaching: [] as string[],
      };
    }

    const finals = interviews
      .map((i) => Number(i.data.final_score) || 0)
      .filter((n) => !Number.isNaN(n));

    const total = interviews.length;
    const avgFinal = finals.length ? Math.round(finals.reduce((a, b) => a + b, 0) / finals.length) : 0;
    const bestFinal = finals.length ? Math.max(...finals) : 0;
    const latest = interviews[0];
    const latestTranscript = latest?.data?.transcript || '';
    const latestCoaching = latest?.data?.placement_feedback?.improvements || [];

    return { total, avgFinal, bestFinal, latestTranscript, latestCoaching };
  }, [interviews]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your interview history...</p>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <Card className="max-w-3xl mx-auto mt-12 mb-24 border-dashed border-2 bg-muted/10 shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Mic className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Interviews Yet</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            You haven't completed any mock interviews. Start a new session to track your performance and get AI-powered coaching!
          </p>
          <Button onClick={() => navigate('/interview/setup')} className="gradient-bg">
            Start Mock Interview
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 mb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Dashboard</h2>
          <p className="text-muted-foreground mt-1">Review your past performance and coaching feedback</p>
        </div>
        <Button onClick={() => navigate('/interview/setup')} className="gradient-bg hidden sm:flex">
          New Interview
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-10">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Progress
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Completed interviews recorded
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Trophy className="h-4 w-4" /> Best Score
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{stats.bestFinal}/100</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Highest overall performance
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <ClipboardList className="h-4 w-4" /> Average
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{stats.avgFinal}/100</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Rolling average of final scores
          </CardContent>
        </Card>
      </div>

      <Card className="mb-10 border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Target className="h-4 w-4" /> Latest coaching highlights
          </CardTitle>
          <CardDescription>Your most recent feedback and transcript snippet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {stats.latestCoaching && stats.latestCoaching.length > 0 ? (
              stats.latestCoaching.slice(0, 4).map((item, idx) => (
                <span key={idx} className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No coaching points recorded yet.</span>
            )}
          </div>
          {stats.latestTranscript && (
            <div className="rounded-lg border border-muted bg-muted/30 p-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground block mb-1">Last response excerpt</span>
              {stats.latestTranscript.slice(0, 240)}{stats.latestTranscript.length > 240 ? '…' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interviews.map((interview) => {
          // Format date safely
          let dateStr = "Recently";
          if (interview.timestamp?.toDate) {
            dateStr = interview.timestamp.toDate().toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            });
          }

          const score = Math.round(interview.data.final_score || 0);
          const scoreColor = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500';
          const bgBadge = score >= 80 ? 'bg-green-500/10' : score >= 60 ? 'bg-amber-500/10' : 'bg-rose-500/10';

          return (
            <Card key={interview.id} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-primary/10">
              <div className="absolute top-0 right-0 p-4">
                <div className={`h-12 w-12 rounded-full ${bgBadge} flex items-center justify-center shadow-inner`}>
                  <span className={`font-bold ${scoreColor}`}>{score}</span>
                </div>
              </div>
              
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-primary font-medium mb-1">
                  <Briefcase className="h-4 w-4" /> {interview.role}
                </div>
                <CardDescription className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {dateStr}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground"><Activity className="h-4 w-4"/> Communication</span>
                    <span className="font-semibold">{Math.round(interview.data.cs_score || 0)}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground"><Target className="h-4 w-4"/> Technical</span>
                    <span className="font-semibold">{Math.round(interview.data.tcs_score || 0)}/100</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-5">
                <Button 
                  variant="secondary" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => navigate(`/interview/feedback?id=${interview.id}`)}
                >
                  View Full Report <ChevronRight className="h-4 w-4 ml-1 opacity-50 group-hover:opacity-100" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      <Button onClick={() => navigate('/interview/setup')} className="w-full mt-8 gradient-bg sm:hidden">
        New Interview
      </Button>
    </div>
  );
}
