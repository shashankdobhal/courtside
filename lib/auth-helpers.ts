import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { isSuperAdminEmail } from "@/lib/admin";

const MUTATION_LIMIT = 30;
const MUTATION_WINDOW_MS = 60_000;

/**
 * Every mutating action funnels through one of the require* helpers below,
 * which makes this the one place to throttle abuse (runaway client loops,
 * bugs, scripted spam) across the whole app. Best-effort/per-instance — see
 * lib/rate-limit.ts — but enough to stop a single bad actor from generating
 * unbounded billed operations.
 */
function assertNotRateLimited(userId: string) {
  const result = rateLimit(userId, MUTATION_LIMIT, MUTATION_WINDOW_MS);
  if (!result.success) {
    throw new Error(`Too many requests — try again in ${result.retryAfterSeconds}s`);
  }
}

/**
 * Throws unless the signed-in user owns the given tournament. Every
 * mutating tournament action calls this first — it's the single source of
 * truth for "who can edit this," so there's exactly one place to get it
 * right.
 */
export async function requireTournamentOwner(tournamentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("You need to sign in first");
  assertNotRateLimited(session.user.id);

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new Error("Tournament not found");
  if (tournament.ownerId !== session.user.id) {
    throw new Error("You don't own this tournament");
  }

  return { session, tournament };
}

/**
 * Throws unless the signed-in user owns the given event. Same shape as
 * requireTournamentOwner, for the event-level actions (creating categories
 * under it, deleting it).
 */
export async function requireEventOwner(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("You need to sign in first");
  assertNotRateLimited(session.user.id);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");
  if (event.ownerId !== session.user.id) {
    throw new Error("You don't own this event");
  }

  return { session, event };
}

/**
 * Throws unless the signed-in user is an approved admin of the given
 * community. Mirrors requireTournamentOwner/requireEventOwner — the single
 * source of truth for "who can approve requests or nominate admins here."
 */
export async function requireCommunityAdmin(communityId: string) {
  const session = await requireSignedIn();

  const profile = await prisma.playerProfile.findUnique({ where: { userId: session.user.id } });
  const membership = profile
    ? await prisma.communityMembership.findUnique({
        where: { communityId_profileId: { communityId, profileId: profile.id } },
      })
    : null;

  if (!membership || membership.role !== "ADMIN" || membership.status !== "APPROVED") {
    throw new Error("You don't have admin access to this community");
  }

  return { session, membership };
}

export async function requireSignedIn() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("You need to sign in first");
  assertNotRateLimited(session.user.id);
  return session;
}

/**
 * Throws unless the signed-in user is the one CourtSide super admin.
 * Every admin action funnels through this, mirroring how ownership checks
 * are the single source of truth for tournament/event mutations.
 */
export async function requireSuperAdmin() {
  const session = await requireSignedIn();
  if (!isSuperAdminEmail(session.user.email)) {
    throw new Error("You don't have admin access");
  }
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
  assertNotRateLimited(session.user.id);

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
      (match.player1.profileId === profile.id ||
        match.player1.partnerProfileId === profile.id ||
        match.player2?.profileId === profile.id ||
        match.player2?.partnerProfileId === profile.id);
    if (!isParticipant) {
      throw new Error("Only the organizer or the players in this match can edit its score");
    }
  }

  return { session, match };
}

/**
 * Throws unless the signed-in user owns the tournament, or is one of the
 * roster players about to play each other -- used when logging an ad-hoc
 * session match, so any player already in the session can start a game
 * without waiting on the organizer. `participantPlayerIds` are individual
 * roster Player ids (both sides' picks, flattened) -- for a doubles match
 * this is checked before any on-the-fly pairing row is resolved/created.
 */
export async function requireSessionMatchParticipantOrOwner(
  tournamentId: string,
  participantPlayerIds: string[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("You need to sign in first");
  assertNotRateLimited(session.user.id);

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new Error("Tournament not found");

  const isOwner = tournament.ownerId === session.user.id;
  if (!isOwner) {
    const profile = await prisma.playerProfile.findUnique({ where: { userId: session.user.id } });
    const participants = await prisma.player.findMany({
      where: { id: { in: participantPlayerIds } },
    });
    const isParticipant = !!profile && participants.some((p) => p.profileId === profile.id);
    if (!isParticipant) {
      throw new Error("Only the organizer or players in this session can add a match");
    }
  }

  return { session, tournament };
}
