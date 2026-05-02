"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeEditor } from "@/components/playground/editor";
import { Terminal } from "@/components/playground/terminal";
import { MetricsPanel } from "@/components/playground/metrics";
import { CountdownTimer } from "@/components/playground/countdown-timer";
import { HintDrawer } from "@/components/playground/hint-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { playgroundService } from "@/lib/playground/service";
import type { PlaygroundFile, Hint } from "@/lib/playground/types";
import { submitFix } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { Check, RotateCcw, Send, Terminal as TerminalIcon } from "lucide-react";

type Props = {
  slug: string;
  title: string;
  issue: string;
  goal: string;
  successCriteria: string[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  durationSeconds: number;
  files: PlaygroundFile[];
  hints: Hint[];
};

export function PlaygroundClient({
  slug, title, issue, goal, successCriteria, difficulty,
  durationSeconds, files: initialFiles, hints,
}: Props) {
  const router = useRouter();
  const spec = useMemo(() => playgroundService.get(slug)!, [slug]);

  const originalFilesRef = useRef<Record<string, string>>(
    Object.fromEntries(initialFiles.map((f) => [f.path, f.content]))
  );

  const [fileContents, setFileContents] = useState<Record<string, string>>(originalFilesRef.current);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [startMs] = useState<number>(() => Date.now());
  const [submitting, setSubmitting] = useState(false);

  const liveResult = useMemo(() => spec.check(fileContents), [fileContents, spec]);
  const editorFiles = initialFiles.map((f) => ({ ...f, content: fileContents[f.path] ?? f.content }));
  const hintsCost = revealed.reduce((sum, id) => sum + (hints.find((h) => h.id === id)?.cost ?? 0), 0);

  function onEditorChange(path: string, content: string) {
    setFileContents((prev) => ({ ...prev, [path]: content }));
  }

  function onReset() {
    setFileContents(originalFilesRef.current);
    toast({ title: "Reset to broken state" });
  }

  async function onSubmit() {
    setSubmitting(true);
    try {
      const elapsedSeconds = Math.floor((Date.now() - startMs) / 1000);
      const data = await submitFix(slug, fileContents, elapsedSeconds, revealed.length, hintsCost);
      if (data.passed) {
        toast({
          title: "Fix accepted.",
          description: `Score ${data.score}. Badge unlocked: ${data.badge?.label ?? ""}`,
          variant: "success",
        });
        router.push(`/incidents/${slug}/debrief?attempt=${data.attempt_id}`);
      } else {
        const failing = data.checks?.filter((c) => !c.ok) ?? [];
        toast({
          title: "Checker failed",
          description: failing.length
            ? `${failing.length} check(s) still red. Try \`make check\` in the terminal.`
            : "Something isn't right yet.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileContents, revealed]);

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col">
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-red-500/15 text-red-400">
            <TerminalIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{title}</div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Badge variant={difficulty === "HARD" ? "destructive" : difficulty === "MEDIUM" ? "warning" : "success"}>
                {difficulty}
              </Badge>
              <span>
                live checker:{" "}
                {liveResult.passed ? (
                  <span className="text-emerald-400">all green</span>
                ) : (
                  <span className="text-amber-400">{liveResult.checks.filter((c) => !c.ok).length} red</span>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <CountdownTimer startMs={startMs} totalSeconds={durationSeconds} />
          <HintDrawer
            hints={hints}
            revealed={revealed}
            onReveal={(id) => setRevealed((r) => (r.includes(id) ? r : [...r, id]))}
          />
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button
            size="sm"
            variant={liveResult.passed ? "success" : "default"}
            onClick={onSubmit}
            disabled={submitting}
          >
            {liveResult.passed ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {submitting ? "Submitting…" : "Submit Fix"}
          </Button>
        </div>
      </div>

      <div className="border-b border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs">
        <div className="text-zinc-300"><span className="font-semibold text-zinc-100">Issue: </span>{issue}</div>
        <div className="mt-1 text-zinc-300"><span className="font-semibold text-zinc-100">Goal: </span>{goal}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-zinc-400">
          <span className="font-semibold text-zinc-200">Done when:</span>
          {successCriteria.map((item) => (
            <span key={item} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1">{item}</span>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-5">
        <div className="col-span-2 border-r border-zinc-800 min-h-0">
          <CodeEditor files={editorFiles} onChange={onEditorChange} />
        </div>
        <div className="col-span-3 grid grid-rows-[minmax(0,1.4fr)_minmax(0,1fr)] min-h-0">
          <div className="min-h-0 border-b border-zinc-800">
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-500 font-mono">
              <TerminalIcon className="h-3 w-3" /> terminal — try <code className="text-zinc-300">help</code>
            </div>
            <div className="h-[calc(100%-30px)]">
              <Terminal
                banner={`Welcome to IncidentLab — ${slug}\nType "help" for commands.`}
                run={(cmd) => spec.runCommand(cmd, fileContents)}
              />
            </div>
          </div>
          <div className="min-h-0">
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live metrics
            </div>
            <div className="h-[calc(100%-30px)]">
              <MetricsPanel healthy={liveResult.passed} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
