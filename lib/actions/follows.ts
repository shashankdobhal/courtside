"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/auth-helpers";
import { resolveOrCreateUserPlayerProfile } from "@/lib/actions/player-profiles";

/**
 * Any signed-in player can follow any other player's profile — originally
 * coach-only, opened up so the Learn feed's authors are followable too.
 */
export async function followProfile(followedProfileId: string) {
  const session = await requireSignedIn();
  const followed = await prisma.playerProfile.findUnique({ where: { id: followedProfileId } });
  if (!followed) throw new Error("Profile not found");

  const follower = await resolveOrCreateUserPlayerProfile(
    session.user.id,
    session.user.name ?? "Player"
  );
  if (follower.id === followed.id) throw new Error("You can't follow yourself");

  await prisma.follow.upsert({
    where: {
      followedProfileId_followerProfileId: { followedProfileId, followerProfileId: follower.id },
    },
    update: {},
    create: { followedProfileId, followerProfileId: follower.id },
  });

  revalidatePath(`/players/${followedProfileId}`);
  revalidatePath(`/coaches/${followedProfileId}`);
}

export async function unfollowProfile(followedProfileId: string) {
  const session = await requireSignedIn();
  const follower = await prisma.playerProfile.findUnique({ where: { userId: session.user.id } });
  if (!follower) return;

  await prisma.follow.deleteMany({
    where: { followedProfileId, followerProfileId: follower.id },
  });

  revalidatePath(`/players/${followedProfileId}`);
  revalidatePath(`/coaches/${followedProfileId}`);
}

export async function getFollowState(profileId: string, viewerProfileId: string | null) {
  const [followerCount, isFollowing] = await Promise.all([
    prisma.follow.count({ where: { followedProfileId: profileId } }),
    viewerProfileId
      ? prisma.follow
          .findUnique({
            where: {
              followedProfileId_followerProfileId: {
                followedProfileId: profileId,
                followerProfileId: viewerProfileId,
              },
            },
          })
          .then((row) => !!row)
      : Promise.resolve(false),
  ]);

  return { followerCount, isFollowing };
}
