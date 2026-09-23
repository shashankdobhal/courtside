import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getQuestOverview } from "@/lib/actions/quests";
import { getViewerTimeZone } from "@/lib/timezone";
import { signInWithGoogleTo } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { questActivityModeLabel, QUEST_TOTAL_DAYS } from "@/lib/quest-display";
import { GraduationCap, Flame, Check, Lock, ChevronRight } from "lucide-react";

export default async function AcademyPage() {
  const session = await auth();
  const viewerProfile = session?.user?.id
    ? await prisma.playerProfile.findUnique({ where: { userId: session.user.id } })
    : null;

  const timeZone = await getViewerTimeZone();
  const { days, completedCount, unlockedThrough, streak } = await getQuestOverview(
    viewerProfile?.id ?? null,
    timeZone
  );

  const phases = new Map<number, { name: string; days: typeof days }>();
  for (const day of days) {
    const phase = phases.get(day.phaseNumber);
    if (phase) phase.days.push(day);
    else phases.set(day.phaseNumber, { name: day.phaseName, days: [day] });
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:py-12">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Academy</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          The 200 Day Quest — one short lesson a day, beginner to match-ready.
        </p>
      </div>

      {session?.user ? (
        <Card className="mb-8 gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">
              Day {Math.min(unlockedThrough, QUEST_TOTAL_DAYS)} of {QUEST_TOTAL_DAYS}
            </span>
            {streak.current > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Flame className="size-4 text-amber-500" />
                {streak.current} day streak
              </span>
            )}
          </div>
          <Progress value={(completedCount / QUEST_TOTAL_DAYS) * 100} className="h-1.5" />
        </Card>
      ) : (
        <Card className="mb-8 gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">Sign in to start Day 1 and track your streak.</p>
          <form action={signInWithGoogleTo.bind(null, "/academy")}>
            <Button type="submit">Sign in with Google</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {Array.from(phases.entries()).map(([phaseNumber, phase]) => {
          const phaseCompleted = phase.days.filter((d) => d.completed).length;
          const isCurrentPhase = phase.days.some(
            (d) => d.dayNumber === Math.min(unlockedThrough, QUEST_TOTAL_DAYS)
          );

          return (
            <details key={phaseNumber} open={isCurrentPhase} className="group rounded-2xl border bg-background">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    Phase {phaseNumber} · {phase.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {phaseCompleted}/{phase.days.length} days complete
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <div className="space-y-1.5 border-t p-3">
                {phase.days.map((day) => {
                  const showModeBadge = day.activityMode !== "learn" && day.activityMode !== "practice";
                  const rowContent = (
                    <>
                      <span
                        className={
                          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold " +
                          (day.completed
                            ? "bg-primary text-primary-foreground"
                            : day.unlocked
                              ? "bg-muted text-foreground"
                              : "bg-muted text-muted-foreground")
                        }
                      >
                        {day.completed ? (
                          <Check className="size-3.5" />
                        ) : day.unlocked ? (
                          day.dayNumber
                        ) : (
                          <Lock className="size-3" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className={
                              "truncate text-sm " +
                              (day.unlocked ? "font-medium" : "text-muted-foreground")
                            }
                          >
                            {day.questTitle}
                          </span>
                          {showModeBadge && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {questActivityModeLabel[day.activityMode] ?? day.activityMode}
                            </Badge>
                          )}
                        </span>
                      </span>
                    </>
                  );

                  return day.unlocked ? (
                    <Link
                      key={day.id}
                      href={`/academy/${day.dayNumber}`}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-accent"
                    >
                      {rowContent}
                    </Link>
                  ) : (
                    <div key={day.id} className="flex items-center gap-3 rounded-xl p-2 opacity-60">
                      {rowContent}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
