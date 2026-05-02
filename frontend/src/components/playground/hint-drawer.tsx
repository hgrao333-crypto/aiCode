"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Lightbulb, Lock } from "lucide-react";
import type { Hint } from "@/lib/playground/types";
import { cn } from "@/lib/utils";

export function HintDrawer({
  hints,
  revealed,
  onReveal,
}: {
  hints: Hint[];
  revealed: string[];
  onReveal: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const used = revealed.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Lightbulb className="h-4 w-4 text-amber-400" />
          Hints
          <span className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono">
            {used}/{hints.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>Hints</SheetTitle>
          <SheetDescription>
            Each hint costs points. Only spend them if you&apos;re actually
            stuck.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {hints.map((h, i) => {
            const open = revealed.includes(h.id);
            return (
              <HintCard
                key={h.id}
                hint={h}
                index={i + 1}
                open={open}
                onReveal={() => onReveal(h.id)}
              />
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HintCard({
  hint,
  index,
  open,
  onReveal,
}: {
  hint: Hint;
  index: number;
  open: boolean;
  onReveal: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition",
        open
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-zinc-800 bg-zinc-900/40"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-800 text-xs font-mono">
            {index}
          </span>
          {open ? hint.title : "Hint locked"}
        </div>
        <span className="font-mono text-xs text-red-400">-{hint.cost} pts</span>
      </div>
      {open ? (
        <p className="text-sm text-zinc-300 leading-relaxed">{hint.body}</p>
      ) : (
        <Button size="sm" variant="outline" onClick={onReveal}>
          <Lock className="h-3.5 w-3.5" /> Reveal hint
        </Button>
      )}
    </div>
  );
}
