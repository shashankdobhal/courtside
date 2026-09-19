import { format, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { MatchStatus } from "@/types";
import { calculatePlayStreak, calculateKarmaPoints, type PlayStreak } from "@/lib/algorithms/gamification";

export interface PlayerGamificationStats {
  gamesPlayed: number;
  wins: number;
  karma: number;
  streak: PlayStreak;
  last7Labels: string[];
}

const EMPTY_STREAK: PlayStreak = {
  current: 0,
  longest: 0,
  playedToday: false,
  last7Days: [false, false, false, false, false, false, false],
};

function last7DayLabels(now: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => format(subDays(now, 6 - i), "EEEEE"));
}

/**
 * Activity-based gamification stats for the signed-in user's own profile —
 * counts singles and doubles matches alike, since this is about engagement,
 * not competitive ranking (unlike the singles-only leaderboard/profile stats).
 */
export async function getPlayerGamificationStats(userId: string): Promise<PlayerGamificationStats | null> {
  const profile = await prisma.playerProfile.findUnique({ where: { userId } });
  if (!profile) return null;

  const playerRows = await prisma.player.findMany({
    where: { OR: [{ profileId: profile.id }, { partnerProfileId: profile.id }] },
    select: { id: true },
  });
  const playerIds = playerRows.map((p) => p.id);

  if (playerIds.length === 0) {
    return { gamesPlayed: 0, wins: 0, karma: 0, streak: EMPTY_STREAK, last7Labels: last7DayLabels(new Date()) };
  }

  const matches = await prisma.match.findMany({
    where: {
      status: MatchStatus.COMPLETED,
      OR: [{ player1Id: { in: playerIds } }, { player2Id: { in: playerIds } }],
    },
    select: { completedAt: true, winnerId: true },
  });

  const gamesPlayed = matches.length;
  const wins = matches.filter((m) => m.winnerId && playerIds.includes(m.winnerId)).length;
  const completedDates = matches.map((m) => m.completedAt).filter((d): d is Date => d !== null);
  const streak = calculatePlayStreak(completedDates);
  const karma = calculateKarmaPoints({ matchesPlayed: gamesPlayed, wins, currentStreak: streak.current });

  return { gamesPlayed, wins, karma, streak, last7Labels: last7DayLabels(new Date()) };
}
