import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StandingsRow } from "@/types";

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
          {standings.map((row, i) => (
            <TableRow key={row.player.id}>
              <TableCell className="font-medium">
                <span className="mr-2 text-muted-foreground">{i + 1}</span>
                {row.player.name}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
