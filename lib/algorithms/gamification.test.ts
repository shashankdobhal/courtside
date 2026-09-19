import { describe, expect, it } from "vitest";
import { calculatePlayStreak, calculateKarmaPoints } from "./gamification";

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
