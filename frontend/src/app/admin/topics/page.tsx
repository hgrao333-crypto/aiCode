"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminTopic, AdminTopicDetail, AdminSubTopic, AdminExercise } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ── Shared helpers ─────────────────────────────────────────────────────────────

function AdminNav({ email, logout }: { email?: string; logout: () => void }) {
  return (
    <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <Link href="/topics" className="text-white font-bold text-lg">Bodhix</Link>
        <span className="text-xs px-2 py-0.5 bg-amber-900 text-amber-300 rounded-full border border-amber-700 font-semibold">ADMIN</span>
        <Link href="/admin" className="text-gray-400 text-sm hover:text-white">Dashboard</Link>
        <Link href="/admin/topics" className="text-indigo-400 text-sm">Topics</Link>
        <Link href="/admin/problems" className="text-gray-400 text-sm hover:text-white">Problems</Link>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">{email}</span>
        <button onClick={logout} className="text-gray-400 hover:text-white">Sign out</button>
      </div>
    </nav>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none";
const btn = (color: string) => `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${color}`;

// ── Exercise builder (shown inside PlayCardForm when editing) ─────────────────

const EXERCISE_TYPES = ["recognition", "debugging", "variation", "teach_back"] as const;
type ExerciseType = typeof EXERCISE_TYPES[number];
const EXERCISE_LABELS: Record<ExerciseType, string> = {
  recognition: "Recognition (MCQ)",
  debugging: "Debugging (find the bug)",
  variation: "Variation (what-if)",
  teach_back: "Teach-back (explain it)",
};

const BLANK_EXERCISE = {
  exercise_type: "recognition" as ExerciseType,
  question: "",
  options: ["", "", "", ""] as string[],
  correct_index: 0,
  buggy_code: "",
  grading_hints: "",
  explanation: "",
  order_index: 0,
};

function ExerciseBuilder({ playcardId }: { playcardId: number }) {
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...BLANK_EXERCISE });
  const [saving, setSaving] = useState(false);

  function loadExercises() {
    adminApi.listExercises(playcardId).then(setExercises);
  }
  useEffect(() => { loadExercises(); }, [playcardId]);

  function setF<K extends keyof typeof BLANK_EXERCISE>(k: K, v: typeof BLANK_EXERCISE[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function startAdd() {
    setForm({ ...BLANK_EXERCISE, order_index: exercises.length + 1 });
    setAdding(true);
    setEditingId(null);
  }

  function startEdit(ex: AdminExercise) {
    setForm({
      exercise_type: ex.exercise_type as ExerciseType,
      question: ex.question,
      options: ex.options?.length === 4 ? [...ex.options] : ["", "", "", ""],
      correct_index: ex.correct_index ?? 0,
      buggy_code: ex.buggy_code ?? "",
      grading_hints: ex.grading_hints ?? "",
      explanation: ex.explanation ?? "",
      order_index: ex.order_index,
    });
    setEditingId(ex.id);
    setAdding(false);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        playcard_id: playcardId,
        exercise_type: form.exercise_type,
        question: form.question,
        options: form.exercise_type === "recognition" ? form.options.filter(Boolean) : null,
        correct_index: form.exercise_type === "recognition" ? form.correct_index : null,
        buggy_code: form.exercise_type === "debugging" ? form.buggy_code || null : null,
        grading_hints: form.grading_hints || null,
        explanation: form.explanation || null,
        order_index: form.order_index,
      };
      if (editingId) await adminApi.updateExercise(editingId, payload);
      else await adminApi.createExercise(payload);
      setAdding(false); setEditingId(null);
      loadExercises();
    } finally { setSaving(false); }
  }

  async function deleteEx(id: number) {
    if (!confirm("Delete this exercise?")) return;
    await adminApi.deleteExercise(id);
    loadExercises();
  }

  const TYPE_COLOR: Record<string, string> = {
    recognition: "bg-blue-900 text-blue-300",
    debugging: "bg-red-900 text-red-300",
    variation: "bg-purple-900 text-purple-300",
    teach_back: "bg-amber-900 text-amber-300",
  };

  const showForm = adding || editingId !== null;

  return (
    <div className="border-t border-gray-800 mt-4 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Exercises ({exercises.length})</span>
        {!showForm && (
          <button onClick={startAdd} className={btn("border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-indigo-500")}>
            + Add Exercise
          </button>
        )}
      </div>

      {exercises.map(ex => (
        <div key={ex.id} className="flex items-start justify-between px-3 py-2 rounded-lg border border-gray-800 bg-gray-950 gap-2">
          <div className="min-w-0 flex-1">
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold mr-2 ${TYPE_COLOR[ex.exercise_type] ?? "bg-gray-800 text-gray-400"}`}>
              {ex.exercise_type}
            </span>
            <span className="text-xs text-gray-400 truncate">{ex.question}</span>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => startEdit(ex)} className={btn("border border-gray-700 text-gray-400 hover:text-white")}>Edit</button>
            <button onClick={() => deleteEx(ex.id)} className={btn("border border-red-900 text-red-500 hover:text-red-400")}>Del</button>
          </div>
        </div>
      ))}

      {showForm && (
        <div className="border border-gray-700 rounded-lg p-3 space-y-3 bg-gray-900">
          <Field label="Type">
            <select className={inp} value={form.exercise_type} onChange={e => setF("exercise_type", e.target.value as ExerciseType)}>
              {EXERCISE_TYPES.map(t => <option key={t} value={t}>{EXERCISE_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Question">
            <textarea className={inp} rows={2} value={form.question} onChange={e => setF("question", e.target.value)} />
          </Field>
          {form.exercise_type === "recognition" && (
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <Field key={i} label={`Option ${i + 1}${form.correct_index === i ? " ✓ correct" : ""}`}>
                  <div className="flex gap-2">
                    <input className={inp} value={opt} onChange={e => { const o = [...form.options]; o[i] = e.target.value; setF("options", o); }} />
                    <button onClick={() => setF("correct_index", i)} className={`shrink-0 px-2 rounded-lg border text-xs ${form.correct_index === i ? "border-green-600 text-green-400 bg-green-900/30" : "border-gray-700 text-gray-600 hover:border-green-700 hover:text-green-500"}`}>✓</button>
                  </div>
                </Field>
              ))}
            </div>
          )}
          {form.exercise_type === "debugging" && (
            <Field label="Buggy Code">
              <textarea className={`${inp} font-mono text-xs`} rows={6} value={form.buggy_code} onChange={e => setF("buggy_code", e.target.value)} placeholder="Paste the intentionally buggy code here" />
            </Field>
          )}
          <Field label="Grading Hints (for AI — not shown to student)">
            <textarea className={inp} rows={2} value={form.grading_hints} onChange={e => setF("grading_hints", e.target.value)} placeholder="What key points should the student mention?" />
          </Field>
          <Field label="Explanation (shown after answer)">
            <textarea className={inp} rows={2} value={form.explanation} onChange={e => setF("explanation", e.target.value)} placeholder="Full explanation revealed after student answers" />
          </Field>
          <Field label="Order">
            <input className={inp} type="number" value={form.order_index} onChange={e => setF("order_index", parseInt(e.target.value) || 0)} />
          </Field>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className={btn("bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white")}>
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            <button onClick={() => { setAdding(false); setEditingId(null); }} className={btn("border border-gray-700 text-gray-400 hover:text-white")}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PlayCard form ─────────────────────────────────────────────────────────────

function PlayCardForm({
  subtopicId,
  initial,
  onSave,
  onCancel,
}: {
  subtopicId: number;
  initial?: { id?: number; title: string; content: string; order_index: number; ai_summary?: string | null };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [order, setOrder] = useState(String(initial?.order_index ?? 1));
  const [summary, setSummary] = useState(initial?.ai_summary ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const payload = { subtopic_id: subtopicId, title, content, order_index: parseInt(order) || 1, ai_summary: summary || null };
      if (initial?.id) await adminApi.updatePlaycard(initial.id, payload);
      else await adminApi.createPlaycard(payload);
      onSave();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="border border-gray-700 rounded-lg p-4 space-y-3 bg-gray-900">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title"><input className={inp} value={title} onChange={e => setTitle(e.target.value)} /></Field>
        <Field label="Order"><input className={inp} type="number" value={order} onChange={e => setOrder(e.target.value)} /></Field>
      </div>
      <Field label="Content (Markdown)">
        <textarea className={inp} rows={6} value={content} onChange={e => setContent(e.target.value)} />
      </Field>
      <Field label="AI Summary (spoken, optional)">
        <textarea className={inp} rows={2} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Spoken summary for TTS — leave blank to regenerate" />
      </Field>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className={btn("bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white")}>
          {saving ? "Saving…" : "Save Card"}
        </button>
        <button onClick={onCancel} className={btn("border border-gray-700 text-gray-400 hover:text-white")}>Cancel</button>
      </div>
      {initial?.id && <ExerciseBuilder playcardId={initial.id} />}
    </div>
  );
}

// ── SubTopic section ──────────────────────────────────────────────────────────

function SubTopicSection({
  topicId,
  subtopics,
  onRefresh,
}: {
  topicId: number;
  subtopics: AdminSubTopic[];
  onRefresh: () => void;
}) {
  const [addingSubtopic, setAddingSubtopic] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState<number | null>(null);
  const [addingCard, setAddingCard] = useState<number | null>(null);   // subtopic id
  const [editingCard, setEditingCard] = useState<number | null>(null); // card id

  // New subtopic form state
  const [stSlug, setStSlug] = useState("");
  const [stTitle, setStTitle] = useState("");
  const [stDesc, setStDesc] = useState("");
  const [stOrder, setStOrder] = useState("1");
  const [saving, setSaving] = useState(false);

  async function saveSubtopic(existing?: AdminSubTopic) {
    setSaving(true);
    try {
      const payload = { topic_id: topicId, slug: stSlug, title: stTitle, description: stDesc, order_index: parseInt(stOrder) || 1 };
      if (existing) await adminApi.updateSubtopic(existing.id, payload);
      else await adminApi.createSubtopic(payload);
      setAddingSubtopic(false); setEditingSubtopic(null);
      setStSlug(""); setStTitle(""); setStDesc(""); setStOrder("1");
      onRefresh();
    } finally { setSaving(false); }
  }

  function startEditSubtopic(st: AdminSubTopic) {
    setStSlug(st.slug); setStTitle(st.title); setStDesc(st.description); setStOrder(String(st.order_index));
    setEditingSubtopic(st.id); setAddingSubtopic(false);
  }

  async function deleteSubtopic(id: number) {
    if (!confirm("Delete this subtopic and all its playcards?")) return;
    await adminApi.deleteSubtopic(id);
    onRefresh();
  }

  async function deleteCard(id: number) {
    if (!confirm("Delete this playcard?")) return;
    await adminApi.deletePlaycard(id);
    onRefresh();
  }

  const stForm = (existing?: AdminSubTopic) => (
    <div className="border border-gray-700 rounded-lg p-3 space-y-2 bg-gray-900">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Slug"><input className={inp} value={stSlug} onChange={e => setStSlug(e.target.value)} placeholder="loop-invariants" /></Field>
        <Field label="Order"><input className={inp} type="number" value={stOrder} onChange={e => setStOrder(e.target.value)} /></Field>
      </div>
      <Field label="Title"><input className={inp} value={stTitle} onChange={e => setStTitle(e.target.value)} /></Field>
      <Field label="Description"><input className={inp} value={stDesc} onChange={e => setStDesc(e.target.value)} /></Field>
      <div className="flex gap-2">
        <button onClick={() => saveSubtopic(existing)} disabled={saving} className={btn("bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white")}>
          {saving ? "Saving…" : existing ? "Update" : "Create"}
        </button>
        <button onClick={() => { setAddingSubtopic(false); setEditingSubtopic(null); }} className={btn("border border-gray-700 text-gray-400 hover:text-white")}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {subtopics.map((st) => (
        <div key={st.id} className="border border-gray-800 rounded-xl overflow-hidden">
          {/* SubTopic header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
            <div>
              <span className="text-white font-medium text-sm">{st.title}</span>
              <span className="ml-2 text-xs text-gray-500">/{st.slug}</span>
              <span className="ml-2 text-xs text-gray-600">#{st.order_index}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { startEditSubtopic(st); }} className={btn("border border-gray-700 text-gray-400 hover:text-white")}>Edit</button>
              <button onClick={() => setAddingCard(addingCard === st.id ? null : st.id)} className={btn("border border-indigo-700 text-indigo-400 hover:text-indigo-200")}>+ Card</button>
              <button onClick={() => deleteSubtopic(st.id)} className={btn("border border-red-900 text-red-500 hover:text-red-400")}>Delete</button>
            </div>
          </div>

          {/* Edit subtopic inline */}
          {editingSubtopic === st.id && <div className="p-3">{stForm(st)}</div>}

          {/* PlayCards */}
          <div className="divide-y divide-gray-800">
            {st.play_cards.map((pc) => (
              <div key={pc.id}>
                {editingCard === pc.id ? (
                  <div className="p-3">
                    <PlayCardForm
                      subtopicId={st.id}
                      initial={pc}
                      onSave={() => { setEditingCard(null); onRefresh(); }}
                      onCancel={() => setEditingCard(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-start justify-between px-4 py-2.5 hover:bg-gray-900/50">
                    <div className="min-w-0">
                      <span className="text-sm text-gray-300">{pc.title}</span>
                      {pc.ai_summary && <p className="text-xs text-gray-600 mt-0.5 truncate max-w-md">{pc.ai_summary}</p>}
                    </div>
                    <div className="flex gap-1.5 shrink-0 ml-3">
                      <button onClick={() => setEditingCard(pc.id)} className={btn("border border-gray-700 text-gray-400 hover:text-white")}>Edit</button>
                      <button onClick={() => deleteCard(pc.id)} className={btn("border border-red-900 text-red-500 hover:text-red-400")}>Del</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add card form */}
          {addingCard === st.id && (
            <div className="p-3 border-t border-gray-800">
              <PlayCardForm
                subtopicId={st.id}
                onSave={() => { setAddingCard(null); onRefresh(); }}
                onCancel={() => setAddingCard(null)}
              />
            </div>
          )}

          {/* Problems linked to this subtopic */}
          {st.problems.length > 0 ? (
            <div className="border-t border-gray-800 bg-gray-950/50">
              <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Problems ({st.problems.length})
              </div>
              <div className="divide-y divide-gray-800/50">
                {st.problems.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-gray-300">{p.title}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${p.difficulty === "easy" ? "text-green-400" : p.difficulty === "hard" ? "text-red-400" : "text-yellow-400"}`}>{p.difficulty}</span>
                      <Link href="/admin/problems" className="text-xs text-indigo-400 hover:text-indigo-300">edit →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-800 px-4 py-2 flex items-center justify-between bg-gray-950/30">
              <span className="text-xs text-gray-600">No problems linked yet</span>
              <Link href="/admin/problems" className="text-xs text-indigo-500 hover:text-indigo-300">Add problem →</Link>
            </div>
          )}
        </div>
      ))}

      {/* Add subtopic */}
      {addingSubtopic ? (
        stForm()
      ) : (
        <button onClick={() => { setAddingSubtopic(true); setStSlug(""); setStTitle(""); setStDesc(""); setStOrder(String(subtopics.length + 1)); }}
          className={btn("border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 w-full py-2")}>
          + Add Subtopic
        </button>
      )}
    </div>
  );
}

// ── Video section ─────────────────────────────────────────────────────────────

function VideoSection({
  topicId,
  videos,
  onRefresh,
}: {
  topicId: number;
  videos: Array<{ id: number; title: string; youtube_id: string; order_index: number }>;
  onRefresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [ytId, setYtId] = useState("");
  const [order, setOrder] = useState("1");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await adminApi.createVideo({ topic_id: topicId, title, youtube_id: ytId, order_index: parseInt(order) || 1 });
      setTitle(""); setYtId(""); setAdding(false); onRefresh();
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-2">
      {videos.map((v) => (
        <div key={v.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-800 bg-gray-900">
          <div>
            <span className="text-sm text-gray-300">{v.title}</span>
            <span className="ml-2 text-xs text-gray-500">({v.youtube_id})</span>
          </div>
          <button onClick={async () => { await adminApi.deleteVideo(v.id); onRefresh(); }}
            className={btn("border border-red-900 text-red-500 hover:text-red-400")}>Del</button>
        </div>
      ))}
      {adding ? (
        <div className="border border-gray-700 rounded-lg p-3 space-y-2 bg-gray-900">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2"><Field label="Title"><input className={inp} value={title} onChange={e => setTitle(e.target.value)} /></Field></div>
            <Field label="Order"><input className={inp} type="number" value={order} onChange={e => setOrder(e.target.value)} /></Field>
          </div>
          <Field label="YouTube ID (e.g. dQw4w9WgXcQ)"><input className={inp} value={ytId} onChange={e => setYtId(e.target.value)} /></Field>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className={btn("bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white")}>{saving ? "Saving…" : "Add Video"}</button>
            <button onClick={() => setAdding(false)} className={btn("border border-gray-700 text-gray-400 hover:text-white")}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className={btn("border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 w-full py-2")}>+ Add Video</button>
      )}
    </div>
  );
}

// ── Topic edit panel ──────────────────────────────────────────────────────────

function TopicPanel({ topicId, onBack }: { topicId: number; onBack: () => void }) {
  const [detail, setDetail] = useState<AdminTopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "subtopics" | "videos">("subtopics");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Form fields
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("indigo");
  const [level, setLevel] = useState("0");
  const [pos, setPos] = useState("0");
  const [prereqs, setPrereqs] = useState("");

  function load() {
    setLoading(true);
    adminApi.topicDetail(topicId)
      .then((d) => {
        setDetail(d);
        setSlug(d.slug); setTitle(d.title); setDesc(d.description);
        setIcon(d.icon); setColor(d.color);
        setLevel(String(d.level)); setPos(String(d.position_in_level));
        setPrereqs((d.prerequisites || []).join(", "));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [topicId]);

  async function saveTopic() {
    setSaving(true); setErr("");
    try {
      await adminApi.updateTopic(topicId, {
        slug, title, description: desc, icon, color,
        level: parseInt(level) || 0, position_in_level: parseInt(pos) || 0,
        prerequisites: prereqs.split(",").map(s => s.trim()).filter(Boolean),
      });
      load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Loading…</div>;
  if (!detail) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Panel header */}
      <div className="sticky top-0 bg-gray-950 border-b border-gray-800 px-6 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-white text-sm">← Topics</button>
        <span className="text-white font-semibold">{detail.icon} {detail.title}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 border-b border-gray-800">
        {(["info", "subtopics", "videos"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === t ? "border-indigo-500 text-indigo-300" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            {t === "info" ? "Info" : t === "subtopics" ? `Subtopics (${detail.subtopics.length})` : `Videos (${detail.videos.length})`}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "info" && (
          <div className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slug"><input className={inp} value={slug} onChange={e => setSlug(e.target.value)} /></Field>
              <Field label="Icon (emoji)"><input className={inp} value={icon} onChange={e => setIcon(e.target.value)} /></Field>
            </div>
            <Field label="Title"><input className={inp} value={title} onChange={e => setTitle(e.target.value)} /></Field>
            <Field label="Description"><textarea className={inp} rows={2} value={desc} onChange={e => setDesc(e.target.value)} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Color"><input className={inp} value={color} onChange={e => setColor(e.target.value)} placeholder="indigo" /></Field>
              <Field label="Level (column)"><input className={inp} type="number" value={level} onChange={e => setLevel(e.target.value)} /></Field>
              <Field label="Position (row)"><input className={inp} type="number" value={pos} onChange={e => setPos(e.target.value)} /></Field>
            </div>
            <Field label="Prerequisites (comma-separated slugs)">
              <input className={inp} value={prereqs} onChange={e => setPrereqs(e.target.value)} placeholder="arrays-hashing, two-pointers" />
            </Field>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button onClick={saveTopic} disabled={saving} className={btn("bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white")}>
              {saving ? "Saving…" : "Save Topic"}
            </button>
          </div>
        )}

        {activeTab === "subtopics" && (
          <SubTopicSection topicId={topicId} subtopics={detail.subtopics} onRefresh={load} />
        )}

        {activeTab === "videos" && (
          <VideoSection topicId={topicId} videos={detail.videos} onRefresh={load} />
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminTopicsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  // New topic form
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("indigo");
  const [level, setLevel] = useState("0");
  const [pos, setPos] = useState("0");
  const [prereqs, setPrereqs] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function loadTopics() {
    adminApi.listTopics().then(setTopics).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!user.is_admin) { router.replace("/topics"); return; }
    loadTopics();
  }, [user, authLoading, router]);

  async function createTopic() {
    setSaving(true); setErr("");
    try {
      const { id } = await adminApi.createTopic({
        slug, title, description: desc, icon, color,
        level: parseInt(level) || 0, position_in_level: parseInt(pos) || 0,
        prerequisites: prereqs.split(",").map(s => s.trim()).filter(Boolean),
      });
      setCreating(false); setSlug(""); setTitle(""); setDesc(""); setIcon(""); setColor("indigo");
      loadTopics();
      setSelected(id);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  }

  async function deleteTopic(id: number) {
    if (!confirm("Delete this topic and all its subtopics/playcards?")) return;
    await adminApi.deleteTopic(id);
    if (selected === id) setSelected(null);
    loadTopics();
  }

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">Loading…</div>;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AdminNav email={user?.email} logout={logout} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: topic list */}
        <div className="w-64 shrink-0 border-r border-gray-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-800">
            <button onClick={() => { setCreating(true); setSelected(null); }}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">
              + New Topic
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {topics.map((t) => (
              <div
                key={t.id}
                onClick={() => { setSelected(t.id); setCreating(false); }}
                className={`flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-gray-800 hover:bg-gray-900 ${selected === t.id ? "bg-gray-900 border-l-2 border-l-indigo-500" : ""}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span>{t.icon}</span>
                    <span className="text-sm text-white truncate">{t.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">Lv.{t.level} · {t.subtopics_count} subtopics</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTopic(t.id); }}
                  className="text-gray-600 hover:text-red-400 text-xs ml-1 shrink-0"
                >✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
          {creating ? (
            <div className="p-6 overflow-y-auto">
              <h2 className="text-white font-semibold text-lg mb-4">New Topic</h2>
              <div className="space-y-4 max-w-xl">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Slug"><input className={inp} value={slug} onChange={e => setSlug(e.target.value)} placeholder="binary-search" /></Field>
                  <Field label="Icon (emoji)"><input className={inp} value={icon} onChange={e => setIcon(e.target.value)} placeholder="🔍" /></Field>
                </div>
                <Field label="Title"><input className={inp} value={title} onChange={e => setTitle(e.target.value)} /></Field>
                <Field label="Description"><textarea className={inp} rows={2} value={desc} onChange={e => setDesc(e.target.value)} /></Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Color"><input className={inp} value={color} onChange={e => setColor(e.target.value)} /></Field>
                  <Field label="Level"><input className={inp} type="number" value={level} onChange={e => setLevel(e.target.value)} /></Field>
                  <Field label="Position"><input className={inp} type="number" value={pos} onChange={e => setPos(e.target.value)} /></Field>
                </div>
                <Field label="Prerequisites (slugs, comma-separated)">
                  <input className={inp} value={prereqs} onChange={e => setPrereqs(e.target.value)} placeholder="arrays-hashing" />
                </Field>
                {err && <p className="text-red-400 text-xs">{err}</p>}
                <div className="flex gap-2">
                  <button onClick={createTopic} disabled={saving} className={btn("bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white")}>
                    {saving ? "Creating…" : "Create Topic"}
                  </button>
                  <button onClick={() => setCreating(false)} className={btn("border border-gray-700 text-gray-400 hover:text-white")}>Cancel</button>
                </div>
              </div>
            </div>
          ) : selected ? (
            <TopicPanel key={selected} topicId={selected} onBack={() => setSelected(null)} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 text-sm gap-2">
              <span className="text-3xl">🗂️</span>
              <span>Select a topic to edit, or create a new one.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
