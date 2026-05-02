"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getIncidentDetail, IncidentDetail } from "@/lib/api";
import { QuizScreen } from "@/components/incident/quiz-screen";

export default function QuizPage() {
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
      if (inc.stage === "locked") router.replace("/incidents");
    });
  }, [user, slug, router]);

  if (!incident || !incident.quiz) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-6 py-3 flex items-center gap-4">
        <Link href="/incidents" className="text-zinc-400 hover:text-zinc-200 text-sm">← Incidents</Link>
        <span className="text-zinc-500">/</span>
        <Link href={`/incidents/${slug}/learn`} className="text-zinc-400 hover:text-zinc-200 text-sm">{incident.title}</Link>
        <span className="text-zinc-500">/</span>
        <span className="text-sm text-zinc-300">Quiz</span>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">{incident.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Four questions. You need 80% to unlock the playground. No time pressure.
        </p>
        <div className="mt-8">
          <QuizScreen
            slug={slug}
            quizId={incident.quiz.id}
            questions={incident.quiz.questions.map((q) => ({
              id: q.id,
              question: q.question,
              options: q.options,
              explanation: q.explanation ?? undefined,
            }))}
          />
        </div>
      </main>
    </div>
  );
}
