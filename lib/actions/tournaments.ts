"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createTournamentSchema,
  editTournamentSchema,
  newPlayersSchema,
  MIN_PLAYERS_ROUND_ROBIN,
  MIN_PLAYERS_KNOCKOUT,
} from "@/lib/validations";
import { TournamentFormat, TournamentStatus, TournamentType } from "@/types";
import { generateRoundRobinFixtures } from "@/lib/algorithms/fixtures";
import { resolveOrCreatePlayerProfile } from "@/lib/actions/player-profiles";
import { requireSignedIn, requireTournamentOwner } from "@/lib/auth-helpers";

export async function createTournament(input: {
  name: string;
  format: string;
  type: string;
  legs: number;
}) {
  const session = await requireSignedIn();
  const parsed = createTournamentSchema.parse(input);

  const tournament = await prisma.tournament.create({
    data: {
      name: parsed.name,
      format: parsed.format,
      type: parsed.type,
      legs: parsed.type === TournamentType.ROUND_ROBIN ? parsed.legs : 1,
      status: TournamentStatus.PENDING,
      ownerId: session.user.id,
    },
  });

  revalidatePath("/");
  redirect(`/tournaments/${tournament.id}/players`);
}

/**
 * Adds players to a still-forming (PENDING) tournament's roster. Can be
 * called repeatedly by the organizer as the roster grows — this is purely
 * additive and doesn't touch fixtures or tournament status; that's a
 * separate, explicit step (see generateFixturesAndActivate).
 */
export async function addPlayers(
  tournamentId: string,
  entries: { name: string; profileId?: string }[]
) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  if (tournament.format !== TournamentFormat.SINGLES) {
    throw new Error("This tournament doesn't use individual players");
  }
  if (tournament.status !== TournamentStatus.PENDING) {
    throw new Error("Players can only be added before fixtures are generated");
  }
  if (entries.length === 0) return;

  const existing = await prisma.player.findMany({
    where: { tournamentId },
    select: { name: true },
  });
  const parsed = newPlayersSchema(existing.map((p) => p.name)).parse(entries);

  await prisma.$transaction(async (tx) => {
    for (const p of parsed) {
      const profileId = p.profileId ?? (await resolveOrCreatePlayerProfile(p.name, tx));
      await tx.player.create({ data: { tournamentId, name: p.name, profileId } });
    }
  });

  revalidatePath(`/tournaments/${tournamentId}/players`);
}

/**
 * Locks in whoever's on the roster right now, generates fixtures, and
 * activates the tournament. The organizer triggers this explicitly once
 * they're happy with the roster (self-joins + manual adds combined).
 */
export async function generateFixturesAndActivate(tournamentId: string) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  if (tournament.format !== TournamentFormat.SINGLES) {
    throw new Error("This tournament doesn't use generated fixtures");
  }
  if (tournament.status !== TournamentStatus.PENDING) {
    throw new Error("Fixtures have already been generated for this tournament");
  }

  const players = await prisma.player.findMany({ where: { tournamentId } });
  const minPlayers =
    tournament.type === TournamentType.ROUND_ROBIN_KNOCKOUT
      ? MIN_PLAYERS_KNOCKOUT
      : MIN_PLAYERS_ROUND_ROBIN;
  if (players.length < minPlayers) {
    throw new Error(`At least ${minPlayers} players are required`);
  }

  const fixtures = generateRoundRobinFixtures(players, tournament.legs);

  await prisma.$transaction([
    prisma.match.createMany({
      data: fixtures.map((f) => ({ ...f, tournamentId })),
    }),
    prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.ACTIVE },
    }),
  ]);

  revalidatePath("/");
  redirect(`/tournaments/${tournamentId}`);
}

export async function updateTournament(tournamentId: string, input: { name: string }) {
  await requireTournamentOwner(tournamentId);
  const parsed = editTournamentSchema.parse(input);

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { name: parsed.name },
  });

  revalidatePath("/");
  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function discontinueTournament(tournamentId: string) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  if (
    tournament.status === TournamentStatus.COMPLETED ||
    tournament.status === TournamentStatus.CANCELLED
  ) {
    throw new Error("This tournament has already finished");
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: TournamentStatus.CANCELLED },
  });

  revalidatePath("/");
  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function deleteTournament(tournamentId: string) {
  await requireTournamentOwner(tournamentId);
  await prisma.tournament.delete({ where: { id: tournamentId } });
  revalidatePath("/");
}

/**
 * Tournaments the signed-in user actually owns or has played in — the
 * signed-in home page is a personal dashboard, not a directory of every
 * tournament on the platform.
 */
export async function getMyTournaments(userId: string) {
  const profile = await prisma.playerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return prisma.tournament.findMany({
    where: {
      OR: [
        { ownerId: userId },
        ...(profile
          ? [{ players: { some: { OR: [{ profileId: profile.id }, { partnerProfileId: profile.id }] } } }]
          : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { matches: true, players: true } } },
  });
}


export async function getTournament(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      players: true,
      matches: { orderBy: [{ round: "asc" }, { matchOrder: "asc" }] },
    },
  });
}
