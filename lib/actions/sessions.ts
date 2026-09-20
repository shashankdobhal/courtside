"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  sessionMatchSchema,
  MIN_SESSION_PLAYERS_SINGLES,
  MIN_SESSION_PLAYERS_DOUBLES,
} from "@/lib/validations";
import { resolveDoublesPairing } from "@/lib/actions/doubles";
import { requireTournamentOwner, requireSessionMatchParticipantOrOwner } from "@/lib/auth-helpers";
import { MatchStatus, Round, TournamentFormat, TournamentStatus, TournamentType } from "@/types";

/**
 * Starts a casual session (singles or doubles) once enough players exist.
 * Unlike a generated tournament, this creates no fixtures up front —
 * matches are logged one at a time as they're actually played (see
 * addSessionMatch).
 */
export async function activateSession(tournamentId: string) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  if (tournament.type !== TournamentType.SESSION) {
    throw new Error("Use the bracket/fixtures setup to start a generated tournament");
  }
  if (tournament.status !== TournamentStatus.PENDING) {
    throw new Error("This session has already started");
  }

  const rosterCount = await prisma.player.count({ where: { tournamentId } });
  const minPlayers =
    tournament.format === TournamentFormat.DOUBLES
      ? MIN_SESSION_PLAYERS_DOUBLES
      : MIN_SESSION_PLAYERS_SINGLES;
  if (rosterCount < minPlayers) {
    throw new Error(`At least ${minPlayers} players are required`);
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: TournamentStatus.ACTIVE },
  });

  revalidatePath("/");
  revalidatePath(`/tournaments/${tournamentId}/players`);
}

/**
 * Logs one match between two sides, on the spot — any pairing, any number
 * of times, in whatever order people actually play. Anyone already in the
 * session can add one, not just the organizer. A side is one roster Player
 * id for singles, or two for doubles — doubles resolves (or creates) the
 * on-the-fly pairing row for each side before creating the match, so teams
 * are never registered ahead of time, just whoever's playing right now.
 */
export async function addSessionMatch(
  tournamentId: string,
  side1PlayerIds: string[],
  side2PlayerIds: string[]
) {
  const parsed = sessionMatchSchema.parse({ side1PlayerIds, side2PlayerIds });
  const allIds = [...parsed.side1PlayerIds, ...parsed.side2PlayerIds];

  const { tournament } = await requireSessionMatchParticipantOrOwner(tournamentId, allIds);
  if (tournament.type !== TournamentType.SESSION) {
    throw new Error("This tournament uses generated fixtures — matches can't be added ad hoc");
  }
  if (tournament.status !== TournamentStatus.ACTIVE) {
    throw new Error("The session isn't active");
  }

  const rosterPlayers = await prisma.player.findMany({
    where: { id: { in: allIds }, tournamentId },
  });
  if (rosterPlayers.length !== allIds.length) {
    throw new Error("Invalid player selection");
  }
  if (rosterPlayers.some((p) => p.withdrawn)) {
    throw new Error("A withdrawn player can't play a match");
  }
  const isDoublesMatch = parsed.side1PlayerIds.length === 2;
  if (isDoublesMatch !== (tournament.format === TournamentFormat.DOUBLES)) {
    throw new Error("Invalid player selection");
  }

  const byId = new Map(rosterPlayers.map((p) => [p.id, p]));

  let player1Id: string;
  let player2Id: string;

  if (isDoublesMatch) {
    const [a1, a2] = parsed.side1PlayerIds.map((id) => byId.get(id)!);
    const [b1, b2] = parsed.side2PlayerIds.map((id) => byId.get(id)!);
    if (!a1.profileId || !a2.profileId || !b1.profileId || !b2.profileId) {
      throw new Error("Invalid player selection");
    }
    [player1Id, player2Id] = await Promise.all([
      resolveDoublesPairing(tournamentId, { id: a1.profileId, name: a1.name }, {
        id: a2.profileId,
        name: a2.name,
      }),
      resolveDoublesPairing(tournamentId, { id: b1.profileId, name: b1.name }, {
        id: b2.profileId,
        name: b2.name,
      }),
    ]);
  } else {
    player1Id = parsed.side1PlayerIds[0];
    player2Id = parsed.side2PlayerIds[0];
  }

  const matchOrder = await prisma.match.count({ where: { tournamentId } });

  await prisma.match.create({
    data: {
      tournamentId,
      player1Id,
      player2Id,
      round: Round.LEAGUE,
      status: MatchStatus.PENDING,
      matchOrder,
    },
  });

  revalidatePath(`/tournaments/${tournamentId}`);
}

/**
 * Ends a session manually — there's no fixed match count to reach "done"
 * on, so the organizer decides when standings are final.
 */
export async function completeSession(tournamentId: string) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  if (tournament.type !== TournamentType.SESSION) {
    throw new Error("A generated tournament completes on its own once fixtures finish");
  }
  if (tournament.status !== TournamentStatus.ACTIVE) {
    throw new Error("This session isn't active");
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: TournamentStatus.COMPLETED },
  });

  revalidatePath("/");
  revalidatePath(`/tournaments/${tournamentId}`);
}
