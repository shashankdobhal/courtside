import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentCardActions } from "@/components/tournament-card-actions";
import { formatDate } from "@/utils/format";
import { gameFormatLabel, gameHref } from "@/lib/tournament-display";
import { MatchStatus, TournamentStatus, TournamentType } from "@/types";
import { cn } from "@/lib/utils";

type ActiveGameData = {
  id: string;
  name: string;
  format: string;
  type: string;
  status: string;
  createdAt: Date;
  _count: { players: number };
  matches: { status: string }[];
};

export function ActiveGameCard({
  tournament,
  isOwner,
}: {
  tournament: ActiveGameData;
  isOwner: boolean;
}) {
  const isPending = tournament.status === TournamentStatus.PENDING;
  // A casual session has no fixed fixture list, so "N remaining" isn't
  // meaningful — every other tournament (singles or doubles) has generated
  // fixtures and a real count.
  const matchesRemaining =
    tournament.type !== TournamentType.SESSION && !isPending
      ? tournament.matches.filter((m) => m.status === MatchStatus.PENDING).length
      : null;

  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide">
          <span
            className={cn(
              "size-1.5 rounded-full",
              isPending ? "bg-amber-500" : "bg-primary"
            )}
          />
          <span className={cn(isPending ? "text-amber-600" : "text-primary")}>
            {isPending ? "SETTING UP" : "ACTIVE"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{formatDate(tournament.createdAt)}</span>
          {isOwner && (
            <TournamentCardActions tournamentId={tournament.id} status={tournament.status} />
          )}
        </div>
      </div>

      <h3 className="font-heading mt-3 text-xl font-bold tracking-tight">{tournament.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {gameFormatLabel(tournament.format)} · {tournament._count.players} players
      </p>

      {matchesRemaining !== null && (
        <p className="mt-2 text-sm text-muted-foreground">
          {matchesRemaining === 0
            ? "All matches played"
            : `${matchesRemaining} match${matchesRemaining === 1 ? "" : "es"} remaining`}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Button asChild size="sm" variant="secondary">
          <Link href={gameHref(tournament)}>
            {isPending ? "Continue Setup" : "Open"}
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
