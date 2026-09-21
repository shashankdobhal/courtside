import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTournament } from "@/lib/actions/tournaments";
import { getTournamentExpenses } from "@/lib/actions/expenses";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  calculateStandings,
  calculateIndividualDoublesStandings,
  calculateChampion,
} from "@/lib/algorithms/standings";
import { TournamentFormat, TournamentStatus, TournamentType, MatchStatus, Round } from "@/types";
import { displayName } from "@/utils/format";
import { TournamentProgress } from "@/components/tournament-progress";
import { ChampionBanner } from "@/components/champion-banner";
import { StandingsTable } from "@/components/standings-table";
import { FixturesList } from "@/components/fixtures-list";
import { PlayersList } from "@/components/players-list";
import { TournamentPageActions } from "@/components/tournament-page-actions";
import { YoutubeEmbed } from "@/components/youtube-embed";
import { AddLivestreamPrompt } from "@/components/add-livestream-prompt";
import { AddSessionMatchDialog } from "@/components/add-session-match-dialog";
import { CompleteSessionButton } from "@/components/complete-session-button";
import { ExpensesPanel } from "@/components/expenses-panel";
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
  const [tournament, session, { expenses, settlement }] = await Promise.all([
    getTournament(id),
    auth(),
    getTournamentExpenses(id),
  ]);
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
  const isDoubles = tournament.format === TournamentFormat.DOUBLES;
  const isSession = tournament.type === TournamentType.SESSION;
  const isDoublesSession = isDoubles && isSession;
  // In a casual doubles session, `players` is a mix of the visible roster
  // (individuals) and on-the-fly pairing rows created as matches get
  // logged (see resolveDoublesPairing) — never shown directly, only
  // unwrapped into their two members for individual standings below.
  const rosterPlayers = tournament.players.filter((p) => !p.partnerProfileId);
  const pairingPlayers = tournament.players.filter((p) => p.partnerProfileId);
  const standings = isDoublesSession
    ? calculateIndividualDoublesStandings(rosterPlayers, pairingPlayers, tournament.matches)
    : calculateStandings(tournament.players, tournament.matches);
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

  // A pure knockout bracket has no league stage, so a standings table would
  // just be every player at zero — not meaningful, so it's left out entirely.
  const showStandings = tournament.type !== TournamentType.KNOCKOUT;
  const canRegenerate =
    !isSession &&
    tournament.status === TournamentStatus.ACTIVE &&
    tournament.matches.every((m) => m.round === Round.LEAGUE);
  const typeLabel =
    tournamentTypeLabel[tournament.type as keyof typeof tournamentTypeLabel] ?? tournament.type;
  const subtitle = isDoubles ? `Doubles · ${typeLabel}` : typeLabel;
  // The session "Add Match" dialog only ever picks from the visible
  // individual roster — a doubles session's own on-the-fly pairing rows are
  // resolved behind the scenes, never offered as pickable participants.
  const sessionRoster = rosterPlayers
    .filter((p) => !p.withdrawn)
    .map((p) => ({ id: p.id, name: displayName(p) }));
  const visibleRosterPlayers = isDoublesSession ? rosterPlayers : tournament.players;
  // A fixed-team doubles row has two members, so there's no single UPI ID
  // a "Pay" link could point at — only an individually-rostered player
  // (singles, or anyone in a doubles session) gets one.
  const expenseRoster = visibleRosterPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    alias: p.alias,
    withdrawn: p.withdrawn,
    upiId: p.partnerProfileId ? null : (p.profile?.upiId ?? null),
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="relative mb-6 space-y-4 overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            {tournament.event && (
              <Link
                href={`/events/${tournament.event.id}`}
                className="block text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                Part of {tournament.event.name}
              </Link>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight">{tournament.name}</h1>
              <Badge variant={statusVariant[tournament.status] ?? "outline"}>
                {tournamentStatusLabel[tournament.status as TournamentStatus] ?? tournament.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/tournaments/${tournament.id}/share`}>
                <Share2 className="size-3.5" />
                Share
              </Link>
            </Button>
            {isOwner && isSession && tournament.status === TournamentStatus.ACTIVE && (
              <CompleteSessionButton tournamentId={tournament.id} />
            )}
            {isOwner && (
              <TournamentPageActions
                tournamentId={tournament.id}
                name={tournament.name}
                canRegenerate={canRegenerate}
                youtubeUrl={tournament.youtubeUrl}
                youtubeUrlPublic={tournament.youtubeUrlPublic}
              />
            )}
          </div>
        </div>
        {!isSession && (
          <TournamentProgress completed={completedCount} total={tournament.matches.length} />
        )}
      </div>

      {tournament.youtubeUrl ? (
        <div className="mb-6">
          <YoutubeEmbed url={tournament.youtubeUrl} title={tournament.name} />
        </div>
      ) : (
        isOwner && <AddLivestreamPrompt tournamentId={tournament.id} />
      )}

      {tournament.status === TournamentStatus.CANCELLED && (
        <Badge variant="outline" className="mb-6 gap-2 text-muted-foreground">
          <Ban className="size-3.5" />
          This tournament was discontinued
        </Badge>
      )}

      {!isSession && champion && (
        <div className="mb-6">
          <ChampionBanner name={displayName(champion)} tournamentId={tournament.id} />
        </div>
      )}

      {isSession && isOwner && tournament.status === TournamentStatus.ACTIVE && (
        <div className="mb-6">
          <AddSessionMatchDialog
            tournamentId={tournament.id}
            roster={sessionRoster}
            sideSize={isDoubles ? 2 : 1}
          />
        </div>
      )}

      <Tabs defaultValue="fixtures">
        <TabsList className={cn("mb-4 grid w-full", showStandings ? "grid-cols-4" : "grid-cols-3")}>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          {showStandings && <TabsTrigger value="standings">Standings</TabsTrigger>}
          <TabsTrigger value="players">{isDoubles && !isSession ? "Teams" : "Players"}</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="fixtures">
          <FixturesList
            matches={matchCards}
            readOnly={tournament.status === TournamentStatus.CANCELLED}
            tournamentType={tournament.type}
          />
        </TabsContent>
        {showStandings && (
          <TabsContent value="standings">
            <StandingsTable standings={standings} />
          </TabsContent>
        )}
        <TabsContent value="players">
          <PlayersList
            players={visibleRosterPlayers}
            isOwner={isOwner}
            // Withdrawal voids a player's pending matches by their own row id —
            // in a doubles session, matches reference the on-the-fly pairing
            // row instead, so that wiring doesn't apply here (a withdrawn
            // individual is still excluded from *new* matches, just not
            // retroactively voided out of ones already logged).
            canWithdraw={tournament.status === TournamentStatus.ACTIVE && !isDoublesSession}
          />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesPanel
            tournamentId={tournament.id}
            tournamentName={tournament.name}
            roster={expenseRoster}
            expenses={expenses}
            settlement={settlement}
            isOwner={isOwner}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
