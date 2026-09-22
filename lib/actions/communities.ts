"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createCommunitySchema } from "@/lib/validations";
import { requireSignedIn, requireCommunityAdmin } from "@/lib/auth-helpers";
import { resolveOrCreateUserPlayerProfile } from "@/lib/actions/player-profiles";
import { CommunityRole, CommunityMembershipStatus } from "@/types";

export async function createCommunity(input: { name: string; description?: string }) {
  const session = await requireSignedIn();
  const parsed = createCommunitySchema.parse(input);
  const profile = await resolveOrCreateUserPlayerProfile(
    session.user.id,
    session.user.name ?? "Player"
  );

  const community = await prisma.community.create({
    data: {
      name: parsed.name,
      description: parsed.description || null,
      memberships: {
        create: { profileId: profile.id, role: CommunityRole.ADMIN, status: CommunityMembershipStatus.APPROVED },
      },
    },
  });

  revalidatePath("/communities");
  redirect(`/communities/${community.id}`);
}

/** Creates a PENDING membership row — a no-op if one already exists (request or membership). */
export async function requestToJoinCommunity(communityId: string) {
  const session = await requireSignedIn();
  const profile = await resolveOrCreateUserPlayerProfile(
    session.user.id,
    session.user.name ?? "Player"
  );

  const existing = await prisma.communityMembership.findUnique({
    where: { communityId_profileId: { communityId, profileId: profile.id } },
  });
  if (existing) return;

  await prisma.communityMembership.create({
    data: { communityId, profileId: profile.id },
  });
  revalidatePath("/communities");
  revalidatePath(`/communities/${communityId}`);
}

/** Cancels your own pending request, or leaves a community you're already in. */
export async function leaveCommunity(communityId: string) {
  const session = await requireSignedIn();
  const profile = await prisma.playerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return;

  await prisma.communityMembership.deleteMany({ where: { communityId, profileId: profile.id } });
  revalidatePath("/communities");
  revalidatePath(`/communities/${communityId}`);
}

export async function approveMembership(membershipId: string) {
  const membership = await prisma.communityMembership.findUnique({ where: { id: membershipId } });
  if (!membership) throw new Error("Request not found");
  await requireCommunityAdmin(membership.communityId);

  await prisma.communityMembership.update({
    where: { id: membershipId },
    data: { status: CommunityMembershipStatus.APPROVED },
  });
  revalidatePath(`/communities/${membership.communityId}`);
}

/** Declines a pending request, or removes an approved member — same action either way. */
export async function removeMembership(membershipId: string) {
  const membership = await prisma.communityMembership.findUnique({ where: { id: membershipId } });
  if (!membership) return;
  await requireCommunityAdmin(membership.communityId);

  await prisma.communityMembership.delete({ where: { id: membershipId } });
  revalidatePath(`/communities/${membership.communityId}`);
}

/** Promotes an already-approved member to admin. Community admins nominate other admins this way. */
export async function nominateAdmin(membershipId: string) {
  const membership = await prisma.communityMembership.findUnique({ where: { id: membershipId } });
  if (!membership) throw new Error("Member not found");
  await requireCommunityAdmin(membership.communityId);
  if (membership.status !== CommunityMembershipStatus.APPROVED) {
    throw new Error("Only an approved member can be made an admin");
  }

  await prisma.communityMembership.update({
    where: { id: membershipId },
    data: { role: CommunityRole.ADMIN },
  });
  revalidatePath(`/communities/${membership.communityId}`);
}

export async function getCommunity(id: string) {
  return prisma.community.findUnique({
    where: { id },
    include: {
      memberships: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        include: { profile: { select: { id: true, name: true } } },
      },
    },
  });
}

/**
 * Every community, annotated with the viewer's own membership (if any) so
 * the page can render "My communities," pending requests, and "Discover" in
 * one pass without three separate queries.
 */
export async function listCommunitiesForViewer(userId: string | undefined) {
  const profile = userId
    ? await prisma.playerProfile.findUnique({ where: { userId } })
    : null;

  const communities = await prisma.community.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: { where: { status: CommunityMembershipStatus.APPROVED } } } },
      memberships: profile ? { where: { profileId: profile.id } } : false,
    },
  });

  return communities.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    memberCount: c._count.memberships,
    viewerMembership: (c.memberships as { role: string; status: string }[] | undefined)?.[0] ?? null,
  }));
}
