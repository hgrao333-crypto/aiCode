"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminProblem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type FlatSubtopic = { id: number; slug: string; title: string; order_index: number; topic_title: string; topic_slug: string };

function AdminNav({ email, logout }: { email?: string; logout: () => void }) {
  return (
    <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <Link href="/topics" className="text-white font-bold text-lg">Logos</Link>
        <span className="text-xs px-2 py-0.5 bg-amber-900 text-amber-300 rounded-full border border-amber-700 font-semibold">ADMIN</span>
        <Link href="/admin" className="text-gray-400 text-sm hover:text-white">Dashboard</Link>
        <Link href="/admin/topics" className="text-gray-400 text-sm hover:text-white">Topics</Link>
        <Link href="/admin/problems" className="text-indigo-400 text-sm">Problems</Link>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">{email}</span>
        <button onClick={logout} className="text-gray-400 hover:text-white">Sign out</button>
      </div>
    </nav>
  );
}

const inp = "w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none";
const btn = (c: string) => `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${c}`;
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-gray-400 mb-1">{label}</label>{children}</div>;
}

const BLANK: Omit<AdminProblem, "id"> = {
  slug: "", title: "", description: "", topic: "binary_search",
  subtopic_id: null, difficulty: "medium",
  starter_code: "def solution():\n    pass\n",
  solution_code: "def solution():\n    pass\n",
  test_cases: [{ input: [], expected: null }],
  concepts: [], order_index: 1,
};

type TCRow = { inputStr: string; expectedStr: string };

function toTCRows(cases: unknown[]): TCRow[] {
  return (cases as Array<{ input: unknown; expected: unknown }>).map(c => ({
    inputStr: JSON.stringify(c.input),
    expectedStr: JSON.stringify(c.expected),
  }));
}

function parseTCRows(rows: TCRow[]): { ok: true; cases: unknown[] } | { ok: false; index: number } {
  const cases: unknown[] = [];
  for (let i = 0; i < rows.length; i++) {
    try {
      cases.push({ input: JSON.parse(rows[i].inputStr), expected: JSON.parse(rows[i].expectedStr) });
    } catch {
      return { ok: false, index: i };
    }
  }
  return { ok: true, cases };
}

function TestCaseEditor({ rows, onChange }: { rows: TCRow[]; onChange: (rows: TCRow[]) => void }) {
  function update(i: number, field: keyof TCRow, val: string) {
    const next = rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    onChange(next);
  }
  function add() { onChange([...rows, { inputStr: "[]", expectedStr: "null" }]); }
  function remove(i: number) { onChange(rows.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1.5rem_1fr_1fr_1.5rem] gap-2 text-xs text-gray-500 px-0.5">
        <span></span><span>Input (JSON)</span><span>Expected (JSON)</span><span></span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1.5rem_1fr_1fr_1.5rem] gap-2 items-center">
          <span className="text-xs text-gray-600 text-right">{i + 1}</span>
          <input
            className={`${inp} font-mono text-xs`}
            value={r.inputStr}
            onChange={e => update(i, "inputStr", e.target.value)}
            placeholder="[[1,3,5], 3]"
          />
          <input
            className={`${inp} font-mono text-xs`}
            value={r.expectedStr}
            onChange={e => update(i, "expectedStr", e.target.value)}
            placeholder="1"
          />
          <button onClick={() => remove(i)} className="text-gray-600 hover:text-red-400 text-sm leading-none">✕</button>
        </div>
      ))}
      <button
        onClick={add}
        className={btn("border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 w-full py-1.5")}
      >
        + Add Test Case
      </button>
    </div>
  );
}

function ProblemForm({
  initial,
  onSave,
  onCancel,
  subtopics,
}: {
  initial?: AdminProblem;
  onSave: () => void;
  onCancel: () => void;
  subtopics: FlatSubtopic[];
}) {
  const editing = !!initial?.id;
  const [f, setF] = useState<Omit<AdminProblem, "id">>(initial ? { ...initial } : { ...BLANK });
  const [tcRows, setTcRows] = useState<TCRow[]>(() => toTCRows((initial?.test_cases ?? BLANK.test_cases) as unknown[]));
  const [conceptsStr, setConceptsStr] = useState((initial?.concepts ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function set(key: keyof typeof f, val: unknown) {
    setF(prev => ({ ...prev, [key]: val }));
  }

  // When subtopic changes, auto-fill topic slug
  function onSubtopicChange(subtopicIdStr: string) {
    const id = subtopicIdStr === "" ? null : parseInt(subtopicIdStr);
    set("subtopic_id", id);
    if (id) {
      const st = subtopics.find(s => s.id === id);
      if (st) set("topic", st.topic_slug.replace(/-/g, "_"));
    }
  }

  async function save() {
    setSaving(true); setErr("");
    try {
      if (!f.subtopic_id) throw new Error("Please select a subtopic to link this problem to.");
      if (tcRows.length === 0) throw new Error("Add at least one test case.");
      const parsed = parseTCRows(tcRows);
      if (!parsed.ok) throw new Error(`Test case #${parsed.index + 1} has invalid JSON — check input or expected.`);

      const payload = {
        ...f,
        test_cases: parsed.cases,
        concepts: conceptsStr.split(",").map(s => s.trim()).filter(Boolean),
      };
      if (editing && initial) await adminApi.updateProblem(initial.id, payload);
      else await adminApi.createProblem(payload);
      onSave();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  // Group subtopics by topic for the <optgroup> selector
  const grouped = subtopics.reduce<Record<string, FlatSubtopic[]>>((acc, st) => {
    (acc[st.topic_title] ??= []).push(st);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Slug"><input className={inp} value={f.slug} onChange={e => set("slug", e.target.value)} placeholder="binary-search-classic" /></Field>
        <Field label="Title"><input className={inp} value={f.title} onChange={e => set("title", e.target.value)} /></Field>
      </div>

      {/* Subtopic selector — primary link to the curriculum */}
      <Field label="Subtopic (links this problem to the curriculum) *">
        <select
          className={inp}
          value={f.subtopic_id ?? ""}
          onChange={e => onSubtopicChange(e.target.value)}
        >
          <option value="">— select a subtopic —</option>
          {Object.entries(grouped).map(([topicTitle, sts]) => (
            <optgroup key={topicTitle} label={topicTitle}>
              {sts.map(st => (
                <option key={st.id} value={st.id}>{st.title}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Topic key (auto-filled)"><input className={inp} value={f.topic} onChange={e => set("topic", e.target.value)} placeholder="binary_search" /></Field>
        <Field label="Difficulty">
          <select className={inp} value={f.difficulty} onChange={e => set("difficulty", e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </Field>
        <Field label="Order Index"><input className={inp} type="number" value={f.order_index} onChange={e => set("order_index", parseInt(e.target.value) || 1)} /></Field>
      </div>
      <Field label="Description (Markdown)">
        <textarea className={inp} rows={5} value={f.description} onChange={e => set("description", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starter Code">
          <textarea className={`${inp} font-mono text-xs`} rows={8} value={f.starter_code} onChange={e => set("starter_code", e.target.value)} />
        </Field>
        <Field label="Solution Code">
          <textarea className={`${inp} font-mono text-xs`} rows={8} value={f.solution_code} onChange={e => set("solution_code", e.target.value)} />
        </Field>
      </div>
      <Field label="Test Cases">
        <TestCaseEditor rows={tcRows} onChange={setTcRows} />
      </Field>
      <Field label="Concepts (comma-separated)">
        <input className={inp} value={conceptsStr} onChange={e => setConceptsStr(e.target.value)} placeholder="binary_search, loop_invariant" />
      </Field>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className={btn("bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white")}>
          {saving ? "Saving…" : editing ? "Update Problem" : "Create Problem"}
        </button>
        <button onClick={onCancel} className={btn("border border-gray-700 text-gray-400 hover:text-white")}>Cancel</button>
      </div>
    </div>
  );
}

const DIFF_COLOR: Record<string, string> = {
  easy: "text-green-400", medium: "text-yellow-400", hard: "text-red-400",
};

export default function AdminProblemsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [problems, setProblems] = useState<AdminProblem[]>([]);
  const [subtopics, setSubtopics] = useState<FlatSubtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminProblem | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    Promise.all([adminApi.listProblems(), adminApi.listSubtopics()])
      .then(([p, s]) => { setProblems(p); setSubtopics(s); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!user.is_admin) { router.replace("/topics"); return; }
    load();
  }, [user, authLoading, router]);

  async function deleteProblem(id: number) {
    if (!confirm("Delete this problem and all its sessions?")) return;
    await adminApi.deleteProblem(id);
    if (selected?.id === id) setSelected(null);
    load();
  }

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">Loading…</div>;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AdminNav email={user?.email} logout={logout} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: problem list */}
        <div className="w-72 shrink-0 border-r border-gray-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-800">
            <button onClick={() => { setCreating(true); setSelected(null); }}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">
              + New Problem
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {problems.map((p) => (
              <div
                key={p.id}
                onClick={() => { setSelected(p); setCreating(false); }}
                className={`flex items-start justify-between px-3 py-3 cursor-pointer border-b border-gray-800 hover:bg-gray-900 ${selected?.id === p.id ? "bg-gray-900 border-l-2 border-l-indigo-500" : ""}`}
              >
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{p.title}</div>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    <span className={`text-xs font-medium ${DIFF_COLOR[p.difficulty] ?? "text-gray-400"}`}>{p.difficulty}</span>
                    {p.subtopic_id
                      ? <span className="text-xs text-indigo-400">{subtopics.find(s => s.id === p.subtopic_id)?.title ?? "–"}</span>
                      : <span className="text-xs text-amber-600">⚠ no subtopic</span>
                    }
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteProblem(p.id); }}
                  className="text-gray-600 hover:text-red-400 text-xs ml-1 shrink-0 mt-0.5">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="flex-1 overflow-y-auto bg-gray-950">
          {(creating || selected) ? (
            <div className="p-6 max-w-3xl">
              <h2 className="text-white font-semibold text-lg mb-5">
                {creating ? "New Problem" : `Edit: ${selected?.title}`}
              </h2>
              <ProblemForm
                key={selected?.id ?? "new"}
                initial={selected ?? undefined}
                subtopics={subtopics}
                onSave={() => {
                  setCreating(false); setSelected(null); load();
                }}
                onCancel={() => { setCreating(false); setSelected(null); }}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center h-full text-gray-600 text-sm gap-2">
              <span className="text-3xl">💻</span>
              <span>Select a problem to edit, or create a new one.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
