import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTournament } from "@/lib/actions/tournaments";
import { calculateStandings, calculateChampion } from "@/lib/algorithms/standings";
import { TournamentStatus, MatchStatus } from "@/types";
import { displayName } from "@/utils/format";
import { TournamentProgress } from "@/components/tournament-progress";
import { ChampionBanner } from "@/components/champion-banner";
import { StandingsTable } from "@/components/standings-table";
import { FixturesList } from "@/components/fixtures-list";
import { PlayersList } from "@/components/players-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Ban } from "lucide-react";
import type { MatchCardData } from "@/components/match-card";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);

  if (!tournament) notFound();
  if (tournament.status === TournamentStatus.PENDING) {
    redirect(`/tournaments/${tournament.id}/players`);
  }

  const playersById = new Map(tournament.players.map((p) => [p.id, p]));
  const standings = calculateStandings(tournament.players, tournament.matches);
  const champion = calculateChampion({
    type: tournament.type,
    standings,
    matches: tournament.matches,
  });

  const matchCards: MatchCardData[] = tournament.matches.map((m) => {
    const p1 = playersById.get(m.player1Id);
    const p2 = m.player2Id ? playersById.get(m.player2Id) : undefined;
    return {
      id: m.id,
      round: m.round,
      player1Id: m.player1Id,
      player2Id: m.player2Id ?? "",
      player1Name: p1 ? displayName(p1) : "Unknown",
      player2Name: p2 ? displayName(p2) : "Unknown",
      score1: m.score1,
      score2: m.score2,
      winnerId: m.winnerId,
      status: m.status,
    };
  });

  const completedCount = tournament.matches.filter(
    (m) => m.status === MatchStatus.COMPLETED
  ).length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{tournament.name}</h1>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/tournaments/${tournament.id}/share`}>
              <Share2 className="size-3.5" />
              Share
            </Link>
          </Button>
        </div>
        <TournamentProgress completed={completedCount} total={tournament.matches.length} />
      </div>

      {tournament.status === TournamentStatus.CANCELLED && (
        <Badge variant="outline" className="mb-6 gap-1.5 text-muted-foreground">
          <Ban className="size-3.5" />
          This tournament was discontinued
        </Badge>
      )}

      {champion && (
        <div className="mb-6">
          <ChampionBanner name={displayName(champion)} tournamentId={tournament.id} />
        </div>
      )}

      <Tabs defaultValue="fixtures">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
        </TabsList>
        <TabsContent value="fixtures">
          <FixturesList
            matches={matchCards}
            readOnly={tournament.status === TournamentStatus.CANCELLED}
          />
        </TabsContent>
        <TabsContent value="standings">
          <StandingsTable standings={standings} />
        </TabsContent>
        <TabsContent value="players">
          <PlayersList players={tournament.players} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
