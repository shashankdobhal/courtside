"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createTournamentSchema } from "@/lib/validations";
import { TournamentStatus } from "@/types";

export async function createTournament(input: { name: string; type: string }) {
  const parsed = createTournamentSchema.parse(input);

  const tournament = await prisma.tournament.create({
    data: {
      name: parsed.name,
      type: parsed.type,
      status: TournamentStatus.PENDING,
    },
  });

  redirect(`/tournaments/${tournament.id}/players`);
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
