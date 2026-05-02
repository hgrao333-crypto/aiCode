"use client";

import { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Activity, Cpu, Gauge, MemoryStick } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricsPoint = {
  t: number;
  cpu: number;
  memoryMB: number;
  p95ms: number;
  errorRate: number;
};

/**
 * Generates a synthetic time series. When `healthy` is true numbers
 * trend toward SLO; when false they climb toward alerting thresholds.
 */
export function MetricsPanel({ healthy }: { healthy: boolean }) {
  const [data, setData] = useState<MetricsPoint[]>([]);
  const healthyRef = useRef(healthy);
  healthyRef.current = healthy;

  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      setData((prev) => {
        const last = prev[prev.length - 1];
        const ok = healthyRef.current;
        const jitter = () => (Math.random() - 0.5) * 2;

        const cpuTarget = ok ? 25 : 78;
        const memTarget = ok ? 140 : Math.min(260, (last?.memoryMB ?? 180) + 3);
        const p95Target = ok ? 95 : 1800;
        const errTarget = ok ? 0.1 : 3.4;

        const next: MetricsPoint = {
          t,
          cpu: clamp(
            lerp(last?.cpu ?? cpuTarget, cpuTarget, 0.3) + jitter() * 4,
            0,
            100
          ),
          memoryMB: clamp(
            lerp(last?.memoryMB ?? memTarget, memTarget, 0.25) + jitter() * 3,
            80,
            400
          ),
          p95ms: clamp(
            lerp(last?.p95ms ?? p95Target, p95Target, 0.25) + jitter() * 30,
            40,
            5000
          ),
          errorRate: clamp(
            lerp(last?.errorRate ?? errTarget, errTarget, 0.3) + jitter() * 0.4,
            0,
            10
          ),
        };
        return [...prev.slice(-39), next];
      });
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const last = data[data.length - 1];

  return (
    <div className="grid h-full grid-cols-2 gap-3 p-3 overflow-auto">
      <Stat
        icon={Cpu}
        label="CPU"
        value={last ? `${Math.round(last.cpu)}%` : "—"}
        ok={last ? last.cpu < 70 : true}
      >
        <SparkLine data={data} dataKey="cpu" color="#34d399" max={100} />
      </Stat>
      <Stat
        icon={MemoryStick}
        label="Memory"
        value={last ? `${Math.round(last.memoryMB)} MiB` : "—"}
        ok={last ? last.memoryMB < 230 : true}
      >
        <SparkLine
          data={data}
          dataKey="memoryMB"
          color="#60a5fa"
          max={300}
          referenceY={256}
          referenceLabel="limit"
        />
      </Stat>
      <Stat
        icon={Gauge}
        label="p95 latency"
        value={last ? `${Math.round(last.p95ms)} ms` : "—"}
        ok={last ? last.p95ms < 300 : true}
      >
        <SparkLine data={data} dataKey="p95ms" color="#fbbf24" max={2000} />
      </Stat>
      <Stat
        icon={Activity}
        label="Error rate"
        value={last ? `${last.errorRate.toFixed(1)}%` : "—"}
        ok={last ? last.errorRate < 1 : true}
      >
        <SparkLine data={data} dataKey="errorRate" color="#f87171" max={5} />
      </Stat>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  ok,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-md border border-zinc-800 bg-zinc-950 p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-xs",
            ok ? "text-emerald-400" : "text-red-400"
          )}
        >
          {value}
        </span>
      </div>
      <div className="h-16 min-w-0">{children}</div>
    </div>
  );
}

function SparkLine({
  data,
  dataKey,
  color,
  max,
  referenceY,
  referenceLabel,
}: {
  data: MetricsPoint[];
  dataKey: keyof MetricsPoint;
  color: string;
  max: number;
  referenceY?: number;
  referenceLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 2, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#27272a" strokeDasharray="2 3" />
        <XAxis dataKey="t" hide />
        <YAxis hide domain={[0, max]} />
        <Tooltip
          contentStyle={{
            background: "#09090b",
            border: "1px solid #27272a",
            borderRadius: 6,
            fontSize: 11,
          }}
          labelFormatter={(l) => `t=${l}s`}
        />
        {referenceY !== undefined && (
          <ReferenceLine
            y={referenceY}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{
              value: referenceLabel,
              fill: "#ef4444",
              fontSize: 9,
              position: "insideTopRight",
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey={dataKey as string}
          stroke={color}
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
