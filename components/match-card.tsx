"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScoreEntryDialog } from "@/components/score-entry-dialog";
import { PlayerAvatar } from "@/components/player-avatar";
import { MatchStatus, Round } from "@/types";
import { Pencil, Trophy, Ban } from "lucide-react";

export interface MatchCardData {
  id: string;
  round: string;
  player1Name: string;
  player2Name: string;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  player1Id: string;
  player2Id: string;
  status: string;
  canEdit: boolean;
  isBestOfThree: boolean;
  game1Score1: number | null;
  game1Score2: number | null;
  game2Score1: number | null;
  game2Score2: number | null;
  game3Score1: number | null;
  game3Score2: number | null;
}

export function MatchCard({
  match,
  readOnly = false,
  index = 0,
}: {
  match: MatchCardData;
  readOnly?: boolean;
  index?: number;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isCompleted = match.status === MatchStatus.COMPLETED;
  const isVoid = match.status === MatchStatus.VOID;
  // A knockout bracket bye: no second player, auto-completed with no game
  // played — nothing to score or edit.
  const isBye = !match.player2Id;
  const canEdit = !readOnly && match.canEdit && !isBye;

  return (
    <>
      <Card
        className={cn(
          "flex-row items-center justify-between gap-3 p-4 duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
          isVoid && "border-dashed opacity-60"
        )}
        style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <PlayerLabel
              name={match.player1Name}
              score={match.score1}
              isWinner={isCompleted && match.winnerId === match.player1Id}
            />
            <span className="mt-0.5 shrink-0 text-xs font-medium text-muted-foreground">vs</span>
            {isBye ? (
              <span className="mt-0.5 shrink-0 text-sm text-muted-foreground italic">Bye</span>
            ) : (
              <PlayerLabel
                name={match.player2Name}
                score={match.score2}
                isWinner={isCompleted && match.winnerId === match.player2Id}
                align="right"
              />
            )}
          </div>
          {isCompleted && match.isBestOfThree && (
            <p className="text-center text-xs text-muted-foreground">{gameBreakdown(match)}</p>
          )}
        </div>

        {isVoid && (
          <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
            <Ban className="size-3" />
            Voided
          </Badge>
        )}
        {isBye && (
          <Badge variant="outline" className="shrink-0 text-muted-foreground">
            Advanced
          </Badge>
        )}
        {canEdit && !isCompleted && !isVoid && (
          <Button size="sm" className="shrink-0" onClick={() => setDialogOpen(true)}>
            Enter Score
          </Button>
        )}
        {canEdit && isCompleted && (
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0"
            onClick={() => setDialogOpen(true)}
            aria-label="Edit score"
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        )}
      </Card>

      <ScoreEntryDialog
        matchId={match.id}
        player1Name={match.player1Name}
        player2Name={match.player2Name}
        initialScore1={match.score1}
        initialScore2={match.score2}
        allowBestOfThree={match.round !== Round.LEAGUE}
        initialIsBestOfThree={match.isBestOfThree}
        initialGames={gamesFromMatch(match)}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

function gamesFromMatch(match: MatchCardData): { score1: number; score2: number }[] {
  const games: { score1: number; score2: number }[] = [];
  if (match.game1Score1 !== null && match.game1Score2 !== null) {
    games.push({ score1: match.game1Score1, score2: match.game1Score2 });
  }
  if (match.game2Score1 !== null && match.game2Score2 !== null) {
    games.push({ score1: match.game2Score1, score2: match.game2Score2 });
  }
  if (match.game3Score1 !== null && match.game3Score2 !== null) {
    games.push({ score1: match.game3Score1, score2: match.game3Score2 });
  }
  return games;
}

function gameBreakdown(match: MatchCardData): string {
  return gamesFromMatch(match)
    .map((g) => `${g.score1}-${g.score2}`)
    .join(" · ");
}

function PlayerLabel({
  name,
  score,
  isWinner,
  align = "left",
}: {
  name: string;
  score: number | null;
  isWinner: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-start gap-2",
        align === "right" && "flex-row-reverse text-right"
      )}
    >
      <PlayerAvatar
        name={name}
        className={cn("mt-0.5", isWinner && "ring-2 ring-amber-400 ring-offset-1")}
      />
      {/* No truncate: short names stay on one line, long ones wrap to a
          second instead of losing characters to an ellipsis. */}
      <span
        className={cn(
          "min-w-0 flex-1 text-sm break-words",
          isWinner ? "font-semibold" : "text-foreground"
        )}
      >
        {name}
      </span>
      {isWinner && <Trophy className="mt-0.5 size-3.5 shrink-0 text-amber-500" />}
      {score !== null && (
        <span
          className={cn(
            "mt-0.5 shrink-0 text-sm tabular-nums",
            isWinner ? "font-semibold" : "text-muted-foreground"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}
