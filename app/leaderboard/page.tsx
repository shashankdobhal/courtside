import { format } from "date-fns";
import { getWeeklyLeaderboard } from "@/lib/actions/leaderboard";
import { LeaderboardTable } from "@/components/leaderboard-table";

export default async function LeaderboardPage() {
  const weekly = await getWeeklyLeaderboard();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Weekly Leaderboard</h1>
      <p className="text-sm text-muted-foreground">
        {format(weekly.range.start, "MMM d")} – {format(weekly.range.end, "MMM d, yyyy")}
      </p>
      <p className="mb-6 text-xs text-muted-foreground">
        Only players who&apos;ve opted in on their profile are counted here.
      </p>
      <LeaderboardTable rows={weekly.rows} trends={weekly.trends} />
    </main>
  );
}
