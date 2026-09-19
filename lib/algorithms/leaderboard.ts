import { calculatePointDifference } from "@/lib/algorithms/standings";

/**
 * One completed match, already resolved to global player identities. Unlike
 * `standings.ts` (which scopes to a single tournament's league stage), a
 * cross-tournament leaderboard counts every completed match — knockout
 * finals included — since "who's been winning lately" should reflect all
 * of it, not just league position within one event.
 */
export interface LeaderboardMatchRecord {
  player1ProfileId: string;
  player2ProfileId: string;
  player1Name: string;
  player2Name: string;
  score1: number;
  score2: number;
  winnerProfileId: string;
}

export interface LeaderboardRow {
  profileId: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  rank: number;
}

export function calculateLeaderboard(matches: LeaderboardMatchRecord[]): LeaderboardRow[] {
  const rows = new Map<string, Omit<LeaderboardRow, "rank">>();

  function getRow(profileId: string, name: string) {
    let row = rows.get(profileId);
    if (!row) {
      row = {
        profileId,
        name,
        played: 0,
        won: 0,
        lost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifference: 0,
      };
      rows.set(profileId, row);
    }
    return row;
  }

  for (const m of matches) {
    const row1 = getRow(m.player1ProfileId, m.player1Name);
    const row2 = getRow(m.player2ProfileId, m.player2Name);

    row1.played += 1;
    row2.played += 1;
    row1.pointsFor += m.score1;
    row1.pointsAgainst += m.score2;
    row2.pointsFor += m.score2;
    row2.pointsAgainst += m.score1;

    if (m.winnerProfileId === m.player1ProfileId) {
      row1.won += 1;
      row2.lost += 1;
    } else {
      row2.won += 1;
      row1.lost += 1;
    }
  }

  for (const row of rows.values()) {
    row.pointDifference = calculatePointDifference(row.pointsFor, row.pointsAgainst);
  }

  return Array.from(rows.values())
    .sort((a, b) => b.won - a.won || b.pointDifference - a.pointDifference || b.pointsFor - a.pointsFor)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export type TrendDirection = "up" | "down" | "flat" | "new";

export interface Trend {
  direction: TrendDirection;
  rankDelta: number | null;
}

/**
 * Compares rank between two periods. A positive rankDelta means the player
 * climbed (moved to a lower/better rank number); a profile absent from the
 * previous period is "new".
 */
export function computeTrends(
  current: LeaderboardRow[],
  previous: LeaderboardRow[]
): Map<string, Trend> {
  const previousRanks = new Map(previous.map((r) => [r.profileId, r.rank]));
  const trends = new Map<string, Trend>();

  for (const row of current) {
    const prevRank = previousRanks.get(row.profileId);
    if (prevRank === undefined) {
      trends.set(row.profileId, { direction: "new", rankDelta: null });
      continue;
    }
    const rankDelta = prevRank - row.rank;
    trends.set(row.profileId, {
      direction: rankDelta > 0 ? "up" : rankDelta < 0 ? "down" : "flat",
      rankDelta,
    });
  }

  return trends;
}
