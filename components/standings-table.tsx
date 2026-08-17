import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlayerAvatar } from "@/components/player-avatar";
import { cn } from "@/lib/utils";
import type { StandingsRow } from "@/types";

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_ROW_TINT = [
  "bg-amber-50/60 dark:bg-amber-950/10",
  "bg-slate-50/60 dark:bg-slate-900/20",
  "bg-orange-50/50 dark:bg-orange-950/10",
];

export function StandingsTable({ standings }: { standings: StandingsRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">P</TableHead>
            <TableHead className="text-right">W</TableHead>
            <TableHead className="text-right">L</TableHead>
            <TableHead className="text-right">PF</TableHead>
            <TableHead className="text-right">PA</TableHead>
            <TableHead className="text-right">PD</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((row, i) => {
            const hasPlayed = standings.some((r) => r.played > 0);
            const isPodium = i < 3 && hasPlayed;
            return (
              <TableRow key={row.player.id} className={cn(isPodium && PODIUM_ROW_TINT[i])}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-center text-muted-foreground">
                      {isPodium ? MEDALS[i] : i + 1}
                    </span>
                    <PlayerAvatar name={row.player.name} />
                    <span className="truncate">{row.player.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.played}</TableCell>
                <TableCell className="text-right tabular-nums">{row.won}</TableCell>
                <TableCell className="text-right tabular-nums">{row.lost}</TableCell>
                <TableCell className="text-right tabular-nums">{row.pointsFor}</TableCell>
                <TableCell className="text-right tabular-nums">{row.pointsAgainst}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {row.pointDifference > 0 ? `+${row.pointDifference}` : row.pointDifference}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
