import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import PageTransition from "@/components/PageTransition";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  ChevronDown,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Mic,
  Code,
  Target,
  FileText,
  TrendingUp,
  Crosshair,
  GraduationCap,
} from "lucide-react";

export default function InterviewFeedback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("interviewResults");
    if (!stored) {
      navigate("/");
      return;
    }
    setData(JSON.parse(stored));
  }, [navigate]);

  if (!data) return null;

  const scoreColor = (score: number) =>
    score >= 80
      ? "text-green-300"
      : score >= 60
      ? "text-yellow-200"
      : "text-red-200";

  const technicalScore = data.tcs_score ?? 0;
  const technicalBand = data.tcs_band ?? '—';
  const technicalVerdict = data.tcs_verdict ?? '';

  const technicalIssues = data.tcs_issues ?? [];
  const coachingFeedback = data.tcs_improvements ?? [];

  const technicalScoreDisplay =
    technicalScore !== undefined && technicalScore !== null
      ? `${technicalScore} / 100`
      : "—";

  const strengths =
  data.placement_feedback?.standout_strengths ?? [];

  const improvementBadges =
    data.placement_feedback?.improvements ??
    data.placement_feedback?.top_improvements ??
    [];
  const timelineSteps =
    data.placement_feedback?.lags ??
    data.placement_feedback?.placement_coaching?.current_gaps ??
    [];
  const placementFocusAreas =
  data.placement_feedback?.placement_coaching?.placement_focus ?? [];


  const highlightStats = [
    {
      label: "Speaking Pace",
      value: data.cs_metrics?.wpm
        ? `${Math.round(data.cs_metrics.wpm)} WPM`
        : "—",
      icon: Mic,
    },
    {
      label: "Filler Words",
      value: data.cs_metrics?.filler_count ?? "—",
      icon: AlertCircle,
    },
    {
      label: "Confidence Band",
      value: technicalBand ?? "—",
      icon: Target,
    },
  ];

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-background overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-400/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-sky-300/20 blur-3xl" />
        </div>
        <Navbar />

        <main className="relative pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto space-y-10">
            <section className="text-center space-y-4">
              <span className="inline-flex items-center px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide">
                Personalized AI Feedback
              </span>
              <h1 className="text-4xl font-bold tracking-tight">
                Interview Evaluation Report
              </h1>
              <p className="text-muted-foreground text-base">
                AI-powered mock interview analysis & placement coaching
              </p>
            </section>

            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-500 via-purple-400 to-blue-200 text-white shadow-2xl">
              <div className="absolute inset-0 opacity-30 mix-blend-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent)]" />
              <CardContent className="relative py-10 text-center space-y-4">
                <div
                  className={`text-6xl font-extrabold ${scoreColor(
                    data.final_score
                  )} drop-shadow`}
                >
                  {Math.round(data.final_score)}
                </div>
                <p className="text-sm uppercase tracking-[0.3em]">
                  Final Interview Score
                </p>
                <Progress value={data.final_score} className="h-3 bg-white/30" />
              </CardContent>
            </Card>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/70 shadow-xl backdrop-blur dark:bg-slate-900/70">
                <CardContent className="py-6 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mic className="h-4 w-4" /> Communication Score
                  </div>
               <div className="text-3xl font-semibold">
                    {typeof data.cs_score === "number"
                      ? data.cs_score.toFixed(2)
                      : "—"}{" "}
                    / 100
                  </div>

                </CardContent>
              </Card>

              <Card className="bg-white/70 shadow-xl backdrop-blur dark:bg-slate-900/70">
                <CardContent className="py-6 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Code className="h-4 w-4" /> Technical Correctness
                  </div>
                  <div className="text-3xl font-semibold">{technicalScoreDisplay}</div>
                  {technicalBand && (
                    <span className="inline-block w-fit px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                      {technicalBand}
                    </span>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/70 shadow-xl backdrop-blur dark:bg-slate-900/70">
                <CardContent className="py-6 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" /> Placement Readiness
                  </div>
                  <div className="text-lg font-medium text-green-600">Strong Potential</div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <Card className="border-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Standout Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {strengths.length ? (
                    strengths.map((area: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-full border border-emerald-200/60 bg-white/60 px-3 py-1 text-xs font-medium text-emerald-700 backdrop-blur"
                      >
                        {area}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No strengths logged.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-orange-500/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-500" /> Top Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {improvementBadges.length ? (
                    improvementBadges.map((imp: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-full border border-amber-200/60 bg-white/70 px-3 py-1 text-xs font-medium text-amber-700 backdrop-blur"
                      >
                        {imp}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No improvements logged.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <Card className="border border-white/10 bg-white/75 shadow-xl backdrop-blur dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle>Communication Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {highlightStats.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-lg backdrop-blur dark:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {label}
                          </p>
                          <p className="text-lg font-semibold">{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" /> Pace is fast (≈
                    {data.cs_metrics?.wpm ?? "—"} WPM). Slow down slightly.
                  </li>
                  <li className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" /> Break long explanations with pauses.
                  </li>
                  <li className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" /> Tone sounds slightly uncertain.
                  </li>
                </ul>

                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-primary text-sm">
                    View Detailed Metrics <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 text-sm text-muted-foreground space-y-1">
                    <p>Words per minute: {data.cs_metrics?.wpm ?? "—"}</p>
                    <p>Filler count: {data.cs_metrics?.filler_count ?? "—"}</p>
                    <p>Hedge words: {data.cs_metrics?.hedge_count ?? "—"}</p>
                    <p>Monotone score: {data.cs_metrics?.monotone_score ?? "—"}</p>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            <Collapsible>
              <Card className="overflow-hidden border border-white/10 bg-white/70 shadow-xl backdrop-blur dark:bg-slate-900/70">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Interview Transcript
                      </span>
                      <ChevronDown className="h-5 w-5" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="max-h-72 overflow-y-auto rounded-md border border-white/20 bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-line">
                      {data.transcript || "Transcript not available."}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <Card className="border border-white/10 bg-white/75 shadow-xl backdrop-blur dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle>Technical Correctness Evaluation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">{technicalVerdict}</p>

                <div>
                  <p className="font-medium mb-2">Issues Identified</p>
                  <ul className="space-y-2 text-sm">
                    {technicalIssues.length ? (
                      technicalIssues.map((issue: string, idx: number) => (
                        <li key={idx} className="flex gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          {issue}
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No major issues identified.</li>
                    )}
                  </ul>
                </div>


                <div>
                  <p className="flex items-center gap-2 font-medium mb-2">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    Coaching Feedback
                  </p>
                  <ul className="space-y-2 text-sm">
                    {coachingFeedback.length ? (
                      coachingFeedback.map((tip: string, idx: number) => (
                        <li key={idx} className="flex gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                          {tip}
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No coaching feedback available.</li>
                    )}
                  </ul>
                </div>

              </CardContent>
            </Card>

            <Card className="border-green-500/60 bg-gradient-to-br from-green-100 via-white to-green-50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" /> Placement-Ready Answer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-sm">
                  {data.placement_feedback?.revised_answer ?? "No suggested answer available."}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-white/75 shadow-xl backdrop-blur dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle>Placement Coaching Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-sm">
                <div>
                  <p className="flex items-center gap-2 font-medium mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" /> Where the Candidate Lags
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    {timelineSteps.length ? (
                      timelineSteps.map((l: string, i: number) => <li key={i}>{l}</li>)
                    ) : (
                      <li className="list-none text-muted-foreground">No lags logged.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <p className="flex items-center gap-2 font-medium mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" /> What Should Be Improved
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    {improvementBadges.length ? (
                      improvementBadges.map((imp: string, i: number) => <li key={i}>{imp}</li>)
                    ) : (
                      <li className="list-none text-muted-foreground">No improvements logged.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <p className="flex items-center gap-2 font-medium mb-2">
                    <Crosshair className="h-4 w-4 text-green-600" /> Areas to Focus for Placements
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {placementFocusAreas.length ? (
                      placementFocusAreas.map((area: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-muted text-xs font-medium"
                        >
                          {area}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">No focus areas logged.</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                className="border-primary/30 bg-white/70 shadow-lg backdrop-blur hover:border-primary"
                onClick={() => navigate(`/interview/question?${searchParams.toString()}`)}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Try Another Question
              </Button>
              <Button
                className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/40 transition hover:opacity-90"
                onClick={() => navigate("/")}
              >
                Finish Session <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
