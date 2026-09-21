import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTournament } from "@/lib/actions/tournaments";
import { prisma } from "@/lib/prisma";
import { PlayerEntryForm } from "@/components/player-entry-form";
import { PlayersList } from "@/components/players-list";
import { ShareActions } from "@/components/share-actions";
import { JoinTournamentButton } from "@/components/join-tournament-button";
import { GenerateFixturesButton } from "@/components/generate-fixtures-button";
import { BracketBuilder } from "@/components/bracket-builder";
import { DoublesTeamForm } from "@/components/doubles-team-form";
import { ActivateSessionButton } from "@/components/activate-session-button";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/actions/auth";
import { TournamentFormat, TournamentStatus, TournamentType } from "@/types";
import { usesIndividualRoster } from "@/lib/tournament-mode";
import {
  MIN_PLAYERS_ROUND_ROBIN,
  MIN_PLAYERS_KNOCKOUT,
  MIN_SESSION_PLAYERS_SINGLES,
  MIN_SESSION_PLAYERS_DOUBLES,
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

  const confirmedPlayers = tournament.players.filter((p) => !p.waitlisted);
  const waitlistedPlayers = tournament.players.filter((p) => p.waitlisted);

  let myPlayer: (typeof tournament.players)[number] | null = null;
  if (session?.user?.id && !isOwner) {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
    });
    myPlayer = (profile && tournament.players.find((p) => p.profileId === profile.id)) || null;
  }
  const hasJoined = !!myPlayer;

  const isDoubles = tournament.format === TournamentFormat.DOUBLES;
  const isSession = tournament.type === TournamentType.SESSION;
  const isKnockout = tournament.type === TournamentType.KNOCKOUT;
  // Individual roster (PlayerEntryForm + self-join): singles always, or a
  // casual doubles session (pairs are formed per match, not registered
  // ahead of time). Fixed teams (DoublesTeamForm) otherwise — a
  // tournament-style doubles event needs stable bracket/fixture entities.
  const individualRoster = usesIndividualRoster(tournament);
  const entityLabel = isDoubles && !isSession ? "team" : "player";
  const minRoster = isSession
    ? isDoubles
      ? MIN_SESSION_PLAYERS_DOUBLES
      : MIN_SESSION_PLAYERS_SINGLES
    : tournament.type === TournamentType.ROUND_ROBIN_KNOCKOUT || isKnockout
      ? MIN_PLAYERS_KNOCKOUT
      : MIN_PLAYERS_ROUND_ROBIN;

  const nextStep = isSession ? (
    <ActivateSessionButton
      tournamentId={tournament.id}
      canActivate={confirmedPlayers.length >= minRoster}
      minPlayers={minRoster}
      entityLabel={entityLabel}
    />
  ) : isKnockout ? (
    confirmedPlayers.length >= minRoster ? (
      <BracketBuilder
        tournamentId={tournament.id}
        players={confirmedPlayers}
        entityLabel={entityLabel}
      />
    ) : (
      <p className="text-center text-sm text-muted-foreground">
        At least {minRoster} {entityLabel}s are required to build the bracket.
      </p>
    )
  ) : (
    <GenerateFixturesButton
      tournamentId={tournament.id}
      canGenerate={confirmedPlayers.length >= minRoster}
      minPlayers={minRoster}
      entityLabel={entityLabel}
    />
  );

  const subtitle = individualRoster
    ? isOwner
      ? "Add players, or share this page so others can join themselves."
      : `Join this ${isSession ? "session" : "tournament"}, or wait for the organizer to ${
          isSession ? "start it" : "generate fixtures"
        }.`
    : isOwner
      ? "Form teams, then generate fixtures whenever you're ready."
      : "Waiting for the organizer to form teams and start the tournament.";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-14">
      <div className="relative mb-8 overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
        {tournament.event && (
          <Link
            href={`/events/${tournament.event.id}`}
            className="mb-1 inline-block text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Part of {tournament.event.name}
          </Link>
        )}
        <h1 className="font-heading text-2xl font-bold tracking-tight">{tournament.name}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {confirmedPlayers.length > 0 && (
        <div className="mb-8 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {isDoubles && !isSession ? "Teams" : "Players"} ({confirmedPlayers.length}
            {tournament.playerLimit ? `/${tournament.playerLimit}` : ""})
          </h2>
          <PlayersList players={confirmedPlayers} isOwner={false} />
        </div>
      )}

      {waitlistedPlayers.length > 0 && (
        <div className="mb-8 space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Waiting list ({waitlistedPlayers.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            The roster is full. These {entityLabel}s will join if a spot opens up.
          </p>
          <PlayersList players={waitlistedPlayers} isOwner={isOwner} />
        </div>
      )}

      {isOwner ? (
        <div className="space-y-8">
          {individualRoster ? (
            <>
              {/* No join code for fixed-team doubles below: there's no self-join flow for pre-formed teams. */}
              <ShareActions
                title={tournament.name}
                joinCode={tournament.joinCode}
                venue={tournament.venue}
                scheduledAt={tournament.scheduledAt}
                skillLevels={tournament.skillLevels}
                format={tournament.format}
              />
              <PlayerEntryForm tournamentId={tournament.id} />
            </>
          ) : (
            <>
              <ShareActions title={tournament.name} />
              <DoublesTeamForm tournamentId={tournament.id} />
            </>
          )}
          {nextStep}
        </div>
      ) : individualRoster ? (
        session?.user ? (
          hasJoined ? (
            myPlayer?.waitlisted ? (
              <p className="text-center text-sm text-muted-foreground">
                You&apos;re on the waiting list — the roster is full. We&apos;ll let you know if a
                spot opens up.
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                You&apos;re in! Waiting for the organizer to start the{" "}
                {isSession ? "session" : "tournament"}.
              </p>
            )
          ) : (
            <JoinTournamentButton tournamentId={tournament.id} />
          )
        ) : (
          <form action={signInWithGoogle}>
            <Button type="submit" size="lg" className="h-12 w-full text-base">
              Sign in to join
            </Button>
          </form>
        )
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          The organizer is setting up teams for this tournament.
        </p>
      )}
    </main>
  );
}
