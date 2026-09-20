import { prisma } from "@/lib/prisma";
import { MatchStatus } from "@/types";
import {
  calculatePlayStreak,
  calculateKarmaPoints,
  calculateKarmaLevel,
  type PlayStreak,
  type KarmaProgress,
} from "@/lib/algorithms/gamification";

export interface PlayerGamificationStats {
  gamesPlayed: number;
  wins: number;
  karma: number;
  karmaLevel: KarmaProgress;
  streak: PlayStreak;
  last7Labels: string[];
}

const EMPTY_STREAK: PlayStreak = {
  current: 0,
  longest: 0,
  playedToday: false,
  last7Days: [false, false, false, false, false, false, false],
};

function last7DayLabels(now: Date, timeZone: string): string[] {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "narrow" });
  return Array.from({ length: 7 }, (_, i) =>
    formatter.format(new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000))
  );
}

/**
 * Activity-based gamification stats for the signed-in user's own profile —
 * counts singles and doubles matches alike, since this is about engagement,
 * not competitive ranking (unlike the singles-only leaderboard/profile stats).
 *
 * `timeZone` is the viewer's own IANA timezone (see lib/timezone.ts) — the
 * streak and "played today" are calendar-day concepts that must match the
 * viewer's own clock, not the server's (which always runs in UTC).
 */
export async function getPlayerGamificationStats(
  userId: string,
  timeZone: string
): Promise<PlayerGamificationStats | null> {
  const profile = await prisma.playerProfile.findUnique({ where: { userId } });
  if (!profile) return null;

  const playerRows = await prisma.player.findMany({
    where: { OR: [{ profileId: profile.id }, { partnerProfileId: profile.id }] },
    select: { id: true },
  });
  const playerIds = playerRows.map((p) => p.id);

  if (playerIds.length === 0) {
    return {
      gamesPlayed: 0,
      wins: 0,
      karma: 0,
      karmaLevel: calculateKarmaLevel(0),
      streak: EMPTY_STREAK,
      last7Labels: last7DayLabels(new Date(), timeZone),
    };
  }

  const matches = await prisma.match.findMany({
    where: {
      status: MatchStatus.COMPLETED,
      // A knockout bracket bye auto-completes with no game actually played —
      // excluded here so it can't inflate games-played/streak/karma.
      player2Id: { not: null },
      OR: [{ player1Id: { in: playerIds } }, { player2Id: { in: playerIds } }],
    },
    select: { completedAt: true, winnerId: true },
  });

  const gamesPlayed = matches.length;
  const wins = matches.filter((m) => m.winnerId && playerIds.includes(m.winnerId)).length;
  const completedDates = matches.map((m) => m.completedAt).filter((d): d is Date => d !== null);
  const streak = calculatePlayStreak(completedDates, new Date(), timeZone);
  const karma = calculateKarmaPoints({ matchesPlayed: gamesPlayed, wins, currentStreak: streak.current });
  const karmaLevel = calculateKarmaLevel(karma);

  return {
    gamesPlayed,
    wins,
    karma,
    karmaLevel,
    streak,
    last7Labels: last7DayLabels(new Date(), timeZone),
  };
}
