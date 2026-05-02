"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export function CountdownTimer({
  startMs,
  totalSeconds,
  onExpire,
  paused,
}: {
  startMs: number;
  totalSeconds: number;
  onExpire?: () => void;
  paused?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [paused]);

  const elapsed = Math.floor((now - startMs) / 1000);
  const remaining = Math.max(0, totalSeconds - elapsed);

  useEffect(() => {
    if (remaining === 0) onExpire?.();
  }, [remaining, onExpire]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const critical = remaining < 5 * 60;
  const warn = !critical && remaining < 10 * 60;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm tabular-nums",
        critical
          ? "border-red-500/40 bg-red-500/10 text-red-300 animate-pulse"
          : warn
            ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
            : "border-zinc-800 bg-zinc-900/60 text-zinc-300"
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}
