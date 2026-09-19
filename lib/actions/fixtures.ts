"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateRoundRobinFixtures, diffRegeneratedFixtures } from "@/lib/algorithms/fixtures";
import { progressTournament } from "@/lib/actions/matches";
import { requireTournamentOwner } from "@/lib/auth-helpers";
import { MatchStatus, Round, TournamentStatus } from "@/types";

/**
 * Rebuilds not-yet-played league fixtures from the current (active) player
 * list. Only available before any knockout match exists — which, since
 * knockout seeding only happens once every league match is decided, is
 * exactly the window where there's still something meaningful to reshuffle.
 * Already-completed matches are never touched.
 */
export async function regenerateFixtures(tournamentId: string) {
  await requireTournamentOwner(tournamentId);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true, matches: true },
  });
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== TournamentStatus.ACTIVE) {
    throw new Error("Fixtures can only be regenerated while the tournament is active");
  }
  if (tournament.matches.some((m) => m.round !== Round.LEAGUE)) {
    throw new Error("Fixtures can no longer be regenerated once the knockout stage has started");
  }

  const activePlayers = tournament.players.filter((p) => !p.withdrawn);
  const completedPairings: [string, string | null][] = tournament.matches
    .filter((m) => m.status === MatchStatus.COMPLETED)
    .map((m) => [m.player1Id, m.player2Id]);

  const idealFixtures = generateRoundRobinFixtures(activePlayers, tournament.legs);
  const diffed = diffRegeneratedFixtures(idealFixtures, completedPairings);

  const maxOrder = tournament.matches.reduce((max, m) => Math.max(max, m.matchOrder), -1);
  const newFixtures = diffed.map((f, i) => ({ ...f, matchOrder: maxOrder + 1 + i, tournamentId }));

  await prisma.$transaction([
    prisma.match.deleteMany({
      where: { tournamentId, round: Round.LEAGUE, status: MatchStatus.PENDING },
    }),
    prisma.match.createMany({ data: newFixtures }),
  ]);

  await progressTournament(tournamentId);

  revalidatePath("/");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/share`);
}
