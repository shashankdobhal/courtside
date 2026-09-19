import { format } from "date-fns";
import { getWeeklyLeaderboard } from "@/lib/actions/leaderboard";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PlayerAvatar } from "@/components/player-avatar";
import { BarChart3 } from "lucide-react";

export default async function LeaderboardPage() {
  const weekly = await getWeeklyLeaderboard();
  const leader = weekly.rows[0];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-1 flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" />
        <h1 className="font-heading text-2xl font-bold tracking-tight">Weekly Leaderboard</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        {format(weekly.range.start, "MMM d")} – {format(weekly.range.end, "MMM d, yyyy")}
      </p>
      <p className="mb-6 text-xs text-muted-foreground">
        Only players who&apos;ve opted in on their profile are counted here.
      </p>

      {leader && (
        <div className="mb-6 flex items-center gap-4 rounded-xl border bg-gradient-to-b from-primary/10 to-transparent p-4 duration-500 animate-in fade-in zoom-in-95">
          <PlayerAvatar name={leader.name} size="md" className="size-12 text-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Leading this week
            </p>
            <p className="truncate text-lg font-semibold">{leader.name}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-heading text-2xl font-bold text-primary">
              {leader.won}-{leader.lost}
            </p>
            <p className="text-xs text-muted-foreground">W-L</p>
          </div>
        </div>
      )}

      <LeaderboardTable rows={weekly.rows} trends={weekly.trends} />
    </main>
  );
}
