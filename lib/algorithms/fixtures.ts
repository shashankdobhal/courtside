import { Round } from "@/types";

export interface FixtureInput {
  player1Id: string;
  player2Id: string | null;
  round: string;
  matchOrder: number;
}

interface FixturePlayer {
  id: string;
}

interface FixtureMatch {
  round: string;
  status: string;
  winnerId: string | null;
  player1Id: string;
  player2Id: string | null;
}

/**
 * Standard circle method round robin: pins the first player, rotates the
 * rest each round. A `null` slot (BYE) is added for odd player counts so
 * every round has an even number of seats; pairings touching the BYE are
 * dropped from the output since there's no opponent to schedule.
 */
export function generateRoundRobinFixtures(players: FixturePlayer[]): FixtureInput[] {
  if (players.length < 2) return [];

  const ids = players.map((p) => p.id);
  const seats: (string | null)[] = ids.length % 2 === 0 ? [...ids] : [...ids, null];
  const rounds = seats.length - 1;
  const half = seats.length / 2;

  const fixtures: FixtureInput[] = [];
  let order = 0;
  let arr = seats;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[arr.length - 1 - i];
      if (a !== null && b !== null) {
        fixtures.push({ player1Id: a, player2Id: b, round: Round.LEAGUE, matchOrder: order++ });
      }
    }
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr = [fixed, ...rest];
  }

  return fixtures;
}

/**
 * Seeds the semi finals (1v4, 2v3) once the league stage is complete, then
 * seeds the final once both semis are complete. Returns [] when neither
 * transition is ready yet.
 */
export function generateKnockoutFixtures(params: {
  standings: { player: FixturePlayer }[];
  knockoutMatches: FixtureMatch[];
}): FixtureInput[] {
  const { standings, knockoutMatches } = params;

  if (knockoutMatches.length === 0) {
    if (standings.length < 4) return [];
    const [first, second, third, fourth] = standings;
    return [
      {
        player1Id: first.player.id,
        player2Id: fourth.player.id,
        round: Round.SEMI_FINAL_1,
        matchOrder: 0,
      },
      {
        player1Id: second.player.id,
        player2Id: third.player.id,
        round: Round.SEMI_FINAL_2,
        matchOrder: 1,
      },
    ];
  }

  const semi1 = knockoutMatches.find((m) => m.round === Round.SEMI_FINAL_1);
  const semi2 = knockoutMatches.find((m) => m.round === Round.SEMI_FINAL_2);
  const finalExists = knockoutMatches.some((m) => m.round === Round.FINAL);

  if (
    !finalExists &&
    semi1?.status === "COMPLETED" &&
    semi2?.status === "COMPLETED" &&
    semi1.winnerId &&
    semi2.winnerId
  ) {
    return [
      {
        player1Id: semi1.winnerId,
        player2Id: semi2.winnerId,
        round: Round.FINAL,
        matchOrder: 0,
      },
    ];
  }

  return [];
}
