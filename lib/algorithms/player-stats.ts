export interface TournamentParticipation {
  tournamentId: string;
  isChampion: boolean;
}

/**
 * Current active streak: consecutive most-recently-completed tournaments won
 * by this profile, counting from the most recent and stopping at the first
 * non-win. (Not a historical longest-ever streak — simpler and more useful
 * at this scale.)
 */
export function calculateChampionStreak(tournamentsMostRecentFirst: TournamentParticipation[]): number {
  let streak = 0;
  for (const t of tournamentsMostRecentFirst) {
    if (!t.isChampion) break;
    streak += 1;
  }
  return streak;
}

export interface AggregateStatsInput {
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface AggregateStats extends AggregateStatsInput {
  pointDifference: number;
}

export function aggregateProfileStats(rows: AggregateStatsInput[]): AggregateStats {
  const totals = rows.reduce(
    (acc, r) => ({
      played: acc.played + r.played,
      won: acc.won + r.won,
      lost: acc.lost + r.lost,
      pointsFor: acc.pointsFor + r.pointsFor,
      pointsAgainst: acc.pointsAgainst + r.pointsAgainst,
    }),
    { played: 0, won: 0, lost: 0, pointsFor: 0, pointsAgainst: 0 }
  );
  return { ...totals, pointDifference: totals.pointsFor - totals.pointsAgainst };
}
