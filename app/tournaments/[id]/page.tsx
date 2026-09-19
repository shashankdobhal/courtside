import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTournament } from "@/lib/actions/tournaments";
import { prisma } from "@/lib/prisma";
import { calculateStandings, calculateChampion } from "@/lib/algorithms/standings";
import { TournamentFormat, TournamentStatus, MatchStatus, Round } from "@/types";
import { displayName } from "@/utils/format";
import { TournamentProgress } from "@/components/tournament-progress";
import { ChampionBanner } from "@/components/champion-banner";
import { StandingsTable } from "@/components/standings-table";
import { FixturesList } from "@/components/fixtures-list";
import { PlayersList } from "@/components/players-list";
import { TournamentPageActions } from "@/components/tournament-page-actions";
import { AddDoublesMatchDialog } from "@/components/add-doubles-match-dialog";
import { CompleteDoublesSessionButton } from "@/components/complete-doubles-session-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Ban } from "lucide-react";
import type { MatchCardData } from "@/components/match-card";
import { auth } from "@/auth";
import { tournamentStatusLabel, tournamentTypeLabel } from "@/utils/format";

const statusVariant: Record<string, "secondary" | "default" | "outline"> = {
  [TournamentStatus.PENDING]: "outline",
  [TournamentStatus.ACTIVE]: "default",
  [TournamentStatus.COMPLETED]: "secondary",
  [TournamentStatus.CANCELLED]: "outline",
};

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
      isBestOfThree: m.isBestOfThree,
      game1Score1: m.game1Score1,
      game1Score2: m.game1Score2,
      game2Score1: m.game2Score1,
      game2Score2: m.game2Score2,
      game3Score1: m.game3Score1,
      game3Score2: m.game3Score2,
    };
  });

  const completedCount = tournament.matches.filter(
    (m) => m.status === MatchStatus.COMPLETED
  ).length;

  const isDoubles = tournament.format === TournamentFormat.DOUBLES;
  const canRegenerate =
    !isDoubles &&
    tournament.status === TournamentStatus.ACTIVE &&
    tournament.matches.every((m) => m.round === Round.LEAGUE);
  const doublesTeams = tournament.players
    .filter((p) => !p.withdrawn)
    .map((p) => ({ id: p.id, name: displayName(p) }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="relative mb-6 space-y-4 overflow-hidden rounded-3xl border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight">{tournament.name}</h1>
              <Badge variant={statusVariant[tournament.status] ?? "outline"}>
                {tournamentStatusLabel[tournament.status as TournamentStatus] ?? tournament.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isDoubles
                ? "Doubles · Friendly"
                : (tournamentTypeLabel[tournament.type as keyof typeof tournamentTypeLabel] ??
                  tournament.type)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/tournaments/${tournament.id}/share`}>
                <Share2 className="size-3.5" />
                Share
              </Link>
            </Button>
            {isOwner && isDoubles && tournament.status === TournamentStatus.ACTIVE && (
              <CompleteDoublesSessionButton tournamentId={tournament.id} />
            )}
            {isOwner && (
              <TournamentPageActions
                tournamentId={tournament.id}
                name={tournament.name}
                canRegenerate={canRegenerate}
              />
            )}
          </div>
        </div>
        {!isDoubles && (
          <TournamentProgress completed={completedCount} total={tournament.matches.length} />
        )}
      </div>

      {tournament.status === TournamentStatus.CANCELLED && (
        <Badge variant="outline" className="mb-6 gap-1.5 text-muted-foreground">
          <Ban className="size-3.5" />
          This tournament was discontinued
        </Badge>
      )}

      {!isDoubles && champion && (
        <div className="mb-6">
          <ChampionBanner name={displayName(champion)} tournamentId={tournament.id} />
        </div>
      )}

      {isDoubles && isOwner && tournament.status === TournamentStatus.ACTIVE && (
        <div className="mb-6">
          <AddDoublesMatchDialog tournamentId={tournament.id} teams={doublesTeams} />
        </div>
      )}

      <Tabs defaultValue="fixtures">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="players">{isDoubles ? "Teams" : "Players"}</TabsTrigger>
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
