"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/auth-helpers";
import { resolveOrCreateUserPlayerProfile } from "@/lib/actions/player-profiles";
import { calculatePlayStreak } from "@/lib/algorithms/gamification";
import { QUEST_TOTAL_DAYS } from "@/lib/quest-display";

// TEMP: every day unlocked for everyone while the curriculum is under
// review. Flip back to false to restore the real sequential unlock below —
// that logic is untouched and still correct on its own.
const QUESTS_UNLOCKED_FOR_REVIEW = true;

/**
 * The next day a profile is allowed into — one past the highest QuestDay
 * they've completed, or day 1 for a brand-new/signed-out visitor. This is
 * the single source of truth for the sequential Duolingo-style lock; there
 * is no separate "current day" field to keep in sync with completions.
 */
async function unlockedThroughDayNumber(profileId: string | null): Promise<number> {
  if (QUESTS_UNLOCKED_FOR_REVIEW) return QUEST_TOTAL_DAYS + 1;
  if (!profileId) return 1;

  const completions = await prisma.questDayCompletion.findMany({
    where: { profileId },
    include: { day: { select: { dayNumber: true } } },
  });
  const highest = completions.reduce((max, c) => Math.max(max, c.day.dayNumber), 0);
  return highest + 1;
}

/**
 * The full 200-day path, annotated per-day with this viewer's completed/
 * unlocked state, plus their Duolingo-style streak computed live from
 * QuestDayCompletion timestamps (see calculatePlayStreak).
 */
export async function getQuestOverview(profileId: string | null, timeZone: string) {
  const [days, completions, unlockedThrough] = await Promise.all([
    prisma.questDay.findMany({ orderBy: { dayNumber: "asc" } }),
    profileId
      ? prisma.questDayCompletion.findMany({
          where: { profileId },
          select: { dayId: true, completedAt: true },
        })
      : Promise.resolve([]),
    unlockedThroughDayNumber(profileId),
  ]);

  const completedDayIds = new Set(completions.map((c) => c.dayId));

  const streak = calculatePlayStreak(
    completions.map((c) => c.completedAt),
    new Date(),
    timeZone
  );

  return {
    days: days.map((d) => ({
      ...d,
      completed: completedDayIds.has(d.id),
      unlocked: d.dayNumber <= unlockedThrough,
    })),
    completedCount: completedDayIds.size,
    unlockedThrough,
    streak,
  };
}

export async function getQuestDay(dayNumber: number, profileId: string | null) {
  const day = await prisma.questDay.findUnique({
    where: { dayNumber },
    include: { tasks: { orderBy: { taskOrder: "asc" } } },
  });
  if (!day) return null;

  const [completedTaskRows, unlockedThrough] = await Promise.all([
    profileId
      ? prisma.questTaskCompletion.findMany({
          where: { profileId, taskId: { in: day.tasks.map((t) => t.id) } },
          select: { taskId: true },
        })
      : Promise.resolve([]),
    unlockedThroughDayNumber(profileId),
  ]);

  return {
    day,
    completedTaskIds: new Set(completedTaskRows.map((r) => r.taskId)),
    unlocked: dayNumber <= unlockedThrough,
  };
}

/**
 * Toggles one task's completion for the signed-in player, then recomputes
 * whether the whole day is now complete (or no longer is) — a day's
 * completion is always derived from its tasks, never set independently.
 */
export async function toggleQuestTaskCompletion(taskId: string) {
  const session = await requireSignedIn();
  const profile = await resolveOrCreateUserPlayerProfile(
    session.user.id,
    session.user.name ?? "Player"
  );

  const task = await prisma.questTask.findUnique({
    where: { id: taskId },
    include: { day: { include: { tasks: { select: { id: true } } } } },
  });
  if (!task) throw new Error("Task not found");

  const unlockedThrough = await unlockedThroughDayNumber(profile.id);
  if (task.day.dayNumber > unlockedThrough) {
    throw new Error("Complete earlier days first");
  }

  const existing = await prisma.questTaskCompletion.findUnique({
    where: { profileId_taskId: { profileId: profile.id, taskId } },
  });

  if (existing) {
    await prisma.questTaskCompletion.delete({ where: { id: existing.id } });
  } else {
    await prisma.questTaskCompletion.create({ data: { profileId: profile.id, taskId } });
  }

  const allTaskIds = task.day.tasks.map((t) => t.id);
  const completedCount = await prisma.questTaskCompletion.count({
    where: { profileId: profile.id, taskId: { in: allTaskIds } },
  });
  const dayNowComplete = completedCount === allTaskIds.length;

  const existingDayCompletion = await prisma.questDayCompletion.findUnique({
    where: { profileId_dayId: { profileId: profile.id, dayId: task.dayId } },
  });

  if (dayNowComplete && !existingDayCompletion) {
    await prisma.questDayCompletion.create({ data: { profileId: profile.id, dayId: task.dayId } });
  } else if (!dayNowComplete && existingDayCompletion) {
    await prisma.questDayCompletion.delete({ where: { id: existingDayCompletion.id } });
  }

  revalidatePath(`/academy/${task.day.dayNumber}`);
  revalidatePath("/academy");
}
