import { Progress } from "@/components/ui/progress";

export function TournamentProgress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        {completed} / {total} Matches Completed
      </p>
      <Progress value={pct} />
    </div>
  );
}
