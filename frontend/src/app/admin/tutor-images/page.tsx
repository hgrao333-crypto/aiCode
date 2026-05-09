"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Tutor images config — add image keys here as they're designed for each topic/stage
const IMAGE_CONFIG: Array<{
  topic_slug: string;
  topic_label: string;
  stage: number;
  stage_title: string;
  image_key: string;
  default_prompt: string;
  default_caption: string;
  default_explanation: string;
}> = [
  {
    topic_slug: "arrays-hashing",
    topic_label: "Arrays & Hashing",
    stage: 1,
    stage_title: "Memory & Indexing",
    image_key: "memory-layout",
    default_prompt:
      "Large educational diagram filling the ENTIRE canvas edge-to-edge (20px margins only). " +
      "Show an array [10, 20, 30, 40] stored in contiguous memory. " +
      "Draw 4 large adjacent boxes (each ~180px wide) labeled arr[0]–arr[3] with values inside. " +
      "Below each box show the memory address: 1000, 1004, 1008, 1012. Highlight arr[2] box in blue. " +
      "At the bottom, display the formula in large bold text: addr(arr[i]) = base + i × element_size. " +
      "Use very large fonts (18pt minimum), thick borders, white background, soft blue/green palette. No title. No empty space.",
    default_caption: "Every arr[i] sits at a predictable address — O(1) direct access, no scanning.",
    default_explanation:
      "Arrays store elements in consecutive (contiguous) memory. Python computes the address of any element directly using base + i × size — no loop needed. That's why arr[i] is always O(1).",
  },
  {
    topic_slug: "arrays-hashing",
    topic_label: "Arrays & Hashing",
    stage: 2,
    stage_title: "How Hashing Works",
    image_key: "hash-buckets",
    default_prompt:
      "Large educational diagram filling the ENTIRE canvas edge-to-edge (20px margins only). " +
      "Left side: large purple box labeled 'key: apple' with a bold arrow pointing right into a yellow box labeled 'hash() % 8 = 0'. " +
      "Right side: a vertical column of 8 large bucket slots (b[0]–b[7]), each ~60px tall. " +
      "b[0] = 'apple→5' (green), b[5] = 'cat→2' (green), b[7] = 'dog→8' (green), others show '—'. " +
      "A bold arrow from the hash box points to b[0]. Use very large fonts (18pt min), thick borders. White background. No title. No empty space.",
    default_caption: "hash(key) → bucket index → value. One arithmetic step, not a search. O(1).",
    default_explanation:
      "A hash map converts keys to array indices using a hash function. Python reads the bucket at that index directly — no loop through all keys. Average O(1) for both get and set.",
  },
  {
    topic_slug: "arrays-hashing",
    topic_label: "Arrays & Hashing",
    stage: 3,
    stage_title: "The Complement Trick",
    image_key: "two-sum-trace",
    default_prompt:
      "Large educational diagram filling the ENTIRE canvas edge-to-edge (20px margins only). " +
      "Draw a 2-row table with columns: i | n | comp | seen dict | result. Each cell is large (~120px wide, 70px tall). " +
      "Row 1: 0 | 2 | 7 | {} → {2:0} | '7 not in seen'. " +
      "Row 2: 1 | 7 | 2 | {2:0} | '✓ return [0,1]'. Highlight entire row 2 in bright green. " +
      "Header row in indigo. Bold monospace font 18pt minimum. White background. No empty space.",
    default_caption: "Single pass: check complement → found or store. O(n) time, O(n) space.",
    default_explanation:
      "For each number n, check if (target − n) is already in the seen dict. If yes → return the pair. If no → store n and continue. One pass replaces the O(n²) nested loop.",
  },
];

type StoredImage = {
  id: number; topic_slug: string; stage: number; image_key: string;
  caption: string | null; explanation: string | null; url: string; created_at: string | null;
};

export default function TutorImagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [storedImages, setStoredImages] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null); // "slug/stage/key"
  const [error, setError] = useState("");
  const [editingPrompts, setEditingPrompts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!user.is_admin) { router.replace("/demo"); return; }
    adminApi.listTutorImages()
      .then(setStoredImages)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  function getStored(topic_slug: string, stage: number, image_key: string): StoredImage | undefined {
    return storedImages.find(s => s.topic_slug === topic_slug && s.stage === stage && s.image_key === image_key);
  }

  function promptKey(topic_slug: string, stage: number, image_key: string) {
    return `${topic_slug}/${stage}/${image_key}`;
  }

  async function generate(cfg: typeof IMAGE_CONFIG[number]) {
    const key = promptKey(cfg.topic_slug, cfg.stage, cfg.image_key);
    const prompt = editingPrompts[key] ?? cfg.default_prompt;
    setGenerating(key);
    setError("");
    try {
      const result = await adminApi.generateTutorImage({
        topic_slug: cfg.topic_slug,
        stage: cfg.stage,
        image_key: cfg.image_key,
        prompt,
        caption: cfg.default_caption,
        explanation: cfg.default_explanation,
      });
      setStoredImages(prev => {
        const without = prev.filter(s => !(s.topic_slug === cfg.topic_slug && s.stage === cfg.stage && s.image_key === cfg.image_key));
        return [...without, { id: result.id, topic_slug: result.topic_slug, stage: result.stage, image_key: result.image_key, caption: cfg.default_caption, explanation: cfg.default_explanation, url: result.url, created_at: new Date().toISOString() }];
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(null);
    }
  }

  async function deleteImage(id: number, topic_slug: string, stage: number, image_key: string) {
    try {
      await adminApi.deleteTutorImage(id);
      setStoredImages(prev => prev.filter(s => s.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
    void topic_slug; void stage; void image_key;
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-bark-500 text-sm">Loading…</div>;
  }

  // Group by topic
  const byTopic: Record<string, typeof IMAGE_CONFIG> = {};
  for (const cfg of IMAGE_CONFIG) {
    if (!byTopic[cfg.topic_slug]) byTopic[cfg.topic_slug] = [];
    byTopic[cfg.topic_slug].push(cfg);
  }

  return (
    <div className="min-h-screen text-bark-900 flex flex-col">
      <nav className="border-b border-bark-200 bg-bark-50/90 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-bark-500 text-sm hover:text-bark-900 transition-colors">← Admin</Link>
          <span className="text-bark-300">|</span>
          <span className="text-sm font-medium text-bark-700">Tutor Images</span>
          <span className="text-xs px-2 py-0.5 bg-saffron-100 text-saffron-700 rounded-full border border-saffron-200 font-semibold">ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-600 max-w-xs truncate">{error}</span>}
          <span className="text-xs text-bark-400">
            {storedImages.length} image{storedImages.length !== 1 ? "s" : ""} stored
          </span>
        </div>
      </nav>

      <main className="flex-1 px-8 py-7 max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-xl font-bold text-bark-900">Tutor Image Generator</h1>
          <p className="text-sm text-bark-500 mt-1">
            Pre-generate educational images via Gemini for each topic stage. Images are stored in the database
            and shown in the AI tutor chat as students progress through the course.
          </p>
        </div>

        {Object.entries(byTopic).map(([topicSlug, cfgs]) => (
          <div key={topicSlug} className="mb-10">
            <h2 className="text-sm font-bold text-bark-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-6 h-px bg-bark-200 inline-block" />
              {cfgs[0].topic_label}
              <span className="w-6 h-px bg-bark-200 inline-block" />
            </h2>

            <div className="space-y-5">
              {cfgs.map(cfg => {
                const stored = getStored(cfg.topic_slug, cfg.stage, cfg.image_key);
                const key = promptKey(cfg.topic_slug, cfg.stage, cfg.image_key);
                const isGenerating = generating === key;
                const prompt = editingPrompts[key] ?? cfg.default_prompt;

                return (
                  <div key={key} className="rounded-2xl border border-bark-200 bg-white overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="px-5 py-3.5 border-b border-bark-100 flex items-center justify-between bg-bark-50">
                      <div>
                        <div className="text-xs font-semibold text-bark-500 uppercase tracking-wide">
                          Stage {cfg.stage} — {cfg.stage_title}
                        </div>
                        <code className="text-xs text-bark-400 mt-0.5 block font-mono">{cfg.image_key}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        {stored ? (
                          <>
                            <span className="text-xs text-emerald-600 font-medium">✓ Generated</span>
                            <button
                              onClick={() => deleteImage(stored.id, cfg.topic_slug, cfg.stage, cfg.image_key)}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:border-red-300 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-bark-400">Not generated</span>
                        )}
                        <button
                          onClick={() => generate(cfg)}
                          disabled={isGenerating}
                          className="px-4 py-1.5 rounded-lg bg-leaf-700 hover:bg-leaf-600 disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          {isGenerating ? (
                            <>
                              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Generating…
                            </>
                          ) : stored ? "Regenerate" : "Generate with Gemini"}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-0 divide-x divide-bark-100">
                      {/* Left: prompt editor */}
                      <div className="flex-1 p-4 space-y-3">
                        <label className="block text-xs font-semibold text-bark-600 uppercase tracking-wide">
                          Generation Prompt
                        </label>
                        <textarea
                          value={prompt}
                          onChange={e => setEditingPrompts(prev => ({ ...prev, [key]: e.target.value }))}
                          rows={5}
                          spellCheck={false}
                          className="w-full text-xs font-mono border border-bark-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-leaf-400 resize-y bg-white text-bark-800 leading-relaxed"
                        />
                        <div className="text-xs text-bark-400">
                          <strong>Caption:</strong> {cfg.default_caption}
                        </div>
                        <div className="text-xs text-bark-400">
                          <strong>Teaching text:</strong> {cfg.default_explanation}
                        </div>
                      </div>

                      {/* Right: image preview */}
                      <div className="w-64 flex-shrink-0 p-4 flex flex-col gap-2">
                        <label className="block text-xs font-semibold text-bark-600 uppercase tracking-wide">
                          Preview
                        </label>
                        {stored ? (
                          <div className="rounded-xl overflow-hidden border border-bark-200 bg-bark-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${API_BASE}${stored.url}`}
                              alt={cfg.image_key}
                              className="w-full h-auto block"
                              key={stored.id}
                            />
                            {stored.created_at && (
                              <p className="px-2 py-1.5 text-[10px] text-bark-400 border-t border-bark-100">
                                Generated {new Date(stored.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 rounded-xl border-2 border-dashed border-bark-200 flex items-center justify-center text-bark-300 text-xs min-h-32">
                            No image yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
