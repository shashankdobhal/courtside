"use server";

import { startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { MatchStatus, TournamentFormat } from "@/types";
import {
  calculateLeaderboard,
  computeTrends,
  type LeaderboardMatchRecord,
  type LeaderboardRow,
  type Trend,
} from "@/lib/algorithms/leaderboard";

async function fetchMatchRecords(start: Date, end: Date): Promise<LeaderboardMatchRecord[]> {
  const matches = await prisma.match.findMany({
    where: {
      status: MatchStatus.COMPLETED,
      completedAt: { gte: start, lt: end },
      tournament: { format: TournamentFormat.SINGLES },
      player1: { withdrawn: false, profileId: { not: null }, profile: { seasonOptIn: true } },
      player2: { withdrawn: false, profileId: { not: null }, profile: { seasonOptIn: true } },
    },
    include: {
      player1: { include: { profile: true } },
      player2: { include: { profile: true } },
    },
  });

  const records: LeaderboardMatchRecord[] = [];
  for (const m of matches) {
    if (
      !m.player1.profile ||
      !m.player2?.profile ||
      m.score1 === null ||
      m.score2 === null ||
      !m.winnerId
    ) {
      continue;
    }
    const winnerProfileId =
      m.winnerId === m.player1Id ? m.player1.profile.id : m.player2.profile.id;
    records.push({
      player1ProfileId: m.player1.profile.id,
      player2ProfileId: m.player2.profile.id,
      player1Name: m.player1.profile.name,
      player2Name: m.player2.profile.name,
      score1: m.score1,
      score2: m.score2,
      winnerProfileId,
    });
  }
  return records;
}

export interface LeaderboardResult {
  range: { start: Date; end: Date };
  rows: LeaderboardRow[];
  trends: Map<string, Trend>;
}

export async function getWeeklyLeaderboard(): Promise<LeaderboardResult> {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  const previousStart = subWeeks(start, 1);

  const [currentRecords, previousRecords] = await Promise.all([
    fetchMatchRecords(start, end),
    fetchMatchRecords(previousStart, start),
  ]);

  const rows = calculateLeaderboard(currentRecords);
  const previousRows = calculateLeaderboard(previousRecords);
  const trends = computeTrends(rows, previousRows);

  return { range: { start, end }, rows, trends };
}
