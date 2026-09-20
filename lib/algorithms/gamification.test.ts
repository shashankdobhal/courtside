import { describe, expect, it } from "vitest";
import { calculatePlayStreak, calculateKarmaPoints, calculateKarmaLevel } from "./gamification";

const NOW = new Date("2026-09-19T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe("calculatePlayStreak", () => {
  it("returns all zeros for no activity", () => {
    expect(calculatePlayStreak([], NOW)).toEqual({
      current: 0,
      longest: 0,
      playedToday: false,
      last7Days: [false, false, false, false, false, false, false],
    });
  });

  it("counts today as day 1 of a streak", () => {
    const result = calculatePlayStreak([daysAgo(0)], NOW);
    expect(result.current).toBe(1);
    expect(result.playedToday).toBe(true);
    expect(result.last7Days).toEqual([false, false, false, false, false, false, true]);
  });

  it("stays alive on a grace day when yesterday was played but not yet today", () => {
    const result = calculatePlayStreak([daysAgo(1)], NOW);
    expect(result.current).toBe(1);
    expect(result.playedToday).toBe(false);
  });

  it("breaks once a full day is skipped", () => {
    const result = calculatePlayStreak([daysAgo(2)], NOW);
    expect(result.current).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const result = calculatePlayStreak([daysAgo(0), daysAgo(1), daysAgo(2), daysAgo(4)], NOW);
    expect(result.current).toBe(3);
  });

  it("collapses multiple matches on the same day into one streak day", () => {
    const result = calculatePlayStreak([daysAgo(0), daysAgo(0), daysAgo(1)], NOW);
    expect(result.current).toBe(2);
  });

  it("tracks the longest streak separately from the current one", () => {
    const result = calculatePlayStreak(
      [daysAgo(0), daysAgo(10), daysAgo(11), daysAgo(12), daysAgo(13)],
      NOW
    );
    expect(result.current).toBe(1);
    expect(result.longest).toBe(4);
  });

  it("resolves the calendar day using the given timezone, not the server's own", () => {
    // 2026-09-19 23:00 UTC is already 2026-09-20 04:30 in Asia/Kolkata (UTC+5:30).
    const match = new Date("2026-09-19T23:00:00Z");
    const now = new Date("2026-09-20T01:00:00Z");

    expect(calculatePlayStreak([match], now, "UTC").playedToday).toBe(false);
    expect(calculatePlayStreak([match], now, "Asia/Kolkata").playedToday).toBe(true);
  });
});

describe("calculateKarmaPoints", () => {
  it("returns 0 for no activity", () => {
    expect(calculateKarmaPoints({ matchesPlayed: 0, wins: 0, currentStreak: 0 })).toBe(0);
  });

  it("combines play, win, and streak bonuses", () => {
    expect(calculateKarmaPoints({ matchesPlayed: 5, wins: 3, currentStreak: 2 })).toBe(
      5 * 10 + 3 * 15 + 2 * 5
    );
  });
});

describe("calculateKarmaLevel", () => {
  it("starts everyone at E-Rank Hunter with a clear next target", () => {
    expect(calculateKarmaLevel(0)).toEqual({
      level: "E-Rank Hunter",
      levelIndex: 0,
      nextLevel: "D-Rank Hunter",
      karmaToNextLevel: 50,
      progressToNextLevel: 0,
    });
  });

  it("reports partial progress toward the next level", () => {
    const result = calculateKarmaLevel(25);
    expect(result.level).toBe("E-Rank Hunter");
    expect(result.nextLevel).toBe("D-Rank Hunter");
    expect(result.karmaToNextLevel).toBe(25);
    expect(result.progressToNextLevel).toBeCloseTo(0.5);
  });

  it("advances to the next named tier exactly at its threshold", () => {
    const result = calculateKarmaLevel(150);
    expect(result.level).toBe("C-Rank Hunter");
    expect(result.levelIndex).toBe(2);
  });

  it("caps out at the top tier with no further target", () => {
    const result = calculateKarmaLevel(5000);
    expect(result).toEqual({
      level: "S-Rank Hunter",
      levelIndex: 5,
      nextLevel: null,
      karmaToNextLevel: null,
      progressToNextLevel: 1,
    });
  });
});
