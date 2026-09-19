"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";
import { calculateStandings, calculateChampion } from "@/lib/algorithms/standings";
import { calculateChampionStreak, aggregateProfileStats } from "@/lib/algorithms/player-stats";
import { requireSignedIn } from "@/lib/auth-helpers";
import { editPlayerProfileSchema, type EditPlayerProfileInput } from "@/lib/validations";
import { TournamentStatus, type StandingsRow } from "@/types";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Resolves a player name to a global PlayerProfile, matching case-insensitively
 * against existing profiles so retyping "bob" links to an existing "Bob"
 * instead of creating a duplicate identity.
 */
export async function resolveOrCreatePlayerProfile(name: string, db: Db = prisma): Promise<string> {
  const trimmed = name.trim();

  const existing = await db.playerProfile.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return existing.id;

  const created = await db.playerProfile.create({ data: { name: trimmed } });
  return created.id;
}

/**
 * Resolves a signed-in user's own player identity deterministically by
 * account, not by name — unlike `resolveOrCreatePlayerProfile`, retyping a
 * different display name never forks this into a second profile. Used by
 * the self-join flow.
 */
export async function resolveOrCreateUserPlayerProfile(
  userId: string,
  defaultName: string,
  db: Db = prisma
): Promise<{ id: string; name: string }> {
  const existing = await db.playerProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  return db.playerProfile.create({
    data: { name: defaultName.trim() || "Player", userId },
  });
}

async function requireOwnProfile(profileId: string) {
  const session = await requireSignedIn();
  const profile = await prisma.playerProfile.findUnique({ where: { id: profileId } });
  if (!profile) throw new Error("Profile not found");
  if (profile.userId !== session.user.id) throw new Error("You can only manage your own profile");
  return profile;
}

/**
 * Descriptive-only fields a player sets on their own profile. Purely
 * cosmetic — never factored into computed stats or leaderboard ranking.
 */
export async function updatePlayerProfileDetails(profileId: string, input: EditPlayerProfileInput) {
  await requireOwnProfile(profileId);
  const parsed = editPlayerProfileSchema.parse(input);

  await prisma.playerProfile.update({
    where: { id: profileId },
    data: {
      bio: parsed.bio?.trim() || null,
      playingStyle: parsed.playingStyle?.trim() || null,
      hometown: parsed.hometown?.trim() || null,
    },
  });

  revalidatePath(`/players/${profileId}`);
}

/**
 * A player must opt in for their matches to be counted on the leaderboard.
 * Only they can toggle it for their own identity.
 */
export async function setSeasonOptIn(profileId: string, optedIn: boolean) {
  await requireOwnProfile(profileId);

  await prisma.playerProfile.update({
    where: { id: profileId },
    data: { seasonOptIn: optedIn },
  });

  revalidatePath(`/players/${profileId}`);
  revalidatePath("/leaderboard");
}

export async function searchPlayerProfiles(query: string): Promise<{ id: string; name: string }[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return prisma.playerProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true },
    });
  }

  return prisma.playerProfile.findMany({
    where: { name: { contains: trimmed, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: 10,
    select: { id: true, name: true },
  });
}

/**
 * Cross-tournament stats for a player identity: every tournament this
 * profile has played in, its lifetime W/L/points, tournament championships,
 * and a current championship streak.
 */
export async function getPlayerProfileStats(profileId: string) {
  const profile = await prisma.playerProfile.findUnique({ where: { id: profileId } });
  if (!profile) return null;

  const playerRows = await prisma.player.findMany({
    where: { profileId },
    include: { tournament: { include: { players: true, matches: true } } },
  });

  const tournaments = playerRows.map((player) => {
    const { tournament } = player;
    const standings = calculateStandings(tournament.players, tournament.matches);
    const champion = calculateChampion({
      type: tournament.type,
      standings,
      matches: tournament.matches,
    });
    return {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      // Proxy for "when this tournament was completed": nothing mutates the
      // Tournament row after its one-time COMPLETED flip, so updatedAt stays
      // pinned at that moment (score edits touch only Match, which has no
      // timestamp of its own).
      updatedAt: tournament.updatedAt,
      row: standings.find((r) => r.player.id === player.id) ?? null,
      isChampion: champion?.id === player.id,
    };
  });

  const stats = aggregateProfileStats(
    tournaments.map((t) => t.row).filter((row): row is StandingsRow => row !== null)
  );
  const tournamentsWon = tournaments.filter((t) => t.isChampion).length;

  const completedMostRecentFirst = tournaments
    .filter((t) => t.status === TournamentStatus.COMPLETED)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const currentStreak = calculateChampionStreak(
    completedMostRecentFirst.map((t) => ({ tournamentId: t.id, isChampion: t.isChampion }))
  );

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      userId: profile.userId,
      seasonOptIn: profile.seasonOptIn,
      bio: profile.bio,
      playingStyle: profile.playingStyle,
      hometown: profile.hometown,
    },
    stats,
    tournamentsWon,
    currentStreak,
    tournaments: tournaments.map(({ id, name, status, row, isChampion }) => ({
      id,
      name,
      status,
      row,
      isChampion,
    })),
  };
}
