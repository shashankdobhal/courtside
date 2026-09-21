"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addSessionMatch } from "@/lib/actions/sessions";
import { X, Loader2, Plus } from "lucide-react";

export interface SessionRosterPlayer {
  id: string;
  name: string;
}

/**
 * Logs one ad-hoc session match: tap a roster player, then tap which side
 * to place them on — same interaction as the knockout BracketBuilder.
 * `sideSize` is 1 for a singles session (pick 1 player per side) or 2 for
 * doubles (pick 2 — the pairing is resolved on the fly, not pre-registered).
 */
export function AddSessionMatchDialog({
  tournamentId,
  roster,
  sideSize,
}: {
  tournamentId: string;
  roster: SessionRosterPlayer[];
  sideSize: 1 | 2;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sideA, setSideA] = useState<string[]>([]);
  const [sideB, setSideB] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const placedIds = new Set([...sideA, ...sideB]);
  const unplaced = roster.filter((p) => !placedIds.has(p.id));
  const canSubmit = sideA.length === sideSize && sideB.length === sideSize;
  const nameFor = (id: string) => roster.find((p) => p.id === id)?.name ?? "Unknown";

  const reset = () => {
    setSideA([]);
    setSideB([]);
    setSelectedId(null);
    setServerError(null);
  };

  const placeSelected = (side: "A" | "B") => {
    if (!selectedId) return;
    const [current, setSide] = side === "A" ? [sideA, setSideA] : [sideB, setSideB];
    if (current.length >= sideSize) return;
    setSide([...current, selectedId]);
    setSelectedId(null);
  };

  const clearFromSide = (side: "A" | "B", id: string) => {
    const setSide = side === "A" ? setSideA : setSideB;
    setSide((current) => current.filter((x) => x !== id));
  };

  const handleSubmit = () => {
    setServerError(null);
    startTransition(async () => {
      try {
        await addSessionMatch(tournamentId, sideA, sideB);
        toast.success("Match added");
        setOpen(false);
        reset();
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error(message);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="h-12 w-full text-base">
          <Plus className="size-4" />
          Add Match
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a match</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {unplaced.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Tap a player, then tap Side A or Side B to place them.
              </p>
              <div className="flex flex-wrap gap-2">
                {unplaced.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm transition-colors",
                      selectedId === p.id
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {(["A", "B"] as const).map((side) => {
              const ids = side === "A" ? sideA : sideB;
              const isFull = ids.length >= sideSize;
              return (
                <div key={side} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => placeSelected(side)}
                    disabled={isFull || !selectedId}
                    className={cn(
                      "min-h-16 w-full space-y-1 rounded-xl border p-3 text-left transition-colors",
                      !isFull && selectedId
                        ? "border-primary/60 border-dashed bg-primary/5 hover:bg-primary/10"
                        : "border-dashed border-border"
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground">Side {side}</p>
                    {ids.length === 0 && (
                      <p className="text-sm text-muted-foreground">Tap a player above</p>
                    )}
                  </button>
                  {ids.map((id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-1 rounded-lg border bg-background px-3 py-2"
                    >
                      <span className="truncate text-sm font-medium">{nameFor(id)}</span>
                      <button
                        type="button"
                        onClick={() => clearFromSide(side, id)}
                        aria-label={`Remove ${nameFor(id)}`}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending} className="w-full">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Add Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
