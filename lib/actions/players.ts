"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { editPlayerSchema, MAX_PLAYERS } from "@/lib/validations";
import {
  resolveOrCreatePlayerProfile,
  resolveOrCreateUserPlayerProfile,
} from "@/lib/actions/player-profiles";
import { progressTournament } from "@/lib/actions/matches";
import { requireSignedIn, requireTournamentOwner } from "@/lib/auth-helpers";
import { sendPushToUser } from "@/lib/push";
import { MatchStatus, TournamentStatus } from "@/types";

/**
 * Self-service join: any signed-in person can add themselves to a
 * still-forming (PENDING) tournament's roster, without needing the
 * organizer to type their name in. Their identity is tied to their Google
 * account (see resolveOrCreateUserPlayerProfile), not just the name shown.
 * Once the tournament's playerLimit (if any) is reached, new joiners land
 * on the waiting list instead of being turned away outright.
 */
export async function joinTournament(tournamentId: string): Promise<{ waitlisted: boolean }> {
  const session = await requireSignedIn();

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true },
  });
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== TournamentStatus.PENDING) {
    throw new Error("This tournament is no longer accepting new players");
  }
  if (tournament.players.length >= MAX_PLAYERS) {
    throw new Error("This tournament's roster is full");
  }

  const profile = await resolveOrCreateUserPlayerProfile(
    session.user.id,
    session.user.name ?? "Player"
  );

  if (tournament.players.some((p) => p.profileId === profile.id)) {
    throw new Error("You've already joined this tournament");
  }
  const nameTaken = tournament.players.some(
    (p) => p.name.trim().toLowerCase() === profile.name.trim().toLowerCase()
  );
  if (nameTaken) {
    throw new Error(
      "Someone in this tournament already has your profile name — ask the organizer to add you"
    );
  }

  const confirmedCount = tournament.players.filter((p) => !p.waitlisted).length;
  const waitlisted = tournament.playerLimit != null && confirmedCount >= tournament.playerLimit;

  await prisma.player.create({
    data: { tournamentId, name: profile.name, profileId: profile.id, waitlisted },
  });

  revalidatePath(`/tournaments/${tournamentId}/players`);
  revalidatePath("/");

  return { waitlisted };
}

export async function updatePlayer(
  playerId: string,
  input: { name: string; alias?: string }
) {
  const parsed = editPlayerSchema.parse(input);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found");
  await requireTournamentOwner(player.tournamentId);

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
  await requireTournamentOwner(player.tournamentId);
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

/**
 * Manually pulls one player off the waiting list, regardless of the
 * tournament's playerLimit — an explicit organizer override, same trust
 * level as every other organizer-only roster action. Best-effort pushes a
 * notification to the player if their identity is linked to an account.
 */
export async function promoteFromWaitlist(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { tournament: true, profile: { select: { userId: true } } },
  });
  if (!player) throw new Error("Player not found");
  await requireTournamentOwner(player.tournamentId);
  if (!player.waitlisted) throw new Error("This player isn't on the waiting list");

  await prisma.player.update({ where: { id: playerId }, data: { waitlisted: false } });

  if (player.profile?.userId) {
    try {
      await sendPushToUser(player.profile.userId, {
        title: "You're off the waiting list!",
        body: `A spot opened up in ${player.tournament.name}`,
        url: `/tournaments/${player.tournamentId}/players`,
      });
    } catch (err) {
      console.error("Failed to send waitlist-promotion notification", err);
    }
  }

  revalidatePath(`/tournaments/${player.tournamentId}/players`);
}
