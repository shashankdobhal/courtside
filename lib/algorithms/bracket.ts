import { Round } from "@/types";

/**
 * Every possible knockout round, in play order. A given bracket only ever
 * uses a suffix of this list (e.g. an 8-player bracket runs
 * QUARTERFINAL -> SEMI_FINAL -> FINAL) — which suffix is determined by
 * bracket size, so the same generic pairing logic works for any size.
 */
export const KNOCKOUT_ROUND_SEQUENCE = [
  Round.ROUND_OF_32,
  Round.ROUND_OF_16,
  Round.QUARTERFINAL,
  Round.SEMI_FINAL,
  Round.FINAL,
] as const;

/** Smallest power of two that can seat every player (minimum 2). */
export function bracketSizeFor(playerCount: number): number {
  let size = 2;
  while (size < playerCount) size *= 2;
  return size;
}

/** The round names this bracket size will play through, ending in FINAL. */
export function knockoutRoundsFor(bracketSize: number): string[] {
  const totalRounds = Math.log2(bracketSize);
  return KNOCKOUT_ROUND_SEQUENCE.slice(KNOCKOUT_ROUND_SEQUENCE.length - totalRounds);
}

/** The remaining round sequence (through FINAL) given the bracket's first-played round. */
export function knockoutRoundsFromFirst(firstRound: string): string[] {
  const idx = KNOCKOUT_ROUND_SEQUENCE.indexOf(
    firstRound as (typeof KNOCKOUT_ROUND_SEQUENCE)[number]
  );
  return idx === -1 ? [] : KNOCKOUT_ROUND_SEQUENCE.slice(idx);
}

export interface BracketPairing {
  player1Id: string;
  player2Id: string | null;
}

/**
 * Pairs up an ordered list of bracket slots (one per position; null = empty
 * seat, only ever meaningful in the first round) into first-round matches.
 * A pairing with one empty seat is a bye: the present player advances with
 * no match played. Two empty seats can never be paired — callers must
 * validate the slot layout before calling this.
 */
export function pairBracketSlots(slots: (string | null)[]): BracketPairing[] {
  const pairings: BracketPairing[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const a = slots[i];
    const b = slots[i + 1] ?? null;
    if (a === null && b === null) continue;
    pairings.push(a !== null ? { player1Id: a, player2Id: b } : { player1Id: b as string, player2Id: null });
  }
  return pairings;
}

interface ResolvedMatch {
  matchOrder: number;
  status: string;
  winnerId: string | null;
}

export interface FixtureInput {
  player1Id: string;
  player2Id: string | null;
  round: string;
  matchOrder: number;
}

/**
 * Builds the next round's fixtures from the previous round's matches, once
 * every one of them has a winner. Winners are paired in bracket order
 * (match 0 vs match 1, match 2 vs match 3, ...). Returns [] if the previous
 * round isn't fully decided yet.
 */
export function nextKnockoutRound(
  previousRoundMatches: ResolvedMatch[],
  nextRoundName: string
): FixtureInput[] {
  if (previousRoundMatches.length === 0) return [];

  const sorted = [...previousRoundMatches].sort((a, b) => a.matchOrder - b.matchOrder);
  const allDecided = sorted.every((m) => m.status === "COMPLETED" && m.winnerId);
  if (!allDecided) return [];

  const winners = sorted.map((m) => m.winnerId as string);
  const fixtures: FixtureInput[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    fixtures.push({
      player1Id: winners[i],
      player2Id: winners[i + 1] ?? null,
      round: nextRoundName,
      matchOrder: i / 2,
    });
  }
  return fixtures;
}
