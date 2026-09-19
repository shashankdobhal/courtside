import { describe, expect, it } from "vitest";
import { calculateChampionStreak, aggregateProfileStats } from "./player-stats";

describe("calculateChampionStreak", () => {
  it("returns 0 for an empty history", () => {
    expect(calculateChampionStreak([])).toBe(0);
  });

  it("returns 0 when the most recent tournament wasn't won", () => {
    expect(
      calculateChampionStreak([
        { tournamentId: "t1", isChampion: false },
        { tournamentId: "t2", isChampion: true },
      ])
    ).toBe(0);
  });

  it("counts consecutive wins from the most recent, stopping at the first loss", () => {
    expect(
      calculateChampionStreak([
        { tournamentId: "t1", isChampion: true },
        { tournamentId: "t2", isChampion: true },
        { tournamentId: "t3", isChampion: false },
        { tournamentId: "t4", isChampion: true },
      ])
    ).toBe(2);
  });

  it("counts the full length when every tournament was won", () => {
    expect(
      calculateChampionStreak([
        { tournamentId: "t1", isChampion: true },
        { tournamentId: "t2", isChampion: true },
      ])
    ).toBe(2);
  });
});

describe("aggregateProfileStats", () => {
  it("sums stats across tournaments and computes point difference", () => {
    const stats = aggregateProfileStats([
      { played: 3, won: 2, lost: 1, pointsFor: 63, pointsAgainst: 55 },
      { played: 2, won: 1, lost: 1, pointsFor: 40, pointsAgainst: 42 },
    ]);
    expect(stats).toEqual({
      played: 5,
      won: 3,
      lost: 2,
      pointsFor: 103,
      pointsAgainst: 97,
      pointDifference: 6,
    });
  });

  it("returns all zeros for no tournaments", () => {
    expect(aggregateProfileStats([])).toEqual({
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifference: 0,
    });
  });
});
