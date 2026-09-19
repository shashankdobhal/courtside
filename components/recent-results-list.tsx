import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/format";

export type RecentResult = {
  id: string;
  name: string;
  date: Date;
  isChampion: boolean;
  subtext: string;
};

export function RecentResultsList({ results }: { results: RecentResult[] }) {
  return (
    <div className="space-y-2.5">
      {results.map((result) => (
        <div
          key={result.id}
          className="flex items-center justify-between gap-3 rounded-2xl border bg-background p-4"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {result.isChampion && <Trophy className="size-4 shrink-0 text-amber-500" />}
              <h3 className="truncate font-semibold">{result.name}</h3>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Badge variant={result.isChampion ? "default" : "secondary"} className="h-4.5">
                {result.isChampion ? "Champion" : "Completed"}
              </Badge>
              · {formatDate(result.date)} · {result.subtext}
            </p>
          </div>
          <Link
            href={`/tournaments/${result.id}`}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ))}
    </div>
  );
}
