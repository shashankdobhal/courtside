const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The calendar day `d` falls on in `timeZone`, as a UTC-midnight timestamp.
 * Using Intl here (rather than date-fns' startOfDay, which uses the JS
 * runtime's own timezone) means "today" reflects the viewer's timezone even
 * though this runs on a server that's always in UTC.
 */
function dayKey(d: Date, timeZone: string): number {
  const [y, m, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .split("-")
    .map(Number);
  return Date.UTC(y, m - 1, day);
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
export function calculatePlayStreak(
  completedDates: Date[],
  now: Date = new Date(),
  timeZone: string = "UTC"
): PlayStreak {
  const daySet = new Set(completedDates.map((d) => dayKey(d, timeZone)));
  const today = dayKey(now, timeZone);
  const yesterday = today - DAY_MS;
  const playedToday = daySet.has(today);
  const playedYesterday = daySet.has(yesterday);

  let current = 0;
  if (playedToday || playedYesterday) {
    let cursor = playedToday ? today : yesterday;
    while (daySet.has(cursor)) {
      current += 1;
      cursor -= DAY_MS;
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

  const last7Days = Array.from({ length: 7 }, (_, i) => daySet.has(today - (6 - i) * DAY_MS));

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

export const KARMA_BREAKDOWN = {
  perMatch: POINTS_PER_MATCH,
  perWin: POINTS_PER_WIN,
  perStreakDay: POINTS_PER_STREAK_DAY,
};

/**
 * Named tiers karma climbs through, giving every point total somewhere to
 * go next — hunter-rank styled (E through S), each with its own escalating
 * accent color for a bit of "power level" flavor as you climb.
 */
export const KARMA_LEVELS = [
  {
    name: "E-Rank Hunter",
    letter: "E",
    minKarma: 0,
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
  {
    name: "D-Rank Hunter",
    letter: "D",
    minKarma: 50,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "C-Rank Hunter",
    letter: "C",
    minKarma: 150,
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    name: "B-Rank Hunter",
    letter: "B",
    minKarma: 300,
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    name: "A-Rank Hunter",
    letter: "A",
    minKarma: 500,
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    name: "S-Rank Hunter",
    letter: "S",
    minKarma: 800,
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
] as const;

export interface KarmaProgress {
  level: string;
  levelIndex: number;
  nextLevel: string | null;
  karmaToNextLevel: number | null;
  /** 0-1 progress toward the next level; 1 when already at the top tier. */
  progressToNextLevel: number;
}

export function calculateKarmaLevel(karma: number): KarmaProgress {
  let levelIndex = 0;
  for (let i = 0; i < KARMA_LEVELS.length; i++) {
    if (karma >= KARMA_LEVELS[i].minKarma) levelIndex = i;
  }
  const current = KARMA_LEVELS[levelIndex];
  const next = KARMA_LEVELS[levelIndex + 1];

  if (!next) {
    return { level: current.name, levelIndex, nextLevel: null, karmaToNextLevel: null, progressToNextLevel: 1 };
  }

  const span = next.minKarma - current.minKarma;
  const progressed = karma - current.minKarma;
  return {
    level: current.name,
    levelIndex,
    nextLevel: next.name,
    karmaToNextLevel: next.minKarma - karma,
    progressToNextLevel: Math.min(1, progressed / span),
  };
}
