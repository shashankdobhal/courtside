"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { doublesTeamSchema, MIN_DOUBLES_TEAMS } from "@/lib/validations";
import { resolveOrCreatePlayerProfile } from "@/lib/actions/player-profiles";
import {
  requireTournamentOwner,
  requireDoublesMatchParticipantOrOwner,
} from "@/lib/auth-helpers";
import { MatchStatus, Round, TournamentFormat, TournamentStatus, TournamentType } from "@/types";

/**
 * Forms a doubles team: one Player row standing in for two real people.
 * profileId/partnerProfileId each resolve to a reusable cross-tournament
 * identity, same as a singles player, so both partners' names stay
 * clickable and reusable in future teams.
 */
export async function createDoublesTeam(
  tournamentId: string,
  input: { player1: { name: string; profileId?: string }; player2: { name: string; profileId?: string } }
) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  if (tournament.format !== TournamentFormat.DOUBLES) {
    throw new Error("This tournament isn't set up for doubles");
  }
  if (tournament.status !== TournamentStatus.PENDING) {
    throw new Error("Teams can only be added before the session starts");
  }

  const parsed = doublesTeamSchema.parse(input);
  if (parsed.player1.name.trim().toLowerCase() === parsed.player2.name.trim().toLowerCase()) {
    throw new Error("A team needs two different players");
  }

  const [profileId1, profileId2] = await Promise.all([
    parsed.player1.profileId
      ? Promise.resolve(parsed.player1.profileId)
      : resolveOrCreatePlayerProfile(parsed.player1.name),
    parsed.player2.profileId
      ? Promise.resolve(parsed.player2.profileId)
      : resolveOrCreatePlayerProfile(parsed.player2.name),
  ]);

  await prisma.player.create({
    data: {
      tournamentId,
      name: `${parsed.player1.name} & ${parsed.player2.name}`,
      profileId: profileId1,
      partnerProfileId: profileId2,
    },
  });

  revalidatePath(`/tournaments/${tournamentId}/players`);
}

/**
 * Starts a doubles session once at least two teams exist. Unlike singles,
 * this creates no fixtures up front — matches are logged one at a time as
 * they're actually played (see addDoublesMatch).
 */
export async function activateDoublesSession(tournamentId: string) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  if (tournament.format !== TournamentFormat.DOUBLES) {
    throw new Error("This tournament isn't set up for doubles");
  }
  if (tournament.type !== TournamentType.SESSION) {
    throw new Error("Use the bracket/fixtures setup to start a tournament-style doubles event");
  }
  if (tournament.status !== TournamentStatus.PENDING) {
    throw new Error("This session has already started");
  }

  const teamCount = await prisma.player.count({ where: { tournamentId } });
  if (teamCount < MIN_DOUBLES_TEAMS) {
    throw new Error(`At least ${MIN_DOUBLES_TEAMS} teams are required`);
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: TournamentStatus.ACTIVE },
  });

  revalidatePath("/");
  revalidatePath(`/tournaments/${tournamentId}/players`);
}

/**
 * Logs one match between two teams, on the spot -- any pairing, any
 * number of times, in whatever order people actually play. Anyone already
 * in the session can add one, not just the organizer.
 */
export async function addDoublesMatch(tournamentId: string, team1Id: string, team2Id: string) {
  if (team1Id === team2Id) throw new Error("A team can't play itself");

  const { tournament } = await requireDoublesMatchParticipantOrOwner(tournamentId, team1Id, team2Id);
  if (tournament.format !== TournamentFormat.DOUBLES) {
    throw new Error("This tournament isn't set up for doubles");
  }
  if (tournament.type !== TournamentType.SESSION) {
    throw new Error("This tournament uses generated fixtures — matches can't be added ad hoc");
  }
  if (tournament.status !== TournamentStatus.ACTIVE) {
    throw new Error("The session isn't active");
  }

  const teams = await prisma.player.findMany({
    where: { id: { in: [team1Id, team2Id] }, tournamentId },
  });
  if (teams.length !== 2) throw new Error("Both teams must be in this session");
  if (teams.some((t) => t.withdrawn)) {
    throw new Error("A withdrawn team can't play a match");
  }

  const matchOrder = await prisma.match.count({ where: { tournamentId } });

  await prisma.match.create({
    data: {
      tournamentId,
      player1Id: team1Id,
      player2Id: team2Id,
      round: Round.LEAGUE,
      status: MatchStatus.PENDING,
      matchOrder,
    },
  });

  revalidatePath(`/tournaments/${tournamentId}`);
}

/**
 * Ends a doubles session manually -- there's no fixed match count to reach
 * "done" on, so the organizer decides when standings are final.
 */
export async function completeDoublesSession(tournamentId: string) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  if (tournament.format !== TournamentFormat.DOUBLES) {
    throw new Error("This tournament isn't set up for doubles");
  }
  if (tournament.type !== TournamentType.SESSION) {
    throw new Error("A tournament-style doubles event completes on its own once fixtures finish");
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
