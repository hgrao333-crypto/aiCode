"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type TabsCtx = { active: string; setActive: (v: string) => void };
const Ctx = React.createContext<TabsCtx>({ active: "", setActive: () => {} });

export function Tabs({
  defaultValue,
  className,
  children,
}: {
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [active, setActive] = React.useState(defaultValue ?? "");
  return (
    <Ctx.Provider value={{ active, setActive }}>
      <div className={cn("", className)}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("inline-flex h-9 items-center rounded-lg border border-zinc-800 bg-zinc-900 p-1 gap-1", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const { active, setActive } = React.useContext(Ctx);
  return (
    <button
      type="button"
      onClick={() => setActive(value)}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-colors",
        active === value
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400 hover:text-zinc-200",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const { active } = React.useContext(Ctx);
  if (active !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}
