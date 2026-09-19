import { startOfDay, subDays } from "date-fns";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(d: Date): number {
  return startOfDay(d).getTime();
}

export interface PlayStreak {
  current: number;
  longest: number;
  playedToday: boolean;
  /** Whether each of the last 7 calendar days (oldest first, today last) had a completed match. */
  last7Days: boolean[];
}

/**
 * Duolingo-style streak: consecutive calendar days with at least one
 * completed match, counted back from today. A streak stays "alive" for one
 * day of grace — if you played yesterday but not yet today, it still shows
 * as active — but breaks once a full day is skipped.
 */
export function calculatePlayStreak(completedDates: Date[], now: Date = new Date()): PlayStreak {
  const daySet = new Set(completedDates.map(dayKey));
  const today = startOfDay(now);
  const playedToday = daySet.has(dayKey(today));
  const playedYesterday = daySet.has(dayKey(subDays(today, 1)));

  let current = 0;
  if (playedToday || playedYesterday) {
    let cursor = playedToday ? today : subDays(today, 1);
    while (daySet.has(dayKey(cursor))) {
      current += 1;
      cursor = subDays(cursor, 1);
    }
  }

  const sortedDays = Array.from(daySet).sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sortedDays) {
    run = prev !== null && d - prev === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => daySet.has(dayKey(subDays(today, 6 - i))));

  return { current, longest, playedToday, last7Days };
}

const POINTS_PER_MATCH = 10;
const POINTS_PER_WIN = 15;
const POINTS_PER_STREAK_DAY = 5;

export interface KarmaInput {
  matchesPlayed: number;
  wins: number;
  currentStreak: number;
}

/**
 * Karma is a pure function of activity — matches played, wins, and the
 * current streak — never a stored counter, so it can never drift out of
 * sync with the underlying match history.
 */
export function calculateKarmaPoints({ matchesPlayed, wins, currentStreak }: KarmaInput): number {
  return (
    matchesPlayed * POINTS_PER_MATCH + wins * POINTS_PER_WIN + currentStreak * POINTS_PER_STREAK_DAY
  );
}
