import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getQuestDay } from "@/lib/actions/quests";
import { YoutubeEmbed } from "@/components/youtube-embed";
import { QuestDayTasks } from "@/components/quest-day-tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { questActivityModeLabel, QUEST_TOTAL_DAYS } from "@/lib/quest-display";
import { ArrowLeft, Lock, PartyPopper } from "lucide-react";

export default async function QuestDayPage({
  params,
}: {
  params: Promise<{ dayNumber: string }>;
}) {
  const { dayNumber: dayNumberParam } = await params;
  const dayNumber = Number(dayNumberParam);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > QUEST_TOTAL_DAYS) notFound();

  const session = await auth();
  const viewerProfile = session?.user?.id
    ? await prisma.playerProfile.findUnique({ where: { userId: session.user.id } })
    : null;

  const result = await getQuestDay(dayNumber, viewerProfile?.id ?? null);
  if (!result) notFound();
  const { day, completedTaskIds, unlocked } = result;

  const dayComplete = day.tasks.length > 0 && day.tasks.every((t) => completedTaskIds.has(t.id));
  const showModeBadge = day.activityMode !== "learn" && day.activityMode !== "practice";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:py-12">
      <Link
        href="/academy"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Academy
      </Link>

      {!unlocked ? (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <Lock className="mx-auto mb-3 size-6 text-muted-foreground" />
          <p className="font-medium">Day {dayNumber} is locked</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete the days before it first to unlock this one.
          </p>
          <Button asChild className="mt-4">
            <Link href="/academy">Back to Academy</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
              Phase {day.phaseNumber} · {day.phaseName} · Day {day.dayNumber} of {QUEST_TOTAL_DAYS}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight">{day.questTitle}</h1>
              {showModeBadge && (
                <Badge variant="outline">
                  {questActivityModeLabel[day.activityMode] ?? day.activityMode}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{day.dailyOutcome}</p>
            {day.reviewOfDayNumber && (
              <p className="mt-1 text-sm text-muted-foreground">
                Reinforces{" "}
                <Link href={`/academy/${day.reviewOfDayNumber}`} className="underline underline-offset-2">
                  Day {day.reviewOfDayNumber}
                </Link>
              </p>
            )}
          </div>

          {day.videoUrl && (
            <div className="mb-6 space-y-2">
              <YoutubeEmbed url={day.videoUrl} title={day.videoTitle ?? day.questTitle} />
              {day.videoWatchNote && (
                <p className="text-xs text-muted-foreground">{day.videoWatchNote}</p>
              )}
            </div>
          )}

          {dayComplete && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <PartyPopper className="size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Day {day.dayNumber} complete!</p>
              </div>
              {day.dayNumber < QUEST_TOTAL_DAYS ? (
                <Button asChild size="sm">
                  <Link href={`/academy/${day.dayNumber + 1}`}>Next day</Link>
                </Button>
              ) : (
                <Badge>Quest complete 🎉</Badge>
              )}
            </div>
          )}

          <QuestDayTasks
            tasks={day.tasks}
            initiallyCompletedTaskIds={Array.from(completedTaskIds)}
            canComplete={!!session?.user}
          />

          {!session?.user && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Sign in to check off tasks and track your progress.
            </p>
          )}
        </>
      )}
    </main>
  );
}
