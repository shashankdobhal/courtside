import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate, tournamentStatusLabel } from "@/utils/format";
import { gameFormatLabel, gameHref } from "@/lib/tournament-display";
import type { TournamentStatus } from "@/types";

export type GameHistoryEntry = {
  id: string;
  name: string;
  format: string;
  status: string;
  createdAt: Date;
};

export function GameHistoryList({ games }: { games: GameHistoryEntry[] }) {
  return (
    <div className="divide-y rounded-2xl border bg-background">
      {games.map((game) => (
        <Link
          key={game.id}
          href={gameHref(game)}
          className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{game.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatDate(game.createdAt)} · {gameFormatLabel(game.format)}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
            {tournamentStatusLabel[game.status as TournamentStatus] ?? game.status}
            <ArrowRight className="size-3.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}
