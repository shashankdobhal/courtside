import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerProfileStats } from "@/lib/actions/player-profiles";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tournamentStatusLabel } from "@/utils/format";
import { TournamentStatus } from "@/types";
import { Trophy, Flame } from "lucide-react";

const statusVariant: Record<string, "secondary" | "default" | "outline"> = {
  [TournamentStatus.PENDING]: "outline",
  [TournamentStatus.ACTIVE]: "default",
  [TournamentStatus.COMPLETED]: "secondary",
  [TournamentStatus.CANCELLED]: "outline",
};

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="items-center gap-1 p-4 text-center">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const data = await getPlayerProfileStats(profileId);

  if (!data) notFound();

  const { profile, stats, tournamentsWon, currentStreak, tournaments } = data;
  const winPct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-3">
        <PlayerAvatar name={profile.name} size="md" />
        <h1 className="text-2xl font-semibold tracking-tight">{profile.name}</h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Played" value={stats.played} />
        <StatTile label="Won" value={stats.won} />
        <StatTile label="Lost" value={stats.lost} />
        <StatTile label="Win %" value={`${winPct}%`} />
        <StatTile
          label="Point Diff"
          value={stats.pointDifference > 0 ? `+${stats.pointDifference}` : stats.pointDifference}
        />
        <StatTile label="Points Scored" value={stats.pointsFor} />
        <StatTile label="Points Conceded" value={stats.pointsAgainst} />
        <Card className="items-center gap-1 p-4 text-center">
          <p className="flex items-center gap-1 text-2xl font-semibold tabular-nums">
            {tournamentsWon}
            <Trophy className="size-4 text-amber-500" />
          </p>
          <p className="text-xs text-muted-foreground">Tournaments Won</p>
        </Card>
      </div>

      {currentStreak > 0 && (
        <Badge variant="secondary" className="mb-8 gap-1.5">
          <Flame className="size-3.5 text-orange-500" />
          {currentStreak} tournament{currentStreak === 1 ? "" : "s"} won in a row
        </Badge>
      )}

      <h2 className="mb-3 text-lg font-semibold tracking-tight">Tournaments</h2>
      {tournaments.length === 0 ? (
        <EmptyState
          title="No tournaments yet"
          description="This player hasn't taken part in a tournament yet."
        />
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <Card className="flex-row items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate font-medium">{t.name}</p>
                  {t.isChampion && <Trophy className="size-3.5 shrink-0 text-amber-500" />}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {t.row && (
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {t.row.won}W - {t.row.lost}L
                    </span>
                  )}
                  <Badge variant={statusVariant[t.status] ?? "outline"}>
                    {tournamentStatusLabel[t.status as TournamentStatus] ?? t.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
