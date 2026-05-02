"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { submitQuiz, demoSkip } from "@/lib/api";

type Q = { id: number; question: string; options: string[]; explanation?: string };

export function QuizScreen({
  slug,
  quizId,
  questions,
}: {
  slug: string;
  quizId: number;
  questions: Q[];
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; correct_count: number; total_count: number } | null>(null);

  const q = questions[idx];
  const chosen = answers[q?.id];
  const progress = Math.round((Object.keys(answers).length / questions.length) * 100);

  async function submit() {
    setSubmitting(true);
    try {
      const data = await submitQuiz(slug, quizId, answers);
      setResult(data);
    } finally {
      setSubmitting(false);
    }
  }

  async function skipForDemo() {
    setSkipping(true);
    try {
      await demoSkip(slug, "quiz");
      router.push(`/incidents/${slug}/playground`);
    } finally {
      setSkipping(false);
    }
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2">
              {result.passed ? (
                <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Trophy className="h-7 w-7" />
                </div>
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-full bg-red-500/15 text-red-400">
                  <XCircle className="h-7 w-7" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">{result.passed ? "Nice — quiz unlocked." : "Not quite."}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="font-mono text-4xl">
              <span className={result.passed ? "text-emerald-400" : "text-red-400"}>{result.score}%</span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              {result.correct_count} / {result.total_count} correct · need ≥ 80%
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              {result.passed ? (
                <Button asChild size="lg">
                  <Link href={`/incidents/${slug}/playground`}>Enter playground</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setResult(null); setAnswers({}); setIdx(0); }}>
                    <RotateCcw className="h-4 w-4" /> Try again
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={`/incidents/${slug}/learn`}>Rewatch videos</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 text-sm text-zinc-400">
        <span>Question {idx + 1} / {questions.length}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={skipping}
            className="text-xs text-zinc-400 underline underline-offset-4 hover:text-zinc-200 disabled:opacity-50"
            onClick={() => void skipForDemo()}
          >
            {skipping ? "Skipping…" : "Skip quiz (demo)"}
          </button>
          <span className="font-mono text-xs">{progress}%</span>
        </div>
      </div>
      <Progress value={progress} className="mb-6" />

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg leading-snug">{q.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={chosen !== undefined ? String(chosen) : undefined}
                onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: Number(v) }))}
              >
                {q.options.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-md border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-700 cursor-pointer"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  >
                    <RadioGroupItem value={String(i)} id={`${q.id}-${i}`} className="mt-1" />
                    <Label htmlFor={`${q.id}-${i}`} className="cursor-pointer leading-relaxed">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>Previous</Button>
        {idx < questions.length - 1 ? (
          <Button disabled={chosen === undefined} onClick={() => setIdx((i) => i + 1)}>Next</Button>
        ) : (
          <Button
            disabled={submitting || Object.keys(answers).length !== questions.length}
            onClick={submit}
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? "Grading…" : "Submit quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}
