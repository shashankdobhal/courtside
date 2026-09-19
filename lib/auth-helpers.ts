import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Throws unless the signed-in user owns the given tournament. Every
 * mutating tournament action calls this first — it's the single source of
 * truth for "who can edit this," so there's exactly one place to get it
 * right.
 */
export async function requireTournamentOwner(tournamentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("You need to sign in first");

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.ownerId !== session.user.id) {
    throw new Error("You don't own this tournament");
  }

  return { session, tournament };
}

export async function requireSignedIn() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("You need to sign in first");
  return session;
}

/**
 * Throws unless the signed-in user owns the match's tournament, or is one
 * of the two players in the match themselves. This is what lets a player
 * edit their own match's score without giving them (or anyone else viewing
 * the tournament) the ability to touch matches they weren't part of.
 */
export async function requireMatchParticipantOrOwner(matchId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("You need to sign in first");

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true, player1: true, player2: true },
  });
  if (!match) throw new Error("Match not found");

  const isOwner = match.tournament.ownerId === session.user.id;
  if (!isOwner) {
    const profile = await prisma.playerProfile.findUnique({ where: { userId: session.user.id } });
    const isParticipant =
      !!profile &&
      (match.player1.profileId === profile.id || match.player2?.profileId === profile.id);
    if (!isParticipant) {
      throw new Error("Only the organizer or the players in this match can edit its score");
    }
  }

  return { session, match };
}
