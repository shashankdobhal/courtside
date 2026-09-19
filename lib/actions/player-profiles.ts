"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";
import { calculateStandings, calculateChampion } from "@/lib/algorithms/standings";
import { calculateChampionStreak, aggregateProfileStats } from "@/lib/algorithms/player-stats";
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
    profile: { id: profile.id, name: profile.name },
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
