import { describe, expect, it } from "vitest";
import { generateRoundRobinFixtures, generateKnockoutFixtures } from "./fixtures";
import { Round } from "@/types";

function players(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: String.fromCharCode(65 + i) }));
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("-");
}

describe("generateRoundRobinFixtures", () => {
  it("produces every unique matchup for an even player count", () => {
    const fixtures = generateRoundRobinFixtures(players(4));
    expect(fixtures).toHaveLength(6); // 4 choose 2

    const keys = fixtures.map((f) => pairKey(f.player1Id, f.player2Id!));
    expect(new Set(keys).size).toBe(6);
    for (const f of fixtures) {
      expect(f.round).toBe(Round.LEAGUE);
      expect(f.player2Id).not.toBeNull();
    }
  });

  it("produces every unique matchup with no BYE matches for an odd player count", () => {
    const fixtures = generateRoundRobinFixtures(players(3));
    expect(fixtures).toHaveLength(3); // 3 choose 2

    const keys = new Set(fixtures.map((f) => pairKey(f.player1Id, f.player2Id!)));
    expect(keys).toEqual(new Set(["A-B", "A-C", "B-C"]));
    for (const f of fixtures) {
      expect(f.player1Id).not.toBeNull();
      expect(f.player2Id).not.toBeNull();
    }
  });

  it("scales correctly across the supported player range (4-32)", () => {
    for (const n of [4, 5, 7, 8, 15, 16, 31, 32]) {
      const fixtures = generateRoundRobinFixtures(players(n));
      expect(fixtures).toHaveLength((n * (n - 1)) / 2);
      const keys = fixtures.map((f) => pairKey(f.player1Id, f.player2Id!));
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("assigns sequential, unique match orders", () => {
    const fixtures = generateRoundRobinFixtures(players(6));
    const orders = fixtures.map((f) => f.matchOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("defaults to a single leg when legs is omitted", () => {
    const withDefault = generateRoundRobinFixtures(players(4));
    const explicitOnce = generateRoundRobinFixtures(players(4), 1);
    expect(withDefault).toEqual(explicitOnce);
  });

  it("repeats every pairing twice when legs is 2", () => {
    const fixtures = generateRoundRobinFixtures(players(4), 2);
    expect(fixtures).toHaveLength(12); // 2 * (4 choose 2)

    const counts = new Map<string, number>();
    for (const f of fixtures) {
      const key = pairKey(f.player1Id, f.player2Id!);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(6);
    for (const count of counts.values()) expect(count).toBe(2);
  });

  it("repeats every pairing three times when legs is 3", () => {
    const fixtures = generateRoundRobinFixtures(players(3), 3);
    expect(fixtures).toHaveLength(9); // 3 * (3 choose 2)

    const counts = new Map<string, number>();
    for (const f of fixtures) {
      const key = pairKey(f.player1Id, f.player2Id!);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(3);
    for (const count of counts.values()) expect(count).toBe(3);
  });

  it("keeps match orders sequential and unique across multiple legs", () => {
    const fixtures = generateRoundRobinFixtures(players(5), 3);
    const orders = fixtures.map((f) => f.matchOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(orders).size).toBe(orders.length);
  });
});

describe("generateKnockoutFixtures", () => {
  const standings = players(4).map((p) => ({ player: p }));

  it("seeds semi finals as 1v4 and 2v3 once standings are ready", () => {
    const fixtures = generateKnockoutFixtures({ standings, knockoutMatches: [] });
    expect(fixtures).toEqual([
      { player1Id: "A", player2Id: "D", round: Round.SEMI_FINAL_1, matchOrder: 0 },
      { player1Id: "B", player2Id: "C", round: Round.SEMI_FINAL_2, matchOrder: 1 },
    ]);
  });

  it("does not seed semis with fewer than 4 players", () => {
    const fixtures = generateKnockoutFixtures({
      standings: players(3).map((p) => ({ player: p })),
      knockoutMatches: [],
    });
    expect(fixtures).toEqual([]);
  });

  it("does not seed the final until both semis are completed", () => {
    const knockoutMatches = [
      {
        round: Round.SEMI_FINAL_1,
        status: "PENDING",
        winnerId: null,
        player1Id: "A",
        player2Id: "D",
      },
      {
        round: Round.SEMI_FINAL_2,
        status: "COMPLETED",
        winnerId: "B",
        player1Id: "B",
        player2Id: "C",
      },
    ];
    expect(generateKnockoutFixtures({ standings, knockoutMatches })).toEqual([]);
  });

  it("seeds the final from the semi final winners once both are completed", () => {
    const knockoutMatches = [
      {
        round: Round.SEMI_FINAL_1,
        status: "COMPLETED",
        winnerId: "A",
        player1Id: "A",
        player2Id: "D",
      },
      {
        round: Round.SEMI_FINAL_2,
        status: "COMPLETED",
        winnerId: "C",
        player1Id: "B",
        player2Id: "C",
      },
    ];
    expect(generateKnockoutFixtures({ standings, knockoutMatches })).toEqual([
      { player1Id: "A", player2Id: "C", round: Round.FINAL, matchOrder: 0 },
    ]);
  });

  it("does not re-seed the final once it already exists", () => {
    const knockoutMatches = [
      {
        round: Round.SEMI_FINAL_1,
        status: "COMPLETED",
        winnerId: "A",
        player1Id: "A",
        player2Id: "D",
      },
      {
        round: Round.SEMI_FINAL_2,
        status: "COMPLETED",
        winnerId: "C",
        player1Id: "B",
        player2Id: "C",
      },
      {
        round: Round.FINAL,
        status: "PENDING",
        winnerId: null,
        player1Id: "A",
        player2Id: "C",
      },
    ];
    expect(generateKnockoutFixtures({ standings, knockoutMatches })).toEqual([]);
  });
});
