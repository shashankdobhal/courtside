"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations";
import { requireSignedIn, requireEventOwner } from "@/lib/auth-helpers";
import { generateJoinCode } from "@/lib/join-code";

const MAX_JOIN_CODE_ATTEMPTS = 5;

export async function createEvent(input: { name: string }) {
  const session = await requireSignedIn();
  const parsed = createEventSchema.parse(input);

  let event;
  for (let attempt = 1; ; attempt++) {
    try {
      event = await prisma.event.create({
        data: { name: parsed.name, ownerId: session.user.id, joinCode: generateJoinCode() },
      });
      break;
    } catch (err) {
      const isJoinCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        (err.meta?.target as string[] | undefined)?.includes("joinCode");
      if (!isJoinCodeCollision || attempt >= MAX_JOIN_CODE_ATTEMPTS) throw err;
    }
  }

  revalidatePath("/");
  redirect(`/events/${event.id}`);
}

export async function deleteEvent(eventId: string) {
  await requireEventOwner(eventId);
  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath("/");
}

export async function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      tournaments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          format: true,
          type: true,
          status: true,
          _count: { select: { players: true } },
        },
      },
    },
  });
}
