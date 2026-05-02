"use client";
import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, PlayCircle, PauseCircle } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { updateVideoProgress } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Props = {
  slug: string;
  videoId: number;
  title: string;
  durationSeconds: number;
  muxPlaybackId: string;
  initialPercent?: number;
  onComplete?: () => void;
};

function isRealVideo(id: string) {
  return id.startsWith("/static/") || id.startsWith("http");
}

export function VideoPlayer({
  slug,
  videoId,
  title,
  durationSeconds: initialDuration,
  muxPlaybackId,
  initialPercent = 0,
  onComplete,
}: Props) {
  const real = isRealVideo(muxPlaybackId);
  const videoUrl = real
    ? muxPlaybackId.startsWith("http") ? muxPlaybackId : `${BASE}${muxPlaybackId}`
    : null;

  // ── Real video player ──────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [realDuration, setRealDuration] = useState(initialDuration || 0);
  const [realPercent, setRealPercent] = useState(initialPercent);
  const completedRef = useRef(initialPercent >= 90);
  const lastSaveRef = useRef(initialPercent);

  function saveProgress(pct: number) {
    if (Math.abs(pct - lastSaveRef.current) < 5 && pct < 100) return;
    lastSaveRef.current = pct;
    updateVideoProgress(slug, videoId, Math.round(pct)).catch(() => {});
  }

  if (real && videoUrl) {
    const done = realPercent >= 90;
    return (
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full aspect-video bg-black"
          onLoadedMetadata={() => {
            const d = videoRef.current?.duration ?? 0;
            if (d && isFinite(d)) setRealDuration(d);
            // Seek to saved position
            if (initialPercent > 0 && videoRef.current && d > 0) {
              videoRef.current.currentTime = (initialPercent / 100) * d;
            }
          }}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v || !v.duration || !isFinite(v.duration)) return;
            const pct = (v.currentTime / v.duration) * 100;
            setRealPercent(pct);
            saveProgress(pct);
            if (pct >= 90 && !completedRef.current) {
              completedRef.current = true;
              onComplete?.();
            }
          }}
        />
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{title}</h3>
            {done && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Complete
              </span>
            )}
          </div>
          {realDuration > 0 && (
            <div className="mt-2">
              <Progress value={realPercent} />
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-500">
            Progress auto-saves. Counts as done at 90%.
            {realDuration > 0 && ` Duration: ${formatDuration(Math.round(realDuration))}`}
          </p>
        </div>
      </div>
    );
  }

  // ── Stub simulation (for mock videos) ─────────────────────────────────────
  const [percent, setPercent] = useState(initialPercent);
  const [playing, setPlaying] = useState(false);
  const stubCompletedRef = useRef(initialPercent >= 90);
  const stubLastSaveRef = useRef(initialPercent);

  useEffect(() => {
    if (!playing) return;
    const dur = initialDuration || 20;
    const interval = setInterval(() => {
      setPercent((p) => {
        const next = Math.min(100, p + (100 / dur) * 1);
        if (next >= 90 && !stubCompletedRef.current) {
          stubCompletedRef.current = true;
          onComplete?.();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [playing, initialDuration, onComplete]);

  useEffect(() => {
    if (Math.abs(percent - stubLastSaveRef.current) < 5 && percent < 100) return;
    stubLastSaveRef.current = percent;
    updateVideoProgress(slug, videoId, Math.round(percent)).catch(() => {});
  }, [percent, slug, videoId]);

  const done = percent >= 90;
  const currentSeconds = Math.round((percent / 100) * (initialDuration || 20));

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div className="relative aspect-video bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="absolute inset-0 flex items-center justify-center text-zinc-300 transition-opacity hover:text-white"
        >
          {playing ? <PauseCircle className="h-20 w-20 opacity-80" /> : <PlayCircle className="h-20 w-20 opacity-80" />}
        </button>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>▶ {muxPlaybackId}</span>
          <span>{formatDuration(currentSeconds)} / {formatDuration(initialDuration || 20)}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          {done && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </span>
          )}
        </div>
        <div className="mt-2"><Progress value={percent} /></div>
        <p className="mt-2 text-xs text-zinc-500">Progress auto-saves. Counts as done at 90%.</p>
      </div>
    </div>
  );
}
