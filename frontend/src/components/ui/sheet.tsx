"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type SheetCtx = { open: boolean; setOpen: (v: boolean) => void };
const Ctx = React.createContext<SheetCtx>({ open: false, setOpen: () => {} });

export function Sheet({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); onOpenChange?.(v); };
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function SheetTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement<{ onClick?: React.MouseEventHandler }> }) {
  const { setOpen } = React.useContext(Ctx);
  if (asChild) {
    return React.cloneElement(children, { onClick: () => setOpen(true) });
  }
  return <button onClick={() => setOpen(true)}>{children}</button>;
}

export function SheetContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, setOpen } = React.useContext(Ctx);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl overflow-y-auto p-6",
          className ?? "w-[380px] sm:w-[420px]",
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </>
  );
}

export function SheetHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}
export function SheetTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-lg font-semibold text-zinc-100", className)}>{children}</h2>;
}
export function SheetDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("text-sm text-zinc-400 mt-1", className)}>{children}</p>;
}
