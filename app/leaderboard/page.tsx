import { format } from "date-fns";
import { getWeeklyLeaderboard, getMonthlyLeaderboard } from "@/lib/actions/leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardTable } from "@/components/leaderboard-table";

export default async function LeaderboardPage() {
  const [weekly, monthly] = await Promise.all([getWeeklyLeaderboard(), getMonthlyLeaderboard()]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Leaderboard</h1>

      <Tabs defaultValue="weekly">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {format(weekly.range.start, "MMM d")} – {format(weekly.range.end, "MMM d, yyyy")}
          </p>
          <LeaderboardTable rows={weekly.rows} trends={weekly.trends} />
        </TabsContent>
        <TabsContent value="monthly" className="space-y-3">
          <p className="text-sm text-muted-foreground">{format(monthly.range.start, "MMMM yyyy")}</p>
          <LeaderboardTable rows={monthly.rows} trends={monthly.trends} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
