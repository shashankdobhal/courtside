"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { addLivestreamSchema, type AddLivestreamInput } from "@/lib/validations";

/**
 * A stream not tied to any CourtSide tournament — coverage of an outside
 * event, added directly by the admin so it shows up on /live without
 * needing a full tournament created just to host a YouTube link.
 */
export async function addLivestream(input: AddLivestreamInput) {
  await requireSuperAdmin();
  const parsed = addLivestreamSchema.parse(input);

  await prisma.livestream.create({
    data: { title: parsed.title, youtubeUrl: parsed.youtubeUrl },
  });

  revalidatePath("/live");
}

export async function endLivestream(id: string) {
  await requireSuperAdmin();
  await prisma.livestream.update({ where: { id }, data: { isLive: false } });
  revalidatePath("/live");
}

export async function deleteLivestream(id: string) {
  await requireSuperAdmin();
  await prisma.livestream.delete({ where: { id } });
  revalidatePath("/live");
}

/** Public — merged onto /live alongside tournament streams. */
export async function getPublicLivestreams() {
  return prisma.livestream.findMany({ orderBy: { updatedAt: "desc" } });
}
