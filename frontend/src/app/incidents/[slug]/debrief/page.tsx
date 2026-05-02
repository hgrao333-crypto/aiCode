"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getIncidentDetail, getDebrief, IncidentDetail, DebriefAttempt } from "@/lib/api";
import { playgroundService } from "@/lib/playground/service";
import { DebriefScreen } from "@/components/incident/debrief-screen";

export default function DebriefPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const attemptIdRaw = searchParams.get("attempt");
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [attempt, setAttempt] = useState<DebriefAttempt | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    const attemptId = attemptIdRaw ? Number(attemptIdRaw) : undefined;
    Promise.all([
      getIncidentDetail(slug),
      getDebrief(slug, attemptId),
    ]).then(([inc, att]) => {
      setIncident(inc);
      setAttempt(att);
    }).catch(() => router.replace("/incidents"));
  }, [user, slug, attemptIdRaw, router]);

  if (!incident || !attempt) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">Loading…</div>;
  }

  const spec = playgroundService.get(slug);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-6 py-3 flex items-center gap-4">
        <Link href="/incidents" className="text-zinc-400 hover:text-zinc-200 text-sm">← Incidents</Link>
        <span className="text-zinc-500">/</span>
        <span className="text-sm text-zinc-300">{incident.title}</span>
        <span className="text-zinc-500">/</span>
        <span className="text-sm text-zinc-300">Debrief</span>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <DebriefScreen
          title={incident.title}
          attempt={{
            score: attempt.score,
            solved: attempt.solved,
            hints_used: attempt.hints_used,
            elapsed_seconds: attempt.elapsed_seconds,
          }}
          badge={attempt.badge ?? null}
          reference={spec?.referenceFiles ?? {}}
          user_submission={attempt.submission}
        />
        <div className="mt-8 flex gap-2">
          <Link href="/incidents" className="inline-flex h-9 items-center rounded-md border border-zinc-800 px-4 text-sm hover:bg-zinc-900">
            Back to incidents
          </Link>
          <Link href={`/incidents/${slug}/playground`} className="inline-flex h-9 items-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 text-sm text-emerald-300 hover:bg-emerald-500/20">
            Replay playground
          </Link>
        </div>
      </main>
    </div>
  );
}
