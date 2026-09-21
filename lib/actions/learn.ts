"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwnProfile } from "@/lib/actions/player-profiles";
import { learnPostSchema, type LearnPostInput } from "@/lib/validations";

/**
 * Every Learn post, newest first — public, same visibility model as
 * /live, /news, and /coaches. The author's name travels with each post
 * since these are shown attributed, never anonymously.
 */
export async function getLearnFeed() {
  return prisma.learnPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function getProfileLearnPosts(profileId: string) {
  return prisma.learnPost.findMany({
    where: { authorProfileId: profileId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLearnPost(profileId: string, input: LearnPostInput) {
  await requireOwnProfile(profileId);
  const parsed = learnPostSchema.parse(input);

  await prisma.learnPost.create({
    data: {
      title: parsed.title,
      body: parsed.body?.trim() || null,
      videoUrl: parsed.videoUrl?.trim() || null,
      authorProfileId: profileId,
    },
  });

  revalidatePath(`/players/${profileId}`);
  revalidatePath("/explore");
}

export async function deleteLearnPost(postId: string) {
  const post = await prisma.learnPost.findUnique({ where: { id: postId } });
  if (!post) return;

  await requireOwnProfile(post.authorProfileId);
  await prisma.learnPost.delete({ where: { id: postId } });

  revalidatePath(`/players/${post.authorProfileId}`);
  revalidatePath("/explore");
}
