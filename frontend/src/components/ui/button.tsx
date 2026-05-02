"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  default: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200",
  outline: "border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800",
  ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
  destructive: "bg-red-600 text-white hover:bg-red-500",
  success: "bg-emerald-600 text-white hover:bg-emerald-500",
  warning: "bg-amber-600 text-white hover:bg-amber-500",
};

const sizes: Record<string, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  default: "h-9 px-4 text-sm rounded-md",
  lg: "h-11 px-6 text-base rounded-lg",
  icon: "h-9 w-9 rounded-md",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild, children, ...props }, ref) => {
    const cls = cn(
      "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
      variants[variant],
      sizes[size],
      className,
    );
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(cls, (children as React.ReactElement<{ className?: string }>).props.className),
      });
    }
    return <button ref={ref} className={cls} {...props}>{children}</button>;
  }
);
Button.displayName = "Button";
