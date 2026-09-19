"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { editPlayerSchema } from "@/lib/validations";
import { resolveOrCreatePlayerProfile } from "@/lib/actions/player-profiles";
import { progressTournament } from "@/lib/actions/matches";
import { MatchStatus, TournamentStatus } from "@/types";

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

  const profileId = await resolveOrCreatePlayerProfile(parsed.name);

  await prisma.player.update({
    where: { id: playerId },
    data: { name: parsed.name, alias: parsed.alias?.trim() || null, profileId },
  });

  revalidatePath(`/tournaments/${player.tournamentId}`);
  revalidatePath(`/tournaments/${player.tournamentId}/share`);
}

/**
 * Withdraws a player mid-tournament. Their pending matches are voided (not
 * deleted) so they no longer count toward anyone's standings, while already
 * completed results are kept as history. A pending knockout match is voided
 * too, with no auto-advance for the opponent — the organizer resolves the
 * bracket manually.
 */
export async function withdrawPlayer(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { tournament: true },
  });
  if (!player) throw new Error("Player not found");
  if (player.tournament.status !== TournamentStatus.ACTIVE) {
    throw new Error("Players can only be withdrawn while the tournament is active");
  }

  await prisma.$transaction([
    prisma.player.update({ where: { id: playerId }, data: { withdrawn: true } }),
    prisma.match.updateMany({
      where: {
        tournamentId: player.tournamentId,
        status: MatchStatus.PENDING,
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
      data: { status: MatchStatus.VOID },
    }),
  ]);

  await progressTournament(player.tournamentId);

  revalidatePath("/");
  revalidatePath(`/tournaments/${player.tournamentId}`);
  revalidatePath(`/tournaments/${player.tournamentId}/share`);
}
