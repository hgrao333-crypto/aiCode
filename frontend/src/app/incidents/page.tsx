"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { listIncidents, IncidentWithStage } from "@/lib/api";
import { IncidentCard } from "@/components/incident/incident-card";
import { Flame, Trophy, ListChecks } from "lucide-react";

function Stat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; accent: "emerald" | "sky" | "amber" }) {
  const colors = { emerald: "text-emerald-400 bg-emerald-500/10", sky: "text-sky-400 bg-sky-500/10", amber: "text-amber-400 bg-amber-500/10" };
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <span className={`grid h-9 w-9 place-items-center rounded-md ${colors[accent]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="font-mono text-lg leading-none">{value}</div>
        <div className="text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<IncidentWithStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    listIncidents()
      .then(setIncidents)
      .finally(() => setLoading(false));
  }, [user]);

  const solved = incidents.filter((i) => i.stage === "done").length;
  const inProgress = incidents.filter((i) => i.stage !== "done" && i.stage !== "locked").length;

  if (authLoading || loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/demo" className="text-zinc-300 hover:text-zinc-100 text-sm font-medium">← Back to courses</Link>
          <span className="text-emerald-400 font-bold text-lg">IncidentLab</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-400 hidden sm:block">{user?.email}</span>
          <button onClick={logout} className="text-zinc-500 hover:text-zinc-200 transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold">Welcome, {user?.email?.split("@")[0]}.</h1>
            <p className="text-zinc-400 mt-1">Pick an incident. Get paged. Fix it. No one gets actually woken up.</p>
          </div>
          <div className="flex gap-3">
            <Stat icon={Trophy} label="Solved" value={solved} accent="emerald" />
            <Stat icon={ListChecks} label="In progress" value={inProgress} accent="sky" />
            <Stat icon={Flame} label="Streak" value={1} accent="amber" />
          </div>
        </header>

        <section>
          <h2 className="mb-4 text-sm uppercase tracking-wider text-zinc-500">Available incidents</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {incidents.map((inc) => <IncidentCard key={inc.id} incident={inc} />)}
          </div>
          {incidents.length === 0 && (
            <p className="text-sm text-zinc-500">No incidents available yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}
