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
