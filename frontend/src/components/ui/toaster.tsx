"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
};

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
  }, []);

  React.useEffect(() => {
    (window as unknown as { __toast?: typeof addToast }).__toast = addToast;
  }, [addToast]);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start justify-between gap-3 rounded-lg border p-4 shadow-lg",
            t.variant === "success" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-50",
            t.variant === "destructive" && "border-red-500/40 bg-red-900/80 text-red-50",
            (!t.variant || t.variant === "default") && "border-zinc-700 bg-zinc-900 text-zinc-100",
          )}
        >
          <div className="flex-1">
            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
            {t.description && <div className="text-xs mt-0.5 opacity-80">{t.description}</div>}
          </div>
          <button
            onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
            className="opacity-60 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function toast(t: Omit<ToastItem, "id">) {
  if (typeof window !== "undefined") {
    const fn = (window as unknown as { __toast?: (t: Omit<ToastItem, "id">) => void }).__toast;
    fn?.(t);
  }
}
