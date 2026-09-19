import { notFound, redirect } from "next/navigation";
import { getTournament } from "@/lib/actions/tournaments";
import { prisma } from "@/lib/prisma";
import { PlayerEntryForm } from "@/components/player-entry-form";
import { PlayersList } from "@/components/players-list";
import { ShareActions } from "@/components/share-actions";
import { JoinTournamentButton } from "@/components/join-tournament-button";
import { GenerateFixturesButton } from "@/components/generate-fixtures-button";
import { DoublesTeamForm } from "@/components/doubles-team-form";
import { ActivateDoublesSessionButton } from "@/components/activate-doubles-session-button";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/actions/auth";
import { TournamentFormat, TournamentStatus, TournamentType } from "@/types";
import {
  MIN_PLAYERS_ROUND_ROBIN,
  MIN_PLAYERS_KNOCKOUT,
  MIN_DOUBLES_TEAMS,
} from "@/lib/validations";
import { auth } from "@/auth";

export default async function PlayersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tournament, session] = await Promise.all([getTournament(id), auth()]);

  if (!tournament) notFound();
  if (tournament.status !== TournamentStatus.PENDING) {
    redirect(`/tournaments/${tournament.id}`);
  }

  const isOwner = !!session?.user?.id && tournament.ownerId === session.user.id;

  let hasJoined = false;
  if (session?.user?.id && !isOwner) {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
    });
    hasJoined = !!profile && tournament.players.some((p) => p.profileId === profile.id);
  }

  const isDoubles = tournament.format === TournamentFormat.DOUBLES;
  const minPlayers =
    tournament.type === TournamentType.ROUND_ROBIN_KNOCKOUT
      ? MIN_PLAYERS_KNOCKOUT
      : MIN_PLAYERS_ROUND_ROBIN;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-14">
      <div className="relative mb-8 overflow-hidden rounded-3xl border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{tournament.name}</h1>
        <p className="text-sm text-muted-foreground">
          {isDoubles
            ? isOwner
              ? "Form teams, then activate the session whenever you're ready."
              : "Waiting for the organizer to form teams and start the session."
            : isOwner
              ? "Add players, or share this page so others can join themselves."
              : "Join this tournament, or wait for the organizer to generate fixtures."}
        </p>
      </div>

      {tournament.players.length > 0 && (
        <div className="mb-8 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {isDoubles ? "Teams" : "Players"} ({tournament.players.length})
          </h2>
          <PlayersList players={tournament.players} isOwner={false} />
        </div>
      )}

      {isDoubles ? (
        isOwner ? (
          <div className="space-y-8">
            <ShareActions title={tournament.name} />
            <DoublesTeamForm tournamentId={tournament.id} />
            <ActivateDoublesSessionButton
              tournamentId={tournament.id}
              canActivate={tournament.players.length >= MIN_DOUBLES_TEAMS}
              minTeams={MIN_DOUBLES_TEAMS}
            />
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            The organizer is setting up teams for this session.
          </p>
        )
      ) : isOwner ? (
        <div className="space-y-8">
          <ShareActions title={tournament.name} />
          <PlayerEntryForm tournamentId={tournament.id} />
          <GenerateFixturesButton
            tournamentId={tournament.id}
            canGenerate={tournament.players.length >= minPlayers}
            minPlayers={minPlayers}
          />
        </div>
      ) : session?.user ? (
        hasJoined ? (
          <p className="text-center text-sm text-muted-foreground">
            You&apos;re in! Waiting for the organizer to start the tournament.
          </p>
        ) : (
          <JoinTournamentButton tournamentId={tournament.id} />
        )
      ) : (
        <form action={signInWithGoogle}>
          <Button type="submit" size="lg" className="h-12 w-full text-base">
            Sign in to join
          </Button>
        </form>
      )}
    </main>
  );
}
