import { Flame, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { calculateKarmaLevel } from "@/lib/algorithms/gamification";
import type { PlayerGamificationStats } from "@/lib/actions/gamification";

export function GamificationPanel({ stats }: { stats: PlayerGamificationStats | null }) {
  const hasActivity = !!stats && stats.gamesPlayed > 0;

  if (!hasActivity) {
    return (
      <div className="rounded-2xl border bg-background p-5">
        <p className="font-medium">🔥 Start your streak</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Play your first match to start building your CourtSide record.
        </p>
      </div>
    );
  }

  const streak = stats.streak.current;
  const karma = stats.karma;
  const level = stats.karmaLevel ?? calculateKarmaLevel(karma);

  return (
    <div className="rounded-2xl border bg-background p-5">
      <div className="flex items-center gap-4 text-sm font-medium">
        <span className="flex items-center gap-1.5">
          <Flame className="size-4 text-amber-500" />
          {streak} day streak
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-4 text-violet-500" />
          {karma} karma
        </span>
      </div>

      <p className="font-heading mt-3 text-sm font-bold tracking-tight uppercase">{level.level}</p>
      <Progress value={level.progressToNextLevel * 100} className="mt-2 h-1.5" />
      <p className="mt-1.5 text-xs text-muted-foreground">
        {level.nextLevel ? `${level.karmaToNextLevel} karma to ${level.nextLevel}` : "Top tier reached!"}
      </p>
    </div>
  );
}
