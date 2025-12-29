import { useState } from 'react';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Code, Play, Loader2, Send } from 'lucide-react';

/* -------------------- Language Config -------------------- */

const languages = [
  { id: 'cpp', label: 'C++', monacoId: 'cpp' },
  { id: 'java', label: 'Java', monacoId: 'java' },
  { id: 'python', label: 'Python', monacoId: 'python' },
  { id: 'javascript', label: 'JavaScript', monacoId: 'javascript' },
];

const defaultCodeTemplates: Record<string, string> = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    
    return 0;
}`,
  java: `public class Solution {
    public static void main(String[] args) {
        // Write your code here
        
    }
}`,
  python: `# Write your code here

def solution():
    pass

if __name__ == "__main__":
    solution()`,
  javascript: `// Write your code here

function solution() {

}

solution();`,
};

/* -------------------- Props -------------------- */

interface CodeEditorProps {
  initialLanguage?: string;
  onSubmit?: (code: string, language: string) => void;
}

/* -------------------- Component -------------------- */

export default function CodeEditor({
  initialLanguage = 'python',
  onSubmit,
}: CodeEditorProps) {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(
    defaultCodeTemplates[initialLanguage] || defaultCodeTemplates.python
  );

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState('');

  const selectedLang = languages.find((l) => l.id === language);

  /* -------------------- Handlers -------------------- */

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(defaultCodeTemplates[newLanguage] || '');
    setOutput('');
  };

  const handleRun = async () => {
    if (!code.trim()) return;

    try {
      setIsRunning(true);
      setOutput('Running...\n');

      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          stdin: '',
        }),
      });

      const data = await res.json();
      setOutput(data.stdout || data.stderr || 'No output');
    } catch (err) {
      setOutput('Error running code.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;

    setIsSubmitting(true);

    // Submit goes to AI evaluation pipeline
    await new Promise((resolve) => setTimeout(resolve, 800));
    onSubmit?.(code, language);

    setIsSubmitting(false);
  };

  const isCodeEmpty =
    !code.trim() || code === defaultCodeTemplates[language];

  /* -------------------- UI -------------------- */

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-border/50">
        {/* ---------- Header ---------- */}
        <CardHeader className="bg-secondary/30 border-b border-border/50 py-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Code className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">Code Editor</CardTitle>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground">
                Language:
              </Label>
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

        {/* ---------- Editor ---------- */}
        <CardContent className="p-0">
          <Editor
            height="500px"
            language={selectedLang?.monacoId || 'python'}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily:
                "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: false },
              automaticLayout: true,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
            }}
            loading={
              <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="animate-spin" />
              </div>
            }
          />

          {/* ---------- Actions ---------- */}
          <div className="p-4 border-t border-border/50 flex flex-col sm:flex-row justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Run to test • Submit for evaluation
            </p>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleRun}
                disabled={isCodeEmpty || isRunning}
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
                disabled={isCodeEmpty || isSubmitting}
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
        </CardContent>
      </Card>

      {/* ---------- Output Console ---------- */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Output</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-black text-green-400 p-4 rounded text-sm min-h-[120px] overflow-auto">
            {output || 'Run your code to see output'}
          </pre>
        </CardContent>
      </Card>
    </motion.div>
  );
}
