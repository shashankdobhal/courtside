"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scoreEntrySchema, bestOfThreeScoreEntrySchema, type GameScoreInput } from "@/lib/validations";
import { calculateStandings } from "@/lib/algorithms/standings";
import { generateKnockoutFixtures } from "@/lib/algorithms/fixtures";
import { KNOCKOUT_ROUND_SEQUENCE, knockoutRoundsFromFirst, nextKnockoutRound } from "@/lib/algorithms/bracket";
import { requireMatchParticipantOrOwner } from "@/lib/auth-helpers";
import { MatchStatus, Round, TournamentFormat, TournamentStatus, TournamentType } from "@/types";

async function finishMatchUpdate(tournamentId: string) {
  await progressTournament(tournamentId);

  revalidatePath("/");
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/share`);
}

export async function progressTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true, matches: true },
  });
  if (!tournament) return;
  // Doubles is open-ended, casual play — matches are logged on the fly with
  // no fixed fixture list, so there's no "all matches done" moment to
  // auto-complete on. The organizer ends the session explicitly instead.
  if (tournament.format === TournamentFormat.DOUBLES) return;

  const leagueMatches = tournament.matches.filter((m) => m.round === Round.LEAGUE);
  const leagueDone =
    leagueMatches.length > 0 &&
    leagueMatches.every((m) => m.status === MatchStatus.COMPLETED || m.status === MatchStatus.VOID);

  if (tournament.type === TournamentType.ROUND_ROBIN) {
    if (leagueDone && tournament.status !== TournamentStatus.COMPLETED) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.COMPLETED },
      });
    }
    return;
  }

  if (tournament.type === TournamentType.KNOCKOUT) {
    if (tournament.matches.length === 0) return;

    const presentRounds = new Set(tournament.matches.map((m) => m.round));
    const firstRound = KNOCKOUT_ROUND_SEQUENCE.find((r) => presentRounds.has(r));
    const sequence = firstRound ? knockoutRoundsFromFirst(firstRound) : [];

    for (let i = 0; i < sequence.length - 1; i++) {
      const roundName = sequence[i];
      const nextRoundName = sequence[i + 1];
      if (presentRounds.has(nextRoundName)) continue;

      const roundMatches = tournament.matches.filter((m) => m.round === roundName);
      const newFixtures = nextKnockoutRound(roundMatches, nextRoundName);
      if (newFixtures.length > 0) {
        await prisma.match.createMany({
          data: newFixtures.map((f) => ({ ...f, tournamentId })),
        });
      }
      break;
    }

    const finalMatch = tournament.matches.find((m) => m.round === Round.FINAL);
    if (
      finalMatch?.status === MatchStatus.COMPLETED &&
      tournament.status !== TournamentStatus.COMPLETED
    ) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.COMPLETED },
      });
    }
    return;
  }

  // ROUND_ROBIN_KNOCKOUT
  const standings = calculateStandings(tournament.players, tournament.matches);
  const knockoutMatches = tournament.matches.filter((m) => m.round !== Round.LEAGUE);

  if (leagueDone) {
    const newFixtures = generateKnockoutFixtures({ standings, knockoutMatches });
    if (newFixtures.length > 0) {
      await prisma.match.createMany({
        data: newFixtures.map((f) => ({ ...f, tournamentId })),
      });
    }
  }

  const finalMatch = tournament.matches.find((m) => m.round === Round.FINAL);
  if (finalMatch?.status === MatchStatus.COMPLETED && tournament.status !== TournamentStatus.COMPLETED) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.COMPLETED },
    });
  }
}

export async function submitScore(matchId: string, score1: number, score2: number) {
  const { match } = await requireMatchParticipantOrOwner(matchId);
  const parsed = scoreEntrySchema.parse({ score1, score2 });

  if (!match.player2Id) throw new Error("Match has no second player");
  if (match.tournament.status === TournamentStatus.CANCELLED) {
    throw new Error("This tournament has been discontinued");
  }
  if (match.status === MatchStatus.VOID) {
    throw new Error("This match has been voided and no longer accepts a score");
  }

  const winnerId = parsed.score1 > parsed.score2 ? match.player1Id : match.player2Id;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      score1: parsed.score1,
      score2: parsed.score2,
      winnerId,
      status: MatchStatus.COMPLETED,
      completedAt: match.completedAt ?? new Date(),
      isBestOfThree: false,
      game1Score1: null,
      game1Score2: null,
      game2Score1: null,
      game2Score2: null,
      game3Score1: null,
      game3Score2: null,
    },
  });

  await finishMatchUpdate(match.tournamentId);
}

/**
 * Semifinal/final matches can opt into best-of-three instead of a single
 * game — league matches always stay single-game since they feed the
 * standings table, which only ever reads score1/score2 as points.
 */
export async function submitBestOfThreeScore(matchId: string, games: GameScoreInput[]) {
  const { match } = await requireMatchParticipantOrOwner(matchId);
  const parsed = bestOfThreeScoreEntrySchema.parse({
    game1: games[0],
    game2: games[1],
    game3: games[2],
  });

  if (!match.player2Id) throw new Error("Match has no second player");
  if (match.round === Round.LEAGUE) {
    throw new Error("Best of three is only available for semifinal and final matches");
  }
  if (match.tournament.status === TournamentStatus.CANCELLED) {
    throw new Error("This tournament has been discontinued");
  }
  if (match.status === MatchStatus.VOID) {
    throw new Error("This match has been voided and no longer accepts a score");
  }

  const playedGames = [parsed.game1, parsed.game2, parsed.game3].filter(
    (g): g is GameScoreInput => !!g
  );
  const player1Wins = playedGames.filter((g) => g.score1 > g.score2).length;
  const player2Wins = playedGames.filter((g) => g.score2 > g.score1).length;
  const winnerId = player1Wins > player2Wins ? match.player1Id : match.player2Id;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      score1: player1Wins,
      score2: player2Wins,
      winnerId,
      status: MatchStatus.COMPLETED,
      completedAt: match.completedAt ?? new Date(),
      isBestOfThree: true,
      game1Score1: parsed.game1.score1,
      game1Score2: parsed.game1.score2,
      game2Score1: parsed.game2.score1,
      game2Score2: parsed.game2.score2,
      game3Score1: parsed.game3?.score1 ?? null,
      game3Score2: parsed.game3?.score2 ?? null,
    },
  });

  await finishMatchUpdate(match.tournamentId);
}
