import { describe, expect, it } from "vitest";
import {
  bracketSizeFor,
  knockoutRoundsFor,
  knockoutRoundsFromFirst,
  pairBracketSlots,
  nextKnockoutRound,
} from "./bracket";
import { Round } from "@/types";

describe("bracketSizeFor", () => {
  it("rounds up to the next power of two", () => {
    expect(bracketSizeFor(1)).toBe(2);
    expect(bracketSizeFor(2)).toBe(2);
    expect(bracketSizeFor(3)).toBe(4);
    expect(bracketSizeFor(4)).toBe(4);
    expect(bracketSizeFor(5)).toBe(8);
    expect(bracketSizeFor(8)).toBe(8);
    expect(bracketSizeFor(9)).toBe(16);
    expect(bracketSizeFor(16)).toBe(16);
    expect(bracketSizeFor(17)).toBe(32);
    expect(bracketSizeFor(32)).toBe(32);
  });
});

describe("knockoutRoundsFor", () => {
  it("returns the round sequence ending in FINAL for each bracket size", () => {
    expect(knockoutRoundsFor(4)).toEqual([Round.SEMI_FINAL, Round.FINAL]);
    expect(knockoutRoundsFor(8)).toEqual([Round.QUARTERFINAL, Round.SEMI_FINAL, Round.FINAL]);
    expect(knockoutRoundsFor(16)).toEqual([
      Round.ROUND_OF_16,
      Round.QUARTERFINAL,
      Round.SEMI_FINAL,
      Round.FINAL,
    ]);
    expect(knockoutRoundsFor(32)).toEqual([
      Round.ROUND_OF_32,
      Round.ROUND_OF_16,
      Round.QUARTERFINAL,
      Round.SEMI_FINAL,
      Round.FINAL,
    ]);
  });
});

describe("knockoutRoundsFromFirst", () => {
  it("returns the remaining sequence starting at the given round", () => {
    expect(knockoutRoundsFromFirst(Round.QUARTERFINAL)).toEqual([
      Round.QUARTERFINAL,
      Round.SEMI_FINAL,
      Round.FINAL,
    ]);
    expect(knockoutRoundsFromFirst(Round.FINAL)).toEqual([Round.FINAL]);
  });

  it("returns an empty array for an unrecognized round", () => {
    expect(knockoutRoundsFromFirst(Round.LEAGUE)).toEqual([]);
  });
});

describe("pairBracketSlots", () => {
  it("pairs consecutive slots into matches", () => {
    expect(pairBracketSlots(["a", "b", "c", "d"])).toEqual([
      { player1Id: "a", player2Id: "b" },
      { player1Id: "c", player2Id: "d" },
    ]);
  });

  it("turns a pairing with one empty seat into a bye for the present player", () => {
    expect(pairBracketSlots(["a", null, "c", "d"])).toEqual([
      { player1Id: "a", player2Id: null },
      { player1Id: "c", player2Id: "d" },
    ]);
    expect(pairBracketSlots([null, "b"])).toEqual([{ player1Id: "b", player2Id: null }]);
  });

  it("drops a pairing where both seats are empty", () => {
    expect(pairBracketSlots([null, null, "c", "d"])).toEqual([{ player1Id: "c", player2Id: "d" }]);
  });
});

describe("nextKnockoutRound", () => {
  it("returns [] when the previous round isn't fully decided", () => {
    const previous = [
      { matchOrder: 0, status: "COMPLETED", winnerId: "a" },
      { matchOrder: 1, status: "PENDING", winnerId: null },
    ];
    expect(nextKnockoutRound(previous, Round.FINAL)).toEqual([]);
  });

  it("returns [] for an empty previous round", () => {
    expect(nextKnockoutRound([], Round.FINAL)).toEqual([]);
  });

  it("pairs winners in bracket order once every match is decided", () => {
    const previous = [
      { matchOrder: 0, status: "COMPLETED", winnerId: "a" },
      { matchOrder: 1, status: "COMPLETED", winnerId: "d" },
      { matchOrder: 2, status: "COMPLETED", winnerId: "e" },
      { matchOrder: 3, status: "COMPLETED", winnerId: "h" },
    ];
    expect(nextKnockoutRound(previous, Round.SEMI_FINAL)).toEqual([
      { player1Id: "a", player2Id: "d", round: Round.SEMI_FINAL, matchOrder: 0 },
      { player1Id: "e", player2Id: "h", round: Round.SEMI_FINAL, matchOrder: 1 },
    ]);
  });

  it("sorts by matchOrder before pairing, regardless of input order", () => {
    const previous = [
      { matchOrder: 1, status: "COMPLETED", winnerId: "d" },
      { matchOrder: 0, status: "COMPLETED", winnerId: "a" },
    ];
    expect(nextKnockoutRound(previous, Round.FINAL)).toEqual([
      { player1Id: "a", player2Id: "d", round: Round.FINAL, matchOrder: 0 },
    ]);
  });
});
