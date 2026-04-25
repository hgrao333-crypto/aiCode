"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, VideoFile, AdminTopic } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractYoutubeId(input: string) {
  const match = input.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : input.trim();
}

export default function VideosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<VideoFile[]>([]);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [dbVideos, setDbVideos] = useState<Array<{ id: number; title: string; youtube_id: string; topic_id: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [addingFile, setAddingFile] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState("");
  const [addTopicId, setAddTopicId] = useState("");
  const [addMsg, setAddMsg] = useState<Record<string, string>>({});

  const [ytTopicId, setYtTopicId] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ytSaving, setYtSaving] = useState(false);
  const [ytMsg, setYtMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!user.is_admin) { router.replace("/demo"); return; }
    Promise.all([adminApi.listVideoFiles(), adminApi.listTopics(), adminApi.listYoutubeVideos()])
      .then(([f, t, v]) => { setFiles(f); setTopics(t); setDbVideos(v); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(`Uploading ${file.name}…`);
    setError("");
    try {
      const result = await adminApi.uploadVideo(file);
      setFiles(prev => [...prev, result]);
      setUploadMsg(`✓ ${result.filename} uploaded`);
      setTimeout(() => setUploadMsg(""), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadMsg("");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteDbVideo(id: number, title: string) {
    if (!confirm(`Remove "${title}" from the course?`)) return;
    try {
      await adminApi.deleteVideo(id);
      setDbVideos(prev => prev.filter(v => v.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function deleteFile(filename: string) {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      await adminApi.deleteVideoFile(filename);
      setFiles(prev => prev.filter(f => f.filename !== filename));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function addLocalToTopic(filename: string) {
    if (!addTopicId || !addTitle.trim()) return;
    try {
      await adminApi.createVideo({
        topic_id: parseInt(addTopicId),
        title: addTitle.trim(),
        youtube_id: `local:${filename}`,
        order_index: 0,
      });
      setAddMsg(prev => ({ ...prev, [filename]: "✓ Added" }));
      setTimeout(() => setAddMsg(prev => { const n = { ...prev }; delete n[filename]; return n; }), 3000);
      setAddingFile(null);
      setAddTitle("");
      setAddTopicId("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function addYoutubeVideo(e: React.FormEvent) {
    e.preventDefault();
    setYtSaving(true);
    setError("");
    try {
      await adminApi.createVideo({
        topic_id: parseInt(ytTopicId),
        title: ytTitle,
        youtube_id: extractYoutubeId(ytUrl),
        order_index: 0,
      });
      setYtTitle(""); setYtUrl("");
      setYtMsg("✓ Video added");
      setTimeout(() => setYtMsg(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add video");
    } finally {
      setYtSaving(false);
    }
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">Loading...</div>;
  }

  return (
    <div className="min-h-screen text-zinc-800">
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center gap-3">
        <Link href="/admin" className="text-zinc-500 text-sm hover:text-zinc-800 transition-colors">← Admin</Link>
        <span className="text-zinc-300">|</span>
        <span className="text-sm font-medium text-zinc-700">Videos</span>
        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200 font-semibold">ADMIN</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {/* ── Upload video files ── */}
        <section>
          <h2 className="text-base font-semibold text-zinc-800 mb-4">Upload Video File</h2>

          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className="p-8 rounded-2xl border-2 border-dashed border-zinc-200 bg-white text-center cursor-pointer hover:border-sky-300 transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div className="text-3xl mb-2">🎬</div>
            {uploadMsg ? (
              <p className={`text-sm font-medium ${uploadMsg.startsWith("✓") ? "text-emerald-600" : "text-zinc-600"}`}>{uploadMsg}</p>
            ) : (
              <>
                <p className="text-sm text-zinc-600 mb-1">{uploading ? "Uploading…" : "Click to choose a file"}</p>
                <p className="text-xs text-zinc-400">MP4, WebM, MOV — served from backend</p>
              </>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map(f => (
                <div key={f.filename} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-mono text-zinc-700 truncate block">{f.filename}</span>
                      <span className="text-xs text-zinc-400">{formatSize(f.size)}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {addMsg[f.filename] && (
                        <span className="text-xs text-emerald-600 font-medium">{addMsg[f.filename]}</span>
                      )}
                      <button
                        onClick={() => {
                          setAddingFile(addingFile === f.filename ? null : f.filename);
                          setAddTitle(""); setAddTopicId("");
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 transition-colors font-medium"
                      >
                        + Add to topic
                      </button>
                      <a
                        href={`${BASE}/static/videos/${encodeURIComponent(f.filename)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
                      >
                        Preview ↗
                      </a>
                      <button
                        onClick={() => deleteFile(f.filename)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {addingFile === f.filename && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-100 bg-zinc-50 space-y-2">
                      <input
                        type="text"
                        value={addTitle}
                        onChange={e => setAddTitle(e.target.value)}
                        placeholder="Video title"
                        className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 bg-white text-zinc-800"
                      />
                      <div className="flex gap-2">
                        <select
                          value={addTopicId}
                          onChange={e => setAddTopicId(e.target.value)}
                          className="flex-1 text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white text-zinc-800 focus:outline-none focus:border-sky-400"
                        >
                          <option value="">Select topic…</option>
                          {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => addLocalToTopic(f.filename)}
                          disabled={!addTitle.trim() || !addTopicId}
                          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Current videos in DB ── */}
        {dbVideos.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-zinc-800 mb-4">Current Videos</h2>
            <div className="space-y-2">
              {dbVideos.map(v => {
                const isLocal = v.youtube_id.startsWith("local:");
                const topicName = topics.find(t => t.id === v.topic_id)?.title ?? `Topic ${v.topic_id}`;
                return (
                  <div key={v.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200 bg-white">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-zinc-800 font-medium truncate block">{v.title}</span>
                      <span className="text-xs text-zinc-400">
                        {topicName} · {isLocal ? "Local file" : "YouTube"}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteDbVideo(v.id, v.title)}
                      className="ml-4 text-xs text-red-500 hover:text-red-700 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── YouTube videos ── */}
        <section>
          <h2 className="text-base font-semibold text-zinc-800 mb-4">Add YouTube Video</h2>
          <form onSubmit={addYoutubeVideo} className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Topic</label>
              <select
                value={ytTopicId}
                onChange={e => setYtTopicId(e.target.value)}
                required
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 bg-white text-zinc-800 focus:outline-none focus:border-sky-400"
              >
                <option value="">Select topic…</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Title</label>
              <input
                type="text"
                value={ytTitle}
                onChange={e => setYtTitle(e.target.value)}
                required
                placeholder="e.g. Introduction to Dynamic Programming"
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 text-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">YouTube URL or video ID</label>
              <input
                type="text"
                value={ytUrl}
                onChange={e => setYtUrl(e.target.value)}
                required
                placeholder="https://youtube.com/watch?v=… or dQw4w9WgXcQ"
                className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 text-zinc-800"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={ytSaving}
                className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {ytSaving ? "Adding…" : "Add Video"}
              </button>
              {ytMsg && <span className="text-sm text-emerald-600 font-medium">{ytMsg}</span>}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
