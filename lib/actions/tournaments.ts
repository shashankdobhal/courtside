"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createTournamentSchema, playersSchemaForType } from "@/lib/validations";
import { TournamentStatus, TournamentType } from "@/types";
import { generateRoundRobinFixtures } from "@/lib/algorithms/fixtures";

export async function createTournament(input: { name: string; type: string; legs: number }) {
  const parsed = createTournamentSchema.parse(input);

  const tournament = await prisma.tournament.create({
    data: {
      name: parsed.name,
      type: parsed.type,
      legs: parsed.type === TournamentType.ROUND_ROBIN ? parsed.legs : 1,
      status: TournamentStatus.PENDING,
    },
  });

  redirect(`/tournaments/${tournament.id}/players`);
}

export async function setupPlayersAndFixtures(tournamentId: string, names: string[]) {
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== TournamentStatus.PENDING) {
    throw new Error("Players have already been set up for this tournament");
  }

  const parsed = playersSchemaForType(tournament.type).parse(names.map((name) => ({ name })));

  const players = await prisma.$transaction(
    parsed.map((p) => prisma.player.create({ data: { tournamentId, name: p.name } }))
  );

  const fixtures = generateRoundRobinFixtures(players, tournament.legs);

  await prisma.$transaction([
    prisma.match.createMany({
      data: fixtures.map((f) => ({ ...f, tournamentId })),
    }),
    prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: TournamentStatus.ACTIVE },
    }),
  ]);

  redirect(`/tournaments/${tournamentId}`);
}

export async function getTournaments() {
  return prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { matches: true, players: true } } },
  });
}

export async function getTournament(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      players: true,
      matches: { orderBy: [{ round: "asc" }, { matchOrder: "asc" }] },
    },
  });
}
