import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { QUEST_TOTAL_DAYS } from "@/lib/quest-display";
import { Flame, Milestone } from "lucide-react";

export function QuestContinueCard({
  completedCount,
  unlockedThrough,
  streakCurrent,
}: {
  completedCount: number;
  unlockedThrough: number;
  streakCurrent: number;
}) {
  const isComplete = unlockedThrough > QUEST_TOTAL_DAYS;
  const nextDay = Math.min(unlockedThrough, QUEST_TOTAL_DAYS);

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Milestone className="size-4 text-primary" />
          {isComplete ? "Academy complete!" : `Day ${nextDay} of ${QUEST_TOTAL_DAYS}`}
        </div>
        {streakCurrent > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Flame className="size-4 text-amber-500" />
            {streakCurrent} day streak
          </span>
        )}
      </div>
      <Progress value={(completedCount / QUEST_TOTAL_DAYS) * 100} className="h-1.5" />
      <Button asChild size="sm" className="mt-1 w-full">
        <Link href={isComplete ? "/academy" : `/academy/${nextDay}`}>
          {isComplete ? "View Academy" : "Continue"}
        </Link>
      </Button>
    </Card>
  );
}
