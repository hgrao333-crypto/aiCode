"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCard } from "./badge-card";
import { Trophy, Clock, Lightbulb, XCircle } from "lucide-react";

type Props = {
  title: string;
  attempt: { score: number; solved: boolean; hints_used: number; elapsed_seconds: number };
  badge: { label: string; tagline: string | null; icon_url: string; earned_at: string } | null;
  reference: Record<string, string>;
  user_submission: Record<string, string>;
};

export function DebriefScreen({ title, attempt, badge, reference, user_submission }: Props) {
  const m = Math.floor(attempt.elapsed_seconds / 60);
  const s = attempt.elapsed_seconds % 60;
  const files = Object.keys(reference);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Debrief</h1>
        <p className="mt-1 text-zinc-400">{title}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {attempt.solved ? (
                <Trophy className="h-5 w-5 text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              {attempt.solved ? "Incident resolved" : "Incident not solved"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`font-mono text-6xl ${attempt.solved ? "text-emerald-400" : "text-zinc-400"}`}>
                {attempt.score}
              </span>
              <span className="text-zinc-500">/ 100</span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatPill icon={Clock} label="Time" value={`${m}:${String(s).padStart(2, "0")}`} />
              <StatPill icon={Lightbulb} label="Hints used" value={String(attempt.hints_used)} />
              <StatPill icon={Trophy} label="Badge" value={badge ? "unlocked" : "—"} />
            </div>
          </CardContent>
        </Card>

        {badge ? (
          <BadgeCard badge={badge} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-zinc-500">
              Solve the incident to earn the badge.
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your fix vs. reference</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={files[0]}>
            <TabsList>
              {files.map((f) => (
                <TabsTrigger key={f} value={f} className="font-mono text-xs">{f}</TabsTrigger>
              ))}
            </TabsList>
            {files.map((f) => (
              <TabsContent key={f} value={f}>
                <div className="grid gap-4 md:grid-cols-2">
                  <CodeBlock title="your submission" code={user_submission[f] ?? "(no file submitted)"} />
                  <CodeBlock title="reference fix" code={reference[f]} accent />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
      <Icon className="h-4 w-4 text-zinc-400" />
      <div>
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="font-mono text-sm">{value}</div>
      </div>
    </div>
  );
}

function CodeBlock({ title, code, accent }: { title: string; code: string; accent?: boolean }) {
  return (
    <div className={`rounded-md border ${accent ? "border-emerald-500/30" : "border-zinc-800"} bg-zinc-950 overflow-hidden`}>
      <div className={`flex items-center justify-between border-b px-3 py-1.5 text-xs ${accent ? "border-emerald-500/30 text-emerald-400" : "border-zinc-800 text-zinc-500"}`}>
        <span className="font-mono">{title}</span>
      </div>
      <pre className="max-h-[420px] overflow-auto p-3 text-xs leading-relaxed whitespace-pre-wrap font-mono">{code}</pre>
    </div>
  );
}
