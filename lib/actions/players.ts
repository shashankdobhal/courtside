"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { editPlayerSchema } from "@/lib/validations";

export async function updatePlayer(
  playerId: string,
  input: { name: string; alias?: string }
) {
  const parsed = editPlayerSchema.parse(input);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found");

  const siblings = await prisma.player.findMany({
    where: { tournamentId: player.tournamentId, NOT: { id: playerId } },
    select: { name: true },
  });
  const nameTaken = siblings.some(
    (p) => p.name.trim().toLowerCase() === parsed.name.trim().toLowerCase()
  );
  if (nameTaken) throw new Error("Another player already has this name");

  await prisma.player.update({
    where: { id: playerId },
    data: { name: parsed.name, alias: parsed.alias?.trim() || null },
  });

  revalidatePath(`/tournaments/${player.tournamentId}`);
  revalidatePath(`/tournaments/${player.tournamentId}/share`);
}
