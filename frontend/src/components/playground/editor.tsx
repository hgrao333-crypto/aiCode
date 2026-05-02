"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FileCode2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-xs text-zinc-500">
      Loading editor…
    </div>
  ),
});

export type EditorFile = {
  path: string;
  language: string;
  content: string;
  readOnly?: boolean;
};

export function CodeEditor({
  files,
  onChange,
}: {
  files: EditorFile[];
  onChange: (path: string, content: string) => void;
}) {
  const [activePath, setActivePath] = useState(files[0]?.path ?? "");
  const file = files.find((f) => f.path === activePath) ?? files[0];

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center overflow-x-auto border-b border-zinc-800 bg-zinc-950/80">
        {files.map((f) => (
          <button
            key={f.path}
            onClick={() => setActivePath(f.path)}
            className={cn(
              "group flex items-center gap-2 border-r border-zinc-800 px-3 py-2 text-xs font-mono whitespace-nowrap hover:bg-zinc-900",
              f.path === activePath
                ? "bg-zinc-900 text-zinc-100"
                : "text-zinc-400"
            )}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            {f.path}
            {f.readOnly && <Lock className="h-3 w-3 text-zinc-600" />}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {file && (
          <MonacoEditor
            key={file.path}
            path={file.path}
            language={file.language}
            value={file.content}
            theme="vs-dark"
            options={{
              readOnly: file.readOnly,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
              padding: { top: 12 },
            }}
            onChange={(v) => onChange(file.path, v ?? "")}
          />
        )}
      </div>
    </div>
  );
}
