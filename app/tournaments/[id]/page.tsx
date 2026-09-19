import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTournament } from "@/lib/actions/tournaments";
import { prisma } from "@/lib/prisma";
import { calculateStandings, calculateChampion } from "@/lib/algorithms/standings";
import { TournamentStatus, MatchStatus, Round } from "@/types";
import { displayName } from "@/utils/format";
import { TournamentProgress } from "@/components/tournament-progress";
import { ChampionBanner } from "@/components/champion-banner";
import { StandingsTable } from "@/components/standings-table";
import { FixturesList } from "@/components/fixtures-list";
import { PlayersList } from "@/components/players-list";
import { TournamentPageActions } from "@/components/tournament-page-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Ban } from "lucide-react";
import type { MatchCardData } from "@/components/match-card";
import { auth } from "@/auth";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tournament, session] = await Promise.all([getTournament(id), auth()]);
  const isOwner = !!session?.user?.id && tournament?.ownerId === session.user.id;

  if (!tournament) notFound();
  if (tournament.status === TournamentStatus.PENDING) {
    redirect(`/tournaments/${tournament.id}/players`);
  }

  let viewerProfileId: string | null = null;
  if (session?.user?.id && !isOwner) {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    viewerProfileId = profile?.id ?? null;
  }
  const viewerPlayerIds = new Set(
    tournament.players.filter((p) => p.profileId && p.profileId === viewerProfileId).map((p) => p.id)
  );

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
      canEdit: isOwner || viewerPlayerIds.has(m.player1Id) || viewerPlayerIds.has(m.player2Id ?? ""),
    };
  });

  const completedCount = tournament.matches.filter(
    (m) => m.status === MatchStatus.COMPLETED
  ).length;

  const canRegenerate =
    tournament.status === TournamentStatus.ACTIVE &&
    tournament.matches.every((m) => m.round === Round.LEAGUE);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{tournament.name}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/tournaments/${tournament.id}/share`}>
                <Share2 className="size-3.5" />
                Share
              </Link>
            </Button>
            {isOwner && (
              <TournamentPageActions
                tournamentId={tournament.id}
                name={tournament.name}
                canRegenerate={canRegenerate}
              />
            )}
          </div>
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
            tournamentType={tournament.type}
          />
        </TabsContent>
        <TabsContent value="standings">
          <StandingsTable standings={standings} />
        </TabsContent>
        <TabsContent value="players">
          <PlayersList
            players={tournament.players}
            isOwner={isOwner}
            canWithdraw={tournament.status === TournamentStatus.ACTIVE}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
