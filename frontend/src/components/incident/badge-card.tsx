"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

type Props = {
  badge: {
    label: string;
    tagline: string | null;
    icon_url: string;
    earned_at?: string;
  };
  animate?: boolean;
};

export function BadgeCard({ badge, animate = true }: Props) {
  return (
    <motion.div
      initial={animate ? { scale: 0.8, opacity: 0, rotate: -6 } : false}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 12 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-950 border-emerald-500/30">
        <div className="pointer-events-none absolute inset-0 opacity-30 blur-2xl">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-emerald-400/30" />
        </div>
        <CardContent className="relative flex items-center gap-4 py-6">
          <motion.div
            initial={animate ? { scale: 0, rotate: -90 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="grid h-16 w-16 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/30"
          >
            <Trophy className="h-8 w-8" />
          </motion.div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-emerald-400">Badge unlocked</div>
            <div className="text-lg font-semibold">{badge.label}</div>
            {badge.tagline && <div className="text-xs text-zinc-400">{badge.tagline}</div>}
            {badge.earned_at && (
              <div className="mt-1 font-mono text-[10px] text-zinc-500">
                {new Date(badge.earned_at).toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
