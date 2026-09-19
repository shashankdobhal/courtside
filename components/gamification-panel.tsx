import { Flame, Sparkles, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlayerGamificationStats } from "@/lib/actions/gamification";

function motivationalCopy(stats: PlayerGamificationStats | null): string {
  if (!stats || stats.gamesPlayed === 0) return "Play your first match to start a streak!";
  if (stats.streak.current === 0) return "Your streak's gone quiet — play today to start a new one.";
  if (!stats.streak.playedToday) return "Streak's alive! Play today to keep it going.";
  if (stats.streak.current >= 7) return "You're on fire! 🔥 Incredible streak.";
  return "You're on a roll — keep it up!";
}

export function GamificationPanel({ stats }: { stats: PlayerGamificationStats | null }) {
  const streak = stats?.streak.current ?? 0;
  const karma = stats?.karma ?? 0;
  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const last7Days = stats?.streak.last7Days ?? [false, false, false, false, false, false, false];
  const last7Labels = stats?.last7Labels ?? ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border p-5 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 60% at 15% -10%, color-mix(in oklch, oklch(0.83 0.15 80) 30%, transparent), transparent 65%), radial-gradient(ellipse 60% 50% at 100% 0%, color-mix(in oklch, oklch(0.7 0.15 300) 22%, transparent), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 110%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 65%)",
        }}
      />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
            <Flame className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="font-heading text-xl font-bold">{streak}</p>
          <p className="text-[11px] leading-tight text-muted-foreground">
            {streak === 1 ? "Day Streak" : "Day Streak"}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/40">
            <Sparkles className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="font-heading text-xl font-bold">{karma}</p>
          <p className="text-[11px] leading-tight text-muted-foreground">Karma</p>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950/40">
            <Swords className="size-5 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="font-heading text-xl font-bold">{gamesPlayed}</p>
          <p className="text-[11px] leading-tight text-muted-foreground">Games Played</p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-center gap-2 sm:gap-3">
        {last7Days.map((played, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">{last7Labels[i]}</span>
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-full transition-colors",
                played
                  ? "bg-amber-400 text-white dark:bg-amber-500"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {played && <Flame className="size-3.5" />}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">{motivationalCopy(stats)}</p>
    </div>
  );
}
