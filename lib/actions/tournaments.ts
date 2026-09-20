"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createTournamentSchema,
  editTournamentSchema,
  newPlayersSchema,
  youtubeUrlSchema,
  knockoutBracketSlotsSchema,
  MIN_PLAYERS_ROUND_ROBIN,
  MIN_PLAYERS_KNOCKOUT,
} from "@/lib/validations";
import { MatchStatus, TournamentFormat, TournamentStatus, TournamentType } from "@/types";
import { generateRoundRobinFixtures } from "@/lib/algorithms/fixtures";
import { bracketSizeFor, knockoutRoundsFor, pairBracketSlots } from "@/lib/algorithms/bracket";
import { resolveOrCreatePlayerProfile } from "@/lib/actions/player-profiles";
import { requireSignedIn, requireTournamentOwner } from "@/lib/auth-helpers";
import { generateJoinCode } from "@/lib/join-code";
import { extractYoutubeVideoId } from "@/lib/youtube";

const MAX_JOIN_CODE_ATTEMPTS = 5;

export async function createTournament(input: {
  name: string;
  format: string;
  type: string;
  legs: number;
}) {
  const session = await requireSignedIn();
  const parsed = createTournamentSchema.parse(input);

  const data = {
    name: parsed.name,
    format: parsed.format,
    type: parsed.type,
    legs: parsed.type === TournamentType.ROUND_ROBIN ? parsed.legs : 1,
    status: TournamentStatus.PENDING,
    ownerId: session.user.id,
  };

  let tournament;
  for (let attempt = 1; ; attempt++) {
    try {
      tournament = await prisma.tournament.create({
        data: { ...data, joinCode: generateJoinCode() },
      });
      break;
    } catch (err) {
      const isJoinCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        (err.meta?.target as string[] | undefined)?.includes("joinCode");
      if (!isJoinCodeCollision || attempt >= MAX_JOIN_CODE_ATTEMPTS) throw err;
    }
  }

  revalidatePath("/");
  redirect(`/tournaments/${tournament.id}/players`);
}

/**
 * Resolves whatever a would-be joiner pasted — a full invite link, a bare
 * tournament id, or a short join code — to a real tournament id, or null if
 * nothing matches. Shared by both the pre-login join card and the signed-in
 * Join Game dialog.
 */
export async function resolveJoinTarget(input: string): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const pathMatch = trimmed.match(/\/tournaments\/([a-zA-Z0-9_-]+)/);
  const candidate = pathMatch ? pathMatch[1] : trimmed;
  if (!/^[a-zA-Z0-9_-]+$/.test(candidate)) return null;

  const byCode = await prisma.tournament.findUnique({
    where: { joinCode: candidate.toUpperCase() },
    select: { id: true },
  });
  if (byCode) return byCode.id;

  const byId = await prisma.tournament.findUnique({
    where: { id: candidate },
    select: { id: true },
  });
  return byId?.id ?? null;
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
  if (tournament.type === TournamentType.SESSION) {
    throw new Error("This tournament doesn't use generated fixtures");
  }
  if (tournament.type === TournamentType.KNOCKOUT) {
    throw new Error("Use the bracket builder to generate a knockout tournament's fixtures");
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

/**
 * Generates a pure knockout tournament's first round from the organizer's
 * manual bracket placement (`slots` is ordered, one entry per bracket seat —
 * a Player id, or null for an empty seat). A seat paired against an empty
 * one is a bye: that Match is created already COMPLETED with no game
 * played, so the player advances immediately and bracket progression
 * (progressTournament) can treat every round uniformly from here on.
 */
export async function generateKnockoutBracket(tournamentId: string, slots: (string | null)[]) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  if (tournament.type !== TournamentType.KNOCKOUT) {
    throw new Error("This tournament doesn't use a knockout bracket");
  }
  if (tournament.status !== TournamentStatus.PENDING) {
    throw new Error("The bracket has already been generated for this tournament");
  }

  const parsedSlots = knockoutBracketSlotsSchema.parse(slots);

  const players = await prisma.player.findMany({ where: { tournamentId, withdrawn: false } });
  if (players.length < MIN_PLAYERS_KNOCKOUT) {
    throw new Error(`At least ${MIN_PLAYERS_KNOCKOUT} players are required`);
  }

  const expectedSize = bracketSizeFor(players.length);
  if (parsedSlots.length !== expectedSize) {
    throw new Error("Bracket size doesn't match the player count");
  }

  const placedIds = parsedSlots.filter((id): id is string => id !== null);
  if (new Set(placedIds).size !== placedIds.length) {
    throw new Error("Each player can only be placed in one bracket slot");
  }
  const rosterIds = new Set(players.map((p) => p.id));
  if (!placedIds.every((id) => rosterIds.has(id))) {
    throw new Error("Invalid player in bracket slots");
  }
  if (placedIds.length !== players.length) {
    throw new Error("Every player must be placed in the bracket before generating it");
  }
  for (let i = 0; i < parsedSlots.length; i += 2) {
    if (parsedSlots[i] === null && parsedSlots[i + 1] === null) {
      throw new Error("Two empty bracket slots can't be paired together");
    }
  }

  const pairings = pairBracketSlots(parsedSlots);
  const roundName = knockoutRoundsFor(expectedSize)[0];
  const now = new Date();

  await prisma.$transaction([
    ...pairings.map((pair, i) =>
      prisma.match.create({
        data: {
          tournamentId,
          player1Id: pair.player1Id,
          player2Id: pair.player2Id,
          round: roundName,
          matchOrder: i,
          ...(pair.player2Id === null
            ? { status: MatchStatus.COMPLETED, winnerId: pair.player1Id, completedAt: now }
            : {}),
        },
      })
    ),
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

export async function setTournamentYoutubeUrl(
  tournamentId: string,
  youtubeUrl: string,
  isPublic: boolean
) {
  await requireTournamentOwner(tournamentId);
  const parsed = youtubeUrlSchema.parse({ youtubeUrl, isPublic });
  const trimmed = parsed.youtubeUrl?.trim() || null;
  if (trimmed && !extractYoutubeVideoId(trimmed)) {
    throw new Error("Enter a valid YouTube video or live stream link");
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { youtubeUrl: trimmed, youtubeUrlPublic: trimmed ? parsed.isPublic : false },
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/live");
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
 * Every tournament whose organizer has attached a YouTube link AND opted
 * into public listing, for the /live hub — visible to signed-out visitors,
 * so this is a second, separate opt-in from just pasting a link (which only
 * ever shows the embed on the tournament's own page). Not filtered by
 * ownership like getMyTournaments is; that's the point of "public."
 */
export async function getLivestreamTournaments() {
  const tournaments = await prisma.tournament.findMany({
    where: { youtubeUrl: { not: null }, youtubeUrlPublic: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      format: true,
      status: true,
      youtubeUrl: true,
      updatedAt: true,
    },
  });

  return tournaments.map((t) => ({ ...t, youtubeUrl: t.youtubeUrl as string }));
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
    include: {
      _count: { select: { matches: true, players: true } },
      matches: { select: { status: true } },
    },
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
