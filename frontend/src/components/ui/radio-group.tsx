"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type RadioGroupCtx = { value?: string; onValueChange?: (v: string) => void };
const Ctx = React.createContext<RadioGroupCtx>({});

export function RadioGroup({
  value,
  onValueChange,
  className,
  children,
}: {
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Ctx.Provider value={{ value, onValueChange }}>
      <div className={cn("grid gap-2", className)}>{children}</div>
    </Ctx.Provider>
  );
}

export function RadioGroupItem({
  value,
  id,
  className,
}: {
  value: string;
  id?: string;
  className?: string;
}) {
  const ctx = React.useContext(Ctx);
  const checked = ctx.value === value;
  return (
    <button
      type="button"
      id={id}
      role="radio"
      aria-checked={checked}
      onClick={() => ctx.onValueChange?.(value)}
      className={cn(
        "h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
        checked ? "border-emerald-500 bg-emerald-500" : "border-zinc-600 bg-transparent",
        className,
      )}
    />
  );
}
