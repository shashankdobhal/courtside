"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { requireSignedIn } from "@/lib/auth-helpers";
import { resolveOrCreateUserPlayerProfile } from "@/lib/actions/player-profiles";
import { requestCoachingSchema, playerNameSchema } from "@/lib/validations";
import { sendPushToUser } from "@/lib/push";
import { rateLimit } from "@/lib/rate-limit";

async function requireCoachProfile(coachProfileId: string) {
  const coach = await prisma.playerProfile.findUnique({ where: { id: coachProfileId } });
  if (!coach || !coach.isCoach) throw new Error("Coach not found");
  return coach;
}

const ANON_REQUEST_LIMIT = 5;
const ANON_REQUEST_WINDOW_MS = 60 * 60 * 1000;

/**
 * A signed-in requester's name comes from their account (no need to ask);
 * a signed-out visitor types it in, since there's no identity to read it
 * from. Either way pushes a notification to the coach — this is the one
 * action in the coach directory urgent enough to warrant it, unlike a
 * follow.
 */
export async function requestCoaching(
  coachProfileId: string,
  input: { name?: string; phone: string }
) {
  const session = await auth();
  const coach = await requireCoachProfile(coachProfileId);
  const parsed = requestCoachingSchema.parse(input);

  let requesterProfileId: string | null = null;
  let requesterName: string;

  if (session?.user?.id) {
    const profile = await resolveOrCreateUserPlayerProfile(
      session.user.id,
      session.user.name ?? "Player"
    );
    if (profile.id === coach.id) throw new Error("You can't request coaching from yourself");
    requesterProfileId = profile.id;
    requesterName = profile.name;
  } else {
    requesterName = playerNameSchema.parse(parsed.name);

    const limited = rateLimit(
      `coaching-request:${parsed.phone}`,
      ANON_REQUEST_LIMIT,
      ANON_REQUEST_WINDOW_MS
    );
    if (!limited.success) {
      throw new Error(`Too many requests — try again in ${limited.retryAfterSeconds}s`);
    }
  }

  await prisma.coachingRequest.create({
    data: {
      coachProfileId,
      requesterProfileId,
      requesterName,
      requesterPhone: parsed.phone,
    },
  });

  if (coach.userId) {
    await sendPushToUser(coach.userId, {
      title: "New coaching request",
      body: `${requesterName} wants to book a session with you`,
      url: `/players/${coach.id}`,
    });
  }
}

/**
 * A coach's own incoming requests and followers — private, only ever read
 * from their own profile page.
 */
export async function getCoachInbox(coachProfileId: string) {
  const session = await requireSignedIn();
  const coach = await prisma.playerProfile.findUnique({ where: { id: coachProfileId } });
  if (!coach || coach.userId !== session.user.id) {
    throw new Error("You can only view your own coaching requests");
  }

  const [requests, followers] = await Promise.all([
    prisma.coachingRequest.findMany({
      where: { coachProfileId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.follow.findMany({
      where: { followedProfileId: coachProfileId },
      orderBy: { createdAt: "desc" },
      include: { followerProfile: { select: { id: true, name: true } } },
    }),
  ]);

  return { requests, followers };
}
