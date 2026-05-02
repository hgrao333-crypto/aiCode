"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getIncidentDetail, demoSkip, IncidentDetail } from "@/lib/api";
import { VideoPlayer } from "@/components/incident/video-player";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LearnPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [videos, setVideos] = useState<IncidentDetail["videos"]>([]);
  const [active, setActive] = useState(0);
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    getIncidentDetail(slug).then((inc) => {
      setIncident(inc);
      setVideos(inc.videos);
      const firstIncomplete = inc.videos.findIndex((v) => !v.completed);
      setActive(Math.max(0, firstIncomplete));
    });
  }, [user, slug]);

  function markDone(id: number) {
    setVideos((arr) => arr.map((v) => v.id === id ? { ...v, completed: true, watch_percent: 100 } : v));
  }

  async function skipVideos() {
    setSkipping(true);
    try {
      await demoSkip(slug, "videos");
      router.push(`/incidents/${slug}/quiz`);
    } finally {
      setSkipping(false);
    }
  }

  if (!incident) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">Loading…</div>;

  const doneCount = videos.filter((v) => v.completed).length;
  const allDone = doneCount === videos.length;
  const overall = Math.round((doneCount / videos.length) * 100);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-6 py-3 flex items-center gap-4">
        <Link href={`/incidents`} className="text-zinc-400 hover:text-zinc-200 text-sm">← Incidents</Link>
        <span className="text-zinc-500">/</span>
        <span className="text-sm text-zinc-300">{incident.title}</span>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold">{incident.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Watch all {videos.length} clips to unlock the quiz. Each counts as done at 90%.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {videos[active] && (
              <VideoPlayer
                key={videos[active].id}
                slug={slug}
                videoId={videos[active].id}
                title={videos[active].title}
                muxPlaybackId={videos[active].mux_playback_id}
                durationSeconds={videos[active].duration_seconds}
                initialPercent={videos[active].watch_percent}
                onComplete={() => markDone(videos[active].id)}
              />
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-zinc-400">{doneCount} / {videos.length} watched</div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={skipping} onClick={() => void skipVideos()}>
                  {skipping ? "Skipping…" : "Skip videos (demo)"}
                </Button>
                <Button variant="outline" size="sm" disabled={active === 0} onClick={() => setActive((i) => Math.max(0, i - 1))}>Previous</Button>
                {active < videos.length - 1 ? (
                  <Button size="sm" onClick={() => setActive((i) => Math.min(videos.length - 1, i + 1))}>Next clip</Button>
                ) : (
                  <Button asChild size="sm" disabled={!allDone}>
                    <Link href={`/incidents/${slug}/quiz`}>{allDone ? "Take the quiz" : "Finish videos first"}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 h-fit">
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Overall</span>
                <span className="font-mono">{overall}%</span>
              </div>
              <Progress value={overall} className="mt-2" />
            </div>
            <ol className="space-y-1">
              {videos.map((v, i) => (
                <li key={v.id}>
                  <button
                    onClick={() => setActive(i)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md p-2 text-left text-sm hover:bg-zinc-800/60",
                      active === i && "bg-zinc-800/80"
                    )}
                  >
                    <span className={cn(
                      "mt-0.5 grid h-5 w-5 place-items-center rounded-full border text-[10px]",
                      v.completed ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400" : "border-zinc-700 text-zinc-500"
                    )}>
                      {v.completed ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="flex-1">
                      <span className="line-clamp-2">{v.title}</span>
                      <span className="block text-[11px] text-zinc-500">
                        {Math.floor(v.duration_seconds / 60)}:{String(v.duration_seconds % 60).padStart(2, "0")}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </main>
    </div>
  );
}
