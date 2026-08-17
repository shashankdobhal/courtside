import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTournament } from "@/lib/actions/tournaments";
import { calculateStandings, calculateChampion } from "@/lib/algorithms/standings";
import { TournamentStatus, MatchStatus } from "@/types";
import { TournamentProgress } from "@/components/tournament-progress";
import { ChampionBanner } from "@/components/champion-banner";
import { StandingsTable } from "@/components/standings-table";
import { FixturesList } from "@/components/fixtures-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
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

  const matchCards: MatchCardData[] = tournament.matches.map((m) => ({
    id: m.id,
    round: m.round,
    player1Id: m.player1Id,
    player2Id: m.player2Id ?? "",
    player1Name: playersById.get(m.player1Id)?.name ?? "Unknown",
    player2Name: (m.player2Id && playersById.get(m.player2Id)?.name) ?? "Unknown",
    score1: m.score1,
    score2: m.score2,
    winnerId: m.winnerId,
    status: m.status,
  }));

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

      {champion && <div className="mb-6"><ChampionBanner name={champion.name} /></div>}

      <Tabs defaultValue="fixtures">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
        </TabsList>
        <TabsContent value="fixtures">
          <FixturesList matches={matchCards} />
        </TabsContent>
        <TabsContent value="standings">
          <StandingsTable standings={standings} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
