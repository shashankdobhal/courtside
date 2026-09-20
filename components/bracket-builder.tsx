"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { bracketSizeFor } from "@/lib/algorithms/bracket";
import { generateKnockoutBracket } from "@/lib/actions/tournaments";
import { displayName } from "@/utils/format";
import { Shuffle, RotateCcw, Loader2 } from "lucide-react";

interface BracketPlayer {
  id: string;
  name: string;
  alias?: string | null;
}

export function BracketBuilder({
  tournamentId,
  players,
  entityLabel = "player",
}: {
  tournamentId: string;
  players: BracketPlayer[];
  /** "player" or "team" — doubles brackets place teams, not individuals. */
  entityLabel?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const bracketSize = bracketSizeFor(players.length);

  const [slots, setSlots] = useState<(string | null)[]>(() => Array(bracketSize).fill(null));
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const placedIds = useMemo(() => new Set(slots.filter((id): id is string => id !== null)), [slots]);
  const unplaced = players.filter((p) => !placedIds.has(p.id));

  const hasDoubleByePair = useMemo(() => {
    for (let i = 0; i < slots.length; i += 2) {
      if (slots[i] === null && slots[i + 1] === null) return true;
    }
    return false;
  }, [slots]);
  const canGenerate = unplaced.length === 0 && !hasDoubleByePair;

  const placeSelected = (slotIndex: number) => {
    if (!selectedPlayerId) return;
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = selectedPlayerId;
      return next;
    });
    setSelectedPlayerId(null);
  };

  const clearSlot = (slotIndex: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const shuffleRemaining = () => {
    setSlots((prev) => {
      const currentlyPlaced = new Set(prev.filter((id): id is string => id !== null));
      const toPlace = players.filter((p) => !currentlyPlaced.has(p.id));
      const emptyIndexes = prev.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);
      const byeCount = emptyIndexes.length - toPlace.length;

      // Choose which empty slots stay byes first, at most one per match pair
      // (bracketSizeFor guarantees byeCount is always < the number of pairs,
      // so this always succeeds when shuffling from a clean slate; a very
      // unusual partial manual placement could still leave two empties in
      // the same pair — the existing warning below catches that either way).
      const shuffledEmpty = [...emptyIndexes].sort(() => Math.random() - 0.5);
      const chosenByes: number[] = [];
      const usedPairs = new Set<number>();
      for (const idx of shuffledEmpty) {
        if (chosenByes.length >= byeCount) break;
        const pairIndex = Math.floor(idx / 2);
        if (usedPairs.has(pairIndex)) continue;
        chosenByes.push(idx);
        usedPairs.add(pairIndex);
      }

      const fillIndexes = emptyIndexes.filter((i) => !chosenByes.includes(i));
      const shuffledPlayers = [...toPlace].sort(() => Math.random() - 0.5);
      const next = [...prev];
      fillIndexes.forEach((idx, i) => {
        next[idx] = shuffledPlayers[i]?.id ?? null;
      });
      return next;
    });
    setSelectedPlayerId(null);
  };

  const reset = () => {
    setSlots(Array(bracketSize).fill(null));
    setSelectedPlayerId(null);
  };

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        await generateKnockoutBracket(tournamentId, slots);
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        toast.error(message);
      }
    });
  };

  const byeCount = bracketSize - players.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Build the bracket</h2>
          <p className="text-xs text-muted-foreground">
            {bracketSize}-{entityLabel} bracket
            {byeCount > 0 ? ` · ${byeCount} bye${byeCount === 1 ? "" : "s"}` : ""}. Tap a{" "}
            {entityLabel}, then tap a slot to place them.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={shuffleRemaining}>
            <Shuffle className="size-3.5" />
            Shuffle
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {unplaced.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Unplaced ({unplaced.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unplaced.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlayerId(p.id === selectedPlayerId ? null : p.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  selectedPlayerId === p.id
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border hover:bg-accent"
                )}
              >
                {displayName(p)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: bracketSize / 2 }, (_, matchIndex) => {
          const slotA = matchIndex * 2;
          const slotB = matchIndex * 2 + 1;
          const bothEmpty = slots[slotA] === null && slots[slotB] === null;
          return (
            <div
              key={matchIndex}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-3",
                bothEmpty && "border-destructive/50 bg-destructive/5"
              )}
            >
              <span className="w-14 shrink-0 text-xs text-muted-foreground">Match {matchIndex + 1}</span>
              <div className="flex flex-1 items-center gap-2">
                <BracketSlot
                  playerName={slots[slotA] ? displayName(playersById.get(slots[slotA]!)!) : null}
                  selectable={!!selectedPlayerId}
                  onClick={() => (slots[slotA] ? clearSlot(slotA) : placeSelected(slotA))}
                />
                <span className="shrink-0 text-xs text-muted-foreground">vs</span>
                <BracketSlot
                  playerName={slots[slotB] ? displayName(playersById.get(slots[slotB]!)!) : null}
                  selectable={!!selectedPlayerId}
                  onClick={() => (slots[slotB] ? clearSlot(slotB) : placeSelected(slotB))}
                />
              </div>
            </div>
          );
        })}
      </div>

      {hasDoubleByePair && (
        <p className="text-sm text-destructive">
          Two empty slots can&apos;t be paired together — move a bye so each match has at least one{" "}
          {entityLabel}.
        </p>
      )}

      <Button
        size="lg"
        className="h-12 w-full text-base"
        onClick={handleGenerate}
        disabled={isPending || !canGenerate}
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Generate Bracket
      </Button>
      {!canGenerate && !hasDoubleByePair && (
        <p className="text-center text-sm text-muted-foreground">
          Place every {entityLabel} in a bracket slot to generate the bracket.
        </p>
      )}
    </div>
  );
}

function BracketSlot({
  playerName,
  selectable,
  onClick,
}: {
  playerName: string | null;
  selectable: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 flex-1 truncate rounded-lg border px-3 text-left text-sm transition-colors",
        playerName
          ? "border-border bg-background hover:bg-accent"
          : selectable
            ? "border-primary/60 border-dashed bg-primary/5 text-primary hover:bg-primary/10"
            : "border-dashed border-border text-muted-foreground"
      )}
    >
      {playerName ?? "Bye"}
    </button>
  );
}
