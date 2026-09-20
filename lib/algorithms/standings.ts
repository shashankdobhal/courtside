import { MatchStatus, Round, TournamentType, type StandingsRow } from "@/types";

interface StandingsPlayer {
  id: string;
  tournamentId: string;
  name: string;
  alias: string | null;
  profileId: string | null;
  partnerProfileId: string | null;
  withdrawn: boolean;
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
  const activePlayers = players.filter((player) => !player.withdrawn);
  const rows = new Map<string, StandingsRow>(
    activePlayers.map((player) => [
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
    // A withdrawn player has no row, so any match touching them (played or
    // not) is excluded here automatically — as if it never happened.
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
 * Individual standings for a casual doubles session, where each match's
 * "player1Id"/"player2Id" is an on-the-fly pairing row (see
 * resolveDoublesPairing in lib/actions/doubles.ts), not a person. Every
 * completed match credits BOTH members of each side individually, so a
 * person's row reflects everything they played regardless of partner —
 * e.g. A+B one match and A+D the next both count toward A's own total.
 */
export function calculateIndividualDoublesStandings(
  rosterPlayers: StandingsPlayer[],
  pairingPlayers: StandingsPlayer[],
  matches: StandingsMatch[]
): StandingsRow[] {
  const activeRoster = rosterPlayers.filter((player) => !player.withdrawn);
  const rosterByProfileId = new Map(
    activeRoster.filter((p) => p.profileId).map((p) => [p.profileId as string, p])
  );
  const pairingById = new Map(pairingPlayers.map((p) => [p.id, p]));

  const rows = new Map<string, StandingsRow>(
    activeRoster.map((player) => [
      player.id,
      { player, played: 0, won: 0, lost: 0, pointsFor: 0, pointsAgainst: 0, pointDifference: 0 },
    ])
  );

  const membersOf = (pairing: StandingsPlayer) =>
    [pairing.profileId, pairing.partnerProfileId]
      .filter((id): id is string => !!id)
      .map((id) => rosterByProfileId.get(id))
      .filter((p): p is StandingsPlayer => !!p);

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

    const side1 = pairingById.get(match.player1Id);
    const side2 = pairingById.get(match.player2Id);
    if (!side1 || !side2) continue;

    const side1Won = match.winnerId === match.player1Id;
    const side2Won = match.winnerId === match.player2Id;

    for (const member of membersOf(side1)) {
      const row = rows.get(member.id);
      if (!row) continue;
      row.played += 1;
      row.pointsFor += match.score1;
      row.pointsAgainst += match.score2;
      if (side1Won) row.won += 1;
      else if (side2Won) row.lost += 1;
    }
    for (const member of membersOf(side2)) {
      const row = rows.get(member.id);
      if (!row) continue;
      row.played += 1;
      row.pointsFor += match.score2;
      row.pointsAgainst += match.score1;
      if (side2Won) row.won += 1;
      else if (side1Won) row.lost += 1;
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
 * complete. ROUND_ROBIN_KNOCKOUT and KNOCKOUT: champion is whoever wins the
 * Final (KNOCKOUT has no league stage, so standings is never consulted for it).
 */
export function calculateChampion(params: {
  type: string;
  standings: StandingsRow[];
  matches: StandingsMatch[];
}): StandingsPlayer | null {
  const { type, standings, matches } = params;

  if (type === TournamentType.ROUND_ROBIN_KNOCKOUT || type === TournamentType.KNOCKOUT) {
    const final = matches.find((m) => m.round === Round.FINAL);
    if (!final || final.status !== MatchStatus.COMPLETED || !final.winnerId) return null;
    return standings.find((s) => s.player.id === final.winnerId)?.player ?? null;
  }

  const leagueMatches = matches.filter((m) => m.round === Round.LEAGUE);
  if (leagueMatches.length === 0) return null;
  const allCompleted = leagueMatches.every(
    (m) => m.status === MatchStatus.COMPLETED || m.status === MatchStatus.VOID
  );
  if (!allCompleted) return null;

  return standings[0]?.player ?? null;
}
