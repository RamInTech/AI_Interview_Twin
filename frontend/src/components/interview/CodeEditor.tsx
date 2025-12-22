import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Code, Play, Loader2 } from 'lucide-react';

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

interface CodeEditorProps {
  initialLanguage?: string;
  onSubmit?: (code: string, language: string) => void;
}

export default function CodeEditor({ initialLanguage = 'python', onSubmit }: CodeEditorProps) {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(defaultCodeTemplates[initialLanguage] || defaultCodeTemplates.python);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(defaultCodeTemplates[newLanguage] || '');
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    
    setIsSubmitting(true);
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSubmit?.(code, language);
    setIsSubmitting(false);
  };

  const isCodeEmpty = !code.trim() || code === defaultCodeTemplates[language];

  const selectedLang = languages.find(l => l.id === language);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden border-border/50">
        <CardHeader className="bg-secondary/30 border-b border-border/50 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Code className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">Code Editor</CardTitle>
            </div>
            
            <div className="flex items-center gap-3">
              <Label htmlFor="language-select" className="text-sm text-muted-foreground whitespace-nowrap">
                Language:
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language-select" className="w-40 h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
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
          <div className="relative min-h-[400px] md:min-h-[500px]">
            <Editor
              height="500px"
              language={selectedLang?.monacoId || 'python'}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true,
              }}
              loading={
                <div className="flex items-center justify-center h-[500px] bg-[#1e1e1e]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              }
            />
          </div>
          
          <div className="p-4 bg-secondary/20 border-t border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Write your solution and click submit when ready
            </p>
            <Button
              onClick={handleSubmit}
              disabled={isCodeEmpty || isSubmitting}
              className="gradient-bg text-primary-foreground font-semibold px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Submit Code
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
