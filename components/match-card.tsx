"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScoreEntryDialog } from "@/components/score-entry-dialog";
import { MatchStatus } from "@/types";
import { Trophy } from "lucide-react";

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
}

export function MatchCard({ match }: { match: MatchCardData }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isCompleted = match.status === MatchStatus.COMPLETED;

  return (
    <>
      <Card className="flex-row items-center justify-between gap-3 p-4">
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

        {!isCompleted && (
          <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setDialogOpen(true)}>
            Enter Score
          </Button>
        )}
      </Card>

      <ScoreEntryDialog
        matchId={match.id}
        player1Name={match.player1Name}
        player2Name={match.player2Name}
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
