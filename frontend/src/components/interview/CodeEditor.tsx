import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Editor, { OnMount } from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Code,
  Play,
  Loader2,
  Send,
  Moon,
  Sun,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  RefreshCw,
  FileText,
  Terminal,
  Sparkles,
} from 'lucide-react';
import {
  interviewApi,
  CodingProblem,
  CodeSubmission,
  TestRunSummary,
  CodeExecution,
} from '@/lib/api';

/* -------------------- Language Config -------------------- */

const languages = [
  { id: 'cpp', label: 'C++', monacoId: 'cpp' },
  { id: 'java', label: 'Java', monacoId: 'java' },
  { id: 'python', label: 'Python', monacoId: 'python' },
  { id: 'javascript', label: 'JavaScript', monacoId: 'javascript' },
  { id: 'go', label: 'Go', monacoId: 'go' },
  { id: 'rust', label: 'Rust', monacoId: 'rust' },
];

const defaultCodeTemplates: Record<string, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Read input from stdin, write the answer to stdout

    return 0;
}`,
  java: `import java.util.*;

// Keep the class non-public (the judge stores the file as prog.java)
class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input from stdin, write the answer to stdout

    }
}`,
  python: `import sys

def solve():
    # Read input from stdin, print the answer to stdout
    data = sys.stdin.read().split()

solve()`,
  javascript: `// Read input from stdin, write the answer to stdout
const data = require('fs').readFileSync(0, 'utf8').trim();

`,
  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    reader := bufio.NewReader(os.Stdin)
    writer := bufio.NewWriter(os.Stdout)
    defer writer.Flush()
    // Read input from stdin, write the answer to stdout
    _ = reader
    _ = fmt.Sprint
}`,
  rust: `use std::io::{self, Read, Write};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    // Read input from stdin, write the answer to stdout
}`,
};

/* -------------------- Props -------------------- */

interface CodeEditorProps {
  question?: string;
  difficulty?: string;
  initialLanguage?: string;
  onSubmit?: (code: string, language: string) => void;
  onSubmissionRecorded?: (submission: CodeSubmission) => void;
}

/* -------------------- Component -------------------- */

export default function CodeEditor({
  question,
  difficulty = 'Medium',
  initialLanguage = 'python',
  onSubmit,
  onSubmissionRecorded,
}: CodeEditorProps) {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(
    defaultCodeTemplates[initialLanguage] || defaultCodeTemplates.python
  );
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark');

  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [problemError, setProblemError] = useState<string | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);

  const [customInput, setCustomInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [runResults, setRunResults] = useState<TestRunSummary | null>(null);
  const [customExecution, setCustomExecution] = useState<CodeExecution | null>(null);
  const [submission, setSubmission] = useState<CodeSubmission | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedLang = languages.find((l) => l.id === language);

  // Keep latest handler in a ref so Monaco's registered shortcut stays fresh
  const runRef = useRef<() => void>(() => {});

  /* -------------------- Problem Loading -------------------- */

  const loadProblem = useCallback(async () => {
    if (!question?.trim()) return;
    try {
      setIsLoadingProblem(true);
      setProblemError(null);
      const p = await interviewApi.getCodingProblem(question, difficulty);
      setProblem(p);
    } catch (err) {
      console.error('Failed to load coding problem:', err);
      setProblemError('Could not generate a structured problem. You can still write and run code with custom input.');
    } finally {
      setIsLoadingProblem(false);
    }
  }, [question, difficulty]);

  useEffect(() => {
    setProblem(null);
    setRunResults(null);
    setSubmission(null);
    setCustomExecution(null);
    loadProblem();
  }, [loadProblem]);

  /* -------------------- Handlers -------------------- */

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(defaultCodeTemplates[newLanguage] || '');
    setRunResults(null);
    setCustomExecution(null);
  };

  const handleRun = async () => {
    if (!code.trim() || isRunning) return;

    try {
      setIsRunning(true);
      setActionError(null);
      setRunResults(null);
      setCustomExecution(null);

      const res = await interviewApi.runCode({
        language,
        code,
        stdin: customInput,
        tests: problem?.sample_tests,
      });

      setRunResults(res.test_run ?? null);
      setCustomExecution(res.execution ?? null);
    } catch (err) {
      console.error('Run failed:', err);
      setActionError('Failed to run code. Check your connection and try again.');
    } finally {
      setIsRunning(false);
    }
  };
  runRef.current = handleRun;

  const handleSubmit = async () => {
    if (!code.trim() || isSubmitting) return;

    // Without a structured problem there is nothing to judge against —
    // fall back to the legacy submit callback
    if (!problem) {
      onSubmit?.(code, language);
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);

      const result = await interviewApi.submitCode({ language, code, problem });
      const recorded: CodeSubmission = { ...result, code };

      setSubmission(recorded);
      onSubmissionRecorded?.(recorded);
      onSubmit?.(code, language);
    } catch (err) {
      console.error('Submit failed:', err);
      setActionError('Failed to submit code. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    // Ctrl/Cmd + Enter → Run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runRef.current();
    });
  };

  const isCodeEmpty = !code.trim() || code === defaultCodeTemplates[language];

  /* -------------------- Render Helpers -------------------- */

  const renderTestResults = (summary: TestRunSummary, title: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className={summary.all_passed ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}>
            {summary.passed}/{summary.total} passed
          </span>
          {summary.avg_time_ms !== null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {summary.avg_time_ms} ms avg
            </span>
          )}
          {summary.max_memory_kb !== null && (
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3" /> {summary.max_memory_kb} KB
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {summary.results.map((r) => (
          <div
            key={`${title}-${r.index}`}
            className={`rounded-lg border p-3 text-xs ${
              r.passed
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-red-500/30 bg-red-500/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                {r.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                Test Case {r.index} {r.hidden ? '(hidden)' : ''}
              </span>
              {r.time_ms !== null && (
                <span className="text-muted-foreground">{r.time_ms} ms</span>
              )}
            </div>

            {!r.passed && !r.hidden && (
              <div className="mt-2 grid gap-2 sm:grid-cols-3 font-mono">
                <div>
                  <p className="text-muted-foreground mb-1">Input</p>
                  <pre className="bg-muted/40 rounded p-2 overflow-x-auto whitespace-pre-wrap">{r.input || '—'}</pre>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Expected</p>
                  <pre className="bg-muted/40 rounded p-2 overflow-x-auto whitespace-pre-wrap">{r.expected_output || '—'}</pre>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Got</p>
                  <pre className="bg-muted/40 rounded p-2 overflow-x-auto whitespace-pre-wrap">{r.actual_output || '—'}</pre>
                </div>
              </div>
            )}

            {r.compile_output && (
              <pre className="mt-2 bg-red-950/80 text-red-200 rounded p-2 overflow-x-auto whitespace-pre-wrap font-mono">
                {r.compile_output}
              </pre>
            )}
            {!r.compile_output && r.stderr && !r.passed && (
              <pre className="mt-2 bg-red-950/80 text-red-200 rounded p-2 overflow-x-auto whitespace-pre-wrap font-mono">
                {r.stderr}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  /* -------------------- UI -------------------- */

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* ---------- Problem Statement ---------- */}
      {(problem || isLoadingProblem || problemError) && (
        <Card className="border-border/50">
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {isLoadingProblem
                  ? 'Preparing coding problem...'
                  : problem?.title || 'Coding Problem'}
              </span>
              {problem && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {problem.difficulty}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {isLoadingProblem && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating problem and test cases...
              </div>
            )}

            {problemError && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-muted-foreground">{problemError}</p>
                <Button variant="outline" size="sm" onClick={loadProblem}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Retry
                </Button>
              </div>
            )}

            {problem && (
              <>
                <p className="leading-relaxed whitespace-pre-line">{problem.description}</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {problem.input_format && (
                    <div>
                      <p className="font-medium mb-1">Input</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">{problem.input_format}</p>
                    </div>
                  )}
                  {problem.output_format && (
                    <div>
                      <p className="font-medium mb-1">Output</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">{problem.output_format}</p>
                    </div>
                  )}
                </div>

                {problem.constraints.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Constraints</p>
                    <ul className="list-disc ml-5 text-xs text-muted-foreground space-y-0.5">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {problem.sample_tests.map((t, i) => (
                    <div key={i} className="rounded-lg border border-border/60 bg-muted/20 p-3 font-mono text-xs space-y-2">
                      <p className="font-sans font-medium">Sample {i + 1}</p>
                      <div>
                        <p className="text-muted-foreground">Input</p>
                        <pre className="whitespace-pre-wrap">{t.input}</pre>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Output</p>
                        <pre className="whitespace-pre-wrap">{t.expected_output}</pre>
                      </div>
                      {t.explanation && (
                        <p className="font-sans text-muted-foreground">{t.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------- Editor ---------- */}
      <Card className="overflow-hidden border-border/50">
        <CardHeader className="bg-secondary/30 border-b border-border/50 py-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Code className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">Code Editor</CardTitle>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                title="Toggle editor theme"
                onClick={() =>
                  setEditorTheme((t) => (t === 'vs-dark' ? 'light' : 'vs-dark'))
                }
              >
                {editorTheme === 'vs-dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Label className="text-sm text-muted-foreground">Language:</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Editor
            height="500px"
            language={selectedLang?.monacoId || 'python'}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorMount}
            theme={editorTheme}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: false },
              automaticLayout: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              autoIndent: 'full',
              tabSize: 4,
              padding: { top: 16, bottom: 16 },
            }}
            loading={
              <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="animate-spin" />
              </div>
            }
          />

          {/* ---------- Custom Input + Actions ---------- */}
          <div className="p-4 border-t border-border/50 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Custom Input (stdin)
              </Label>
              <Textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Optional input passed to your program when you press Run"
                className="mt-2 font-mono text-sm min-h-[70px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <p className="text-sm text-muted-foreground self-center">
                Run tests sample cases (Ctrl/Cmd + Enter) • Submit judges hidden cases
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleRun}
                  disabled={isCodeEmpty || isRunning || isSubmitting}
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={isCodeEmpty || isSubmitting || isRunning}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit
                </Button>
              </div>
            </div>

            {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          </div>
        </CardContent>
      </Card>

      {/* ---------- Results Console ---------- */}
      {(runResults || customExecution || submission) && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {runResults && renderTestResults(runResults, 'Sample Test Cases')}

            {customExecution && (
              <div>
                <p className="text-sm font-semibold mb-2">
                  Custom Input Run
                  {customExecution.time_ms !== null && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      {customExecution.time_ms} ms
                      {customExecution.memory_kb !== null &&
                        ` • ${customExecution.memory_kb} KB`}
                    </span>
                  )}
                </p>
                <pre className="bg-black text-green-400 p-4 rounded text-sm min-h-[80px] overflow-auto whitespace-pre-wrap">
                  {customExecution.compile_output ||
                    customExecution.stderr ||
                    customExecution.stdout ||
                    'No output'}
                </pre>
              </div>
            )}

            {submission && (
              <div className="space-y-4">
                {renderTestResults(submission.test_summary, 'Submission (sample + hidden tests)')}

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> AI Code Review
                    </p>
                    <span className="text-lg font-bold">
                      {Math.round(submission.evaluation.score)} / 100
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">{submission.evaluation.verdict}</p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-muted font-mono">
                      Time: {submission.evaluation.complexity.time}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-muted font-mono">
                      Space: {submission.evaluation.complexity.space}
                    </span>
                  </div>

                  {submission.evaluation.algorithm_feedback && (
                    <p className="text-sm">{submission.evaluation.algorithm_feedback}</p>
                  )}

                  {submission.evaluation.issues.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Issues</p>
                      <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                        {submission.evaluation.issues.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {submission.evaluation.optimizations.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Optimizations</p>
                      <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                        {submission.evaluation.optimizations.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
