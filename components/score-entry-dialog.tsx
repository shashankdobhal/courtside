"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  scoreEntrySchema,
  bestOfThreeScoreEntrySchema,
  type ScoreEntryInput,
  type BestOfThreeScoreEntryInput,
  type GameScoreInput,
} from "@/lib/validations";
import { submitScore, submitBestOfThreeScore } from "@/lib/actions/matches";
import { PlayerAvatar } from "@/components/player-avatar";
import { Loader2 } from "lucide-react";

export function ScoreEntryDialog({
  matchId,
  player1Name,
  player2Name,
  initialScore1 = null,
  initialScore2 = null,
  allowBestOfThree = false,
  initialIsBestOfThree = false,
  initialGames = [],
  open,
  onOpenChange,
}: {
  matchId: string;
  player1Name: string;
  player2Name: string;
  initialScore1?: number | null;
  initialScore2?: number | null;
  allowBestOfThree?: boolean;
  initialIsBestOfThree?: boolean;
  initialGames?: GameScoreInput[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEditing = initialScore1 !== null && initialScore2 !== null;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [bestOfThree, setBestOfThree] = useState(initialIsBestOfThree);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playScoreSound = () => {
    // A plain Audio object (not a JSX <audio> element) keeps playing to
    // completion even after this dialog closes and unmounts.
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/score.mp3");
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((err) => console.error("score sound blocked:", err));
  };

  const singleForm = useForm<ScoreEntryInput>({ resolver: zodResolver(scoreEntrySchema) });
  const bestOfThreeForm = useForm<BestOfThreeScoreEntryInput>({
    resolver: zodResolver(bestOfThreeScoreEntrySchema),
  });

  useEffect(() => {
    if (open) {
      setBestOfThree(initialIsBestOfThree);
      singleForm.reset({
        score1: initialScore1 ?? undefined,
        score2: initialScore2 ?? undefined,
      });
      bestOfThreeForm.reset({
        game1: initialGames[0],
        game2: initialGames[1],
        game3: initialGames[2],
      });
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmitSingle = (data: ScoreEntryInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await submitScore(matchId, data.score1, data.score2);
        playScoreSound();
        toast.success(isEditing ? "Score updated" : "Score saved");
        onOpenChange(false);
        router.refresh();
      } catch {
        setServerError("Something went wrong. Please try again.");
        toast.error("Failed to save score");
      }
    });
  };

  const onSubmitBestOfThree = (data: BestOfThreeScoreEntryInput) => {
    setServerError(null);
    const games = [data.game1, data.game2, data.game3].filter(
      (g): g is GameScoreInput => !!g
    );
    startTransition(async () => {
      try {
        await submitBestOfThreeScore(matchId, games);
        playScoreSound();
        toast.success(isEditing ? "Score updated" : "Score saved");
        onOpenChange(false);
        router.refresh();
      } catch {
        setServerError("Something went wrong. Please try again.");
        toast.error("Failed to save score");
      }
    });
  };

  const closeDialog = (next: boolean) => {
    if (isPending) return;
    onOpenChange(next);
    if (!next) {
      singleForm.reset();
      bestOfThreeForm.reset();
    }
  };

  const singleErrors = singleForm.formState.errors;
  const boErrors = bestOfThreeForm.formState.errors;

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Score" : "Enter Score"}</DialogTitle>
        </DialogHeader>

        {allowBestOfThree && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={bestOfThree}
              onChange={(e) => setBestOfThree(e.target.checked)}
            />
            Best of 3
          </label>
        )}

        {bestOfThree ? (
          <form onSubmit={bestOfThreeForm.handleSubmit(onSubmitBestOfThree)} className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Game 1</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  autoFocus
                  placeholder={player1Name}
                  className="h-11 text-center text-lg"
                  {...bestOfThreeForm.register("game1.score1", { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder={player2Name}
                  className="h-11 text-center text-lg"
                  {...bestOfThreeForm.register("game1.score2", { valueAsNumber: true })}
                />
              </div>
              {boErrors.game1?.score2 && (
                <p className="text-xs text-destructive">{boErrors.game1.score2.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Game 2</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder={player1Name}
                  className="h-11 text-center text-lg"
                  {...bestOfThreeForm.register("game2.score1", { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder={player2Name}
                  className="h-11 text-center text-lg"
                  {...bestOfThreeForm.register("game2.score2", { valueAsNumber: true })}
                />
              </div>
              {boErrors.game2?.score2 && (
                <p className="text-xs text-destructive">{boErrors.game2.score2.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Game 3 (if needed)</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder={player1Name}
                  className="h-11 text-center text-lg"
                  {...bestOfThreeForm.register("game3.score1", { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder={player2Name}
                  className="h-11 text-center text-lg"
                  {...bestOfThreeForm.register("game3.score2", { valueAsNumber: true })}
                />
              </div>
              {boErrors.game3?.score2 && (
                <p className="text-xs text-destructive">{boErrors.game3.score2.message}</p>
              )}
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <DialogFooter>
              <Button type="submit" size="lg" className="h-11 w-full" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEditing ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={singleForm.handleSubmit(onSubmitSingle)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="score1" className="items-center gap-1.5 truncate">
                  <PlayerAvatar name={player1Name} />
                  {player1Name}
                </Label>
                <Input
                  id="score1"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  autoFocus
                  className="h-12 text-center text-lg"
                  {...singleForm.register("score1", { valueAsNumber: true })}
                />
                {singleErrors.score1 && (
                  <p className="text-xs text-destructive">{singleErrors.score1.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="score2" className="items-center gap-1.5 truncate">
                  <PlayerAvatar name={player2Name} />
                  {player2Name}
                </Label>
                <Input
                  id="score2"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  className="h-12 text-center text-lg"
                  {...singleForm.register("score2", { valueAsNumber: true })}
                />
                {singleErrors.score2 && (
                  <p className="text-xs text-destructive">{singleErrors.score2.message}</p>
                )}
              </div>
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <DialogFooter>
              <Button type="submit" size="lg" className="h-11 w-full" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEditing ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
