import Link from "next/link";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import type { LeaderboardRow, Trend } from "@/lib/algorithms/leaderboard";

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_ROW_TINT = [
  "bg-amber-50/60 dark:bg-amber-950/10",
  "bg-slate-50/60 dark:bg-slate-900/20",
  "bg-orange-50/50 dark:bg-orange-950/10",
];

function TrendIndicator({ trend }: { trend: Trend | undefined }) {
  if (!trend || trend.direction === "new") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        New
      </Badge>
    );
  }
  if (trend.direction === "flat") {
    return <Minus className="size-4 text-muted-foreground" />;
  }
  const isUp = trend.direction === "up";
  const Icon = isUp ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        isUp ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
      )}
    >
      <Icon className="size-3.5" />
      {Math.abs(trend.rankDelta ?? 0)}
    </span>
  );
}

export function LeaderboardTable({
  rows,
  trends,
}: {
  rows: LeaderboardRow[];
  trends: Map<string, Trend>;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        description="Complete a few matches in this period to see the leaderboard fill in."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">P</TableHead>
            <TableHead className="text-right">W</TableHead>
            <TableHead className="text-right">L</TableHead>
            <TableHead className="text-right">PD</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const isPodium = i < 3;
            return (
              <TableRow key={row.profileId} className={cn(isPodium && PODIUM_ROW_TINT[i])}>
                <TableCell className="text-center text-muted-foreground">
                  {isPodium ? MEDALS[i] : row.rank}
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/players/${row.profileId}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <PlayerAvatar name={row.name} />
                    <span className="truncate">{row.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.played}</TableCell>
                <TableCell className="text-right tabular-nums">{row.won}</TableCell>
                <TableCell className="text-right tabular-nums">{row.lost}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-medium tabular-nums">
                      {row.pointDifference > 0 ? `+${row.pointDifference}` : row.pointDifference}
                    </span>
                    <TrendIndicator trend={trends.get(row.profileId)} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
