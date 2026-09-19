"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScoreEntryDialog } from "@/components/score-entry-dialog";
import { PlayerAvatar } from "@/components/player-avatar";
import { MatchStatus } from "@/types";
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
  const canEdit = !readOnly && match.canEdit;

  return (
    <>
      <Card
        className={cn(
          "flex-row items-center justify-between gap-3 p-4 duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
          isVoid && "border-dashed opacity-60"
        )}
        style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      >
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <PlayerLabel
            name={match.player1Name}
            score={match.score1}
            isWinner={isCompleted && match.winnerId === match.player1Id}
          />
          <span className="shrink-0 text-xs font-medium text-muted-foreground">vs</span>
          <PlayerLabel
            name={match.player2Name}
            score={match.score2}
            isWinner={isCompleted && match.winnerId === match.player2Id}
            align="right"
          />
        </div>

        {isVoid && (
          <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
            <Ban className="size-3" />
            Voided
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
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
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
        "flex min-w-0 flex-1 items-center gap-1.5",
        align === "right" && "flex-row-reverse text-right"
      )}
    >
      <PlayerAvatar name={name} className={cn(isWinner && "ring-2 ring-amber-400 ring-offset-1")} />
      {isWinner && <Trophy className="size-3.5 shrink-0 text-amber-500" />}
      <span className={cn("truncate text-sm", isWinner ? "font-semibold" : "text-foreground")}>
        {name}
      </span>
      {score !== null && (
        <span className={cn("shrink-0 text-sm tabular-nums", isWinner ? "font-semibold" : "text-muted-foreground")}>
          {score}
        </span>
      )}
    </div>
  );
}
