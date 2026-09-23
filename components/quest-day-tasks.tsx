"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleQuestTaskCompletion } from "@/lib/actions/quests";
import { questTaskTypeLabel } from "@/lib/quest-display";
import { cn } from "@/lib/utils";

export interface QuestTaskItem {
  id: string;
  taskType: string;
  instruction: string;
  repetitions: number | null;
  sets: number | null;
}

export function QuestDayTasks({
  tasks,
  initiallyCompletedTaskIds,
  canComplete,
}: {
  tasks: QuestTaskItem[];
  initiallyCompletedTaskIds: string[];
  canComplete: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(() => new Set(initiallyCompletedTaskIds));
  const [, startTransition] = useTransition();

  const toggle = (taskId: string) => {
    if (!canComplete) return;
    const wasCompleted = completed.has(taskId);
    setCompleted((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(taskId);
      else next.add(taskId);
      return next;
    });

    startTransition(async () => {
      try {
        await toggleQuestTaskCompletion(taskId);
        router.refresh();
      } catch (err) {
        setCompleted((prev) => {
          const next = new Set(prev);
          if (wasCompleted) next.add(taskId);
          else next.delete(taskId);
          return next;
        });
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const isDone = completed.has(task.id);
        const detail = [
          task.repetitions ? `${task.repetitions} rep${task.repetitions === 1 ? "" : "s"}` : null,
          task.sets && task.sets > 1 ? `${task.sets} sets` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <label
            key={task.id}
            className={cn(
              "flex items-start gap-3 rounded-2xl border bg-background p-4 transition-colors",
              canComplete && "cursor-pointer hover:bg-accent",
              isDone && "border-primary/30 bg-primary/5"
            )}
          >
            <Checkbox
              checked={isDone}
              disabled={!canComplete}
              onCheckedChange={() => toggle(task.id)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {questTaskTypeLabel[task.taskType] ?? task.taskType}
              </p>
              <p className={cn("text-sm", isDone && "text-muted-foreground line-through")}>
                {task.instruction}
              </p>
              {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
            </div>
          </label>
        );
      })}
    </div>
  );
}
