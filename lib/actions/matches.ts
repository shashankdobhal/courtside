"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scoreEntrySchema } from "@/lib/validations";
import { calculateStandings } from "@/lib/algorithms/standings";
import { generateKnockoutFixtures } from "@/lib/algorithms/fixtures";
import { MatchStatus, Round, TournamentStatus, TournamentType } from "@/types";

async function progressTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true, matches: true },
  });
  if (!tournament) return;

  const leagueMatches = tournament.matches.filter((m) => m.round === Round.LEAGUE);
  const leagueDone =
    leagueMatches.length > 0 && leagueMatches.every((m) => m.status === MatchStatus.COMPLETED);

  if (tournament.type === TournamentType.ROUND_ROBIN) {
    if (leagueDone && tournament.status !== TournamentStatus.COMPLETED) {
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
  const parsed = scoreEntrySchema.parse({ score1, score2 });

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });
  if (!match) throw new Error("Match not found");
  if (!match.player2Id) throw new Error("Match has no second player");
  if (match.tournament.status === TournamentStatus.CANCELLED) {
    throw new Error("This tournament has been discontinued");
  }

  const winnerId = parsed.score1 > parsed.score2 ? match.player1Id : match.player2Id;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      score1: parsed.score1,
      score2: parsed.score2,
      winnerId,
      status: MatchStatus.COMPLETED,
    },
  });

  await progressTournament(match.tournamentId);

  revalidatePath("/");
  revalidatePath(`/tournaments/${match.tournamentId}`);
  revalidatePath(`/tournaments/${match.tournamentId}/share`);
}
