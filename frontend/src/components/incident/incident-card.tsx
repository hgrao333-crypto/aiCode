import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Lock, PlayCircle, CheckCircle2, ListChecks, Wrench, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IncidentWithStage } from "@/lib/api";

function stageMeta(stage: IncidentWithStage["stage"]) {
  switch (stage) {
    case "locked": return { label: "Locked", color: "text-zinc-500", Icon: Lock };
    case "learn": return { label: "Learn", color: "text-sky-400", Icon: PlayCircle };
    case "quiz": return { label: "Quiz", color: "text-amber-400", Icon: ListChecks };
    case "play": return { label: "Playground", color: "text-emerald-400", Icon: Wrench };
    case "done": return { label: "Solved", color: "text-emerald-400", Icon: CheckCircle2 };
  }
}

export function IncidentCard({ incident }: { incident: IncidentWithStage }) {
  const { stage, video_progress, best_score, badge_earned } = incident;
  const { label, color, Icon } = stageMeta(stage);
  const href =
    stage === "locked" ? "#"
    : stage === "learn" ? `/incidents/${incident.slug}/learn`
    : stage === "quiz" ? `/incidents/${incident.slug}/quiz`
    : stage === "play" ? `/incidents/${incident.slug}/playground`
    : `/incidents/${incident.slug}/debrief`;

  const diffVariant = incident.difficulty === "HARD" ? "destructive" : incident.difficulty === "MEDIUM" ? "warning" : "success";

  return (
    <Card className={cn("group transition-colors", stage === "locked" ? "opacity-60" : "hover:border-emerald-500/40 hover:bg-zinc-900")}>
      <CardHeader className="pb-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={diffVariant as "success" | "warning" | "destructive"}>{incident.difficulty}</Badge>
          <Badge variant="secondary">{incident.domain}</Badge>
          <span className={cn("ml-auto flex items-center gap-1 text-xs", color)}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </span>
        </div>
        <CardTitle className="text-lg leading-snug">{incident.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="line-clamp-2 text-sm text-zinc-400">{incident.description}</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Progress</span>
            <span className="font-mono">{video_progress}%</span>
          </div>
          <Progress value={video_progress} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            {badge_earned ? (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <Trophy className="h-3.5 w-3.5" /> Badge earned · score {best_score ?? 0}
              </span>
            ) : best_score !== null ? (
              <>best score <span className="text-zinc-200">{best_score}</span></>
            ) : (
              <>not started</>
            )}
          </div>
          <Button asChild size="sm" disabled={stage === "locked"} variant={stage === "locked" ? "outline" : "default"}>
            <Link href={href}>{stage === "locked" ? "Locked" : "Open"}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
