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
function buildRoundRobinPairings(players: FixturePlayer[]): [string, string][] {
  const ids = players.map((p) => p.id);
  const seats: (string | null)[] = ids.length % 2 === 0 ? [...ids] : [...ids, null];
  const rounds = seats.length - 1;
  const half = seats.length / 2;

  const pairings: [string, string][] = [];
  let arr = seats;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[arr.length - 1 - i];
      if (a !== null && b !== null) {
        pairings.push([a, b]);
      }
    }
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr = [fixed, ...rest];
  }

  return pairings;
}

/**
 * Generates league fixtures for a round robin, repeating every pairing
 * `legs` times (once/twice/thrice) so groups can choose to play each other
 * more than once. Odd legs keep the original player order, even legs swap
 * it, mirroring a home/away rotation.
 */
export function generateRoundRobinFixtures(
  players: FixturePlayer[],
  legs: number = 1
): FixtureInput[] {
  if (players.length < 2) return [];

  const pairings = buildRoundRobinPairings(players);
  const fixtures: FixtureInput[] = [];
  let order = 0;

  for (let leg = 0; leg < legs; leg++) {
    const swap = leg % 2 === 1;
    for (const [a, b] of pairings) {
      fixtures.push({
        player1Id: swap ? b : a,
        player2Id: swap ? a : b,
        round: Round.LEAGUE,
        matchOrder: order++,
      });
    }
  }

  return fixtures;
}

/**
 * Rebuilds a tournament's not-yet-played league fixtures from the current
 * (active) player list, while keeping every already-completed match intact.
 * A completed match "satisfies" one occurrence of its unordered pairing in
 * the freshly generated ideal fixture list (correct under multiple legs,
 * where the same pair may need to meet more than once); anything left over
 * is what still needs to be (re)scheduled. Output is renumbered starting at
 * 0 — the caller offsets `matchOrder` to continue after existing matches.
 */
export function diffRegeneratedFixtures(
  idealFixtures: FixtureInput[],
  completedPairings: [string, string | null][]
): FixtureInput[] {
  const pairKey = (a: string, b: string | null) => [a, b ?? ""].sort().join("|");

  const remaining = new Map<string, number>();
  for (const [a, b] of completedPairings) {
    const key = pairKey(a, b);
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }

  const kept: FixtureInput[] = [];
  for (const fixture of idealFixtures) {
    const key = pairKey(fixture.player1Id, fixture.player2Id);
    const count = remaining.get(key) ?? 0;
    if (count > 0) {
      remaining.set(key, count - 1);
      continue;
    }
    kept.push(fixture);
  }

  return kept.map((f, i) => ({ ...f, matchOrder: i }));
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
