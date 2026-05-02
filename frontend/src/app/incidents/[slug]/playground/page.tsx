"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getIncidentDetail, IncidentDetail } from "@/lib/api";
import { playgroundService } from "@/lib/playground/service";
import { PlaygroundClient } from "./playground-client";
import { Toaster } from "@/components/ui/toaster";

export default function PlaygroundPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    getIncidentDetail(slug).then((inc) => {
      setIncident(inc);
      if (inc.stage === "learn") router.replace(`/incidents/${slug}/learn`);
      else if (inc.stage === "quiz") router.replace(`/incidents/${slug}/quiz`);
      else if (inc.stage === "locked") router.replace("/incidents");
    });
  }, [user, slug, router]);

  if (!incident) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">Loading…</div>;
  }

  const spec = playgroundService.get(slug);
  if (!spec) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">No playground spec for this incident.</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="h-14 border-b border-zinc-800 bg-zinc-950/80 flex items-center px-4 gap-4 text-sm">
        <a href="/incidents" className="text-zinc-400 hover:text-zinc-200">← Incidents</a>
        <span className="text-zinc-600">/</span>
        <span className="text-zinc-300 truncate">{incident.title}</span>
        <span className="text-zinc-600">/</span>
        <span className="text-emerald-400">Playground</span>
      </nav>
      <PlaygroundClient
        slug={slug}
        title={incident.title}
        issue={spec.issue}
        goal={spec.goal}
        successCriteria={spec.successCriteria}
        difficulty={incident.difficulty as "EASY" | "MEDIUM" | "HARD"}
        durationSeconds={spec.durationSeconds}
        files={spec.files}
        hints={spec.hints}
      />
      <Toaster />
    </div>
  );
}
