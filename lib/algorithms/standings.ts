import { MatchStatus, Round, TournamentType, type StandingsRow } from "@/types";

interface StandingsPlayer {
  id: string;
  tournamentId: string;
  name: string;
  alias: string | null;
}

interface StandingsMatch {
  player1Id: string;
  player2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  round: string;
  status: string;
}

export function calculatePointDifference(pointsFor: number, pointsAgainst: number): number {
  return pointsFor - pointsAgainst;
}

/**
 * Standings are derived from completed league matches only — knockout
 * matches decide the champion, not table position.
 */
export function calculateStandings(
  players: StandingsPlayer[],
  matches: StandingsMatch[]
): StandingsRow[] {
  const rows = new Map<string, StandingsRow>(
    players.map((player) => [
      player.id,
      { player, played: 0, won: 0, lost: 0, pointsFor: 0, pointsAgainst: 0, pointDifference: 0 },
    ])
  );

  for (const match of matches) {
    if (
      match.round !== Round.LEAGUE ||
      match.status !== MatchStatus.COMPLETED ||
      match.score1 === null ||
      match.score2 === null ||
      !match.player2Id
    ) {
      continue;
    }

    const row1 = rows.get(match.player1Id);
    const row2 = rows.get(match.player2Id);
    if (!row1 || !row2) continue;

    row1.played += 1;
    row2.played += 1;
    row1.pointsFor += match.score1;
    row1.pointsAgainst += match.score2;
    row2.pointsFor += match.score2;
    row2.pointsAgainst += match.score1;

    if (match.winnerId === match.player1Id) {
      row1.won += 1;
      row2.lost += 1;
    } else if (match.winnerId === match.player2Id) {
      row2.won += 1;
      row1.lost += 1;
    }
  }

  for (const row of rows.values()) {
    row.pointDifference = calculatePointDifference(row.pointsFor, row.pointsAgainst);
  }

  return Array.from(rows.values()).sort(
    (a, b) => b.won - a.won || b.pointDifference - a.pointDifference || b.pointsFor - a.pointsFor
  );
}

/**
 * ROUND_ROBIN: champion is the top of the table once every league match is
 * complete. ROUND_ROBIN_KNOCKOUT: champion is whoever wins the Final.
 */
export function calculateChampion(params: {
  type: string;
  standings: StandingsRow[];
  matches: StandingsMatch[];
}): StandingsPlayer | null {
  const { type, standings, matches } = params;

  if (type === TournamentType.ROUND_ROBIN_KNOCKOUT) {
    const final = matches.find((m) => m.round === Round.FINAL);
    if (!final || final.status !== MatchStatus.COMPLETED || !final.winnerId) return null;
    return standings.find((s) => s.player.id === final.winnerId)?.player ?? null;
  }

  const leagueMatches = matches.filter((m) => m.round === Round.LEAGUE);
  if (leagueMatches.length === 0) return null;
  const allCompleted = leagueMatches.every((m) => m.status === MatchStatus.COMPLETED);
  if (!allCompleted) return null;

  return standings[0]?.player ?? null;
}
