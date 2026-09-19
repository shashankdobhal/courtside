import { describe, expect, it } from "vitest";
import { calculateLeaderboard, computeTrends, type LeaderboardMatchRecord } from "./leaderboard";

function match(overrides: Partial<LeaderboardMatchRecord>): LeaderboardMatchRecord {
  return {
    player1ProfileId: "p1",
    player2ProfileId: "p2",
    player1Name: "Rahul",
    player2Name: "Amit",
    score1: 21,
    score2: 15,
    winnerProfileId: "p1",
    ...overrides,
  };
}

describe("calculateLeaderboard", () => {
  it("aggregates across multiple matches for the same profile across tournaments", () => {
    const rows = calculateLeaderboard([
      match({ winnerProfileId: "p1", score1: 21, score2: 15 }),
      match({
        player1ProfileId: "p1",
        player2ProfileId: "p3",
        player2Name: "Priya",
        winnerProfileId: "p3",
        score1: 10,
        score2: 21,
      }),
    ]);

    const p1 = rows.find((r) => r.profileId === "p1")!;
    expect(p1.played).toBe(2);
    expect(p1.won).toBe(1);
    expect(p1.lost).toBe(1);
    expect(p1.pointsFor).toBe(31);
    expect(p1.pointsAgainst).toBe(36);
  });

  it("sorts by wins, then point difference, then points scored, and assigns rank", () => {
    const rows = calculateLeaderboard([
      match({ player1ProfileId: "p1", player2ProfileId: "p2", winnerProfileId: "p1", score1: 21, score2: 5 }),
      match({ player1ProfileId: "p2", player2ProfileId: "p3", winnerProfileId: "p2", score1: 21, score2: 19 }),
      match({ player1ProfileId: "p3", player2ProfileId: "p1", winnerProfileId: "p3", score1: 21, score2: 10 }),
    ]);

    expect(rows.map((r) => r.profileId)).toEqual(["p3", "p1", "p2"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });
});

describe("computeTrends", () => {
  it("marks a profile absent from the previous period as new", () => {
    const current = calculateLeaderboard([match({})]);
    const trends = computeTrends(current, []);
    expect(trends.get("p1")?.direction).toBe("new");
    expect(trends.get("p2")?.direction).toBe("new");
  });

  it("marks an improved rank as up and a worse rank as down", () => {
    const previous = calculateLeaderboard([
      match({ player1ProfileId: "p1", player2ProfileId: "p2", winnerProfileId: "p2", score1: 10, score2: 21 }),
    ]);
    const current = calculateLeaderboard([
      match({ player1ProfileId: "p1", player2ProfileId: "p2", winnerProfileId: "p1", score1: 21, score2: 10 }),
    ]);
    const trends = computeTrends(current, previous);

    expect(trends.get("p1")?.direction).toBe("up");
    expect(trends.get("p1")?.rankDelta).toBe(1);
    expect(trends.get("p2")?.direction).toBe("down");
    expect(trends.get("p2")?.rankDelta).toBe(-1);
  });

  it("marks an unchanged rank as flat", () => {
    const records = [match({})];
    const current = calculateLeaderboard(records);
    const previous = calculateLeaderboard(records);
    const trends = computeTrends(current, previous);

    expect(trends.get("p1")?.direction).toBe("flat");
    expect(trends.get("p1")?.rankDelta).toBe(0);
  });
});
