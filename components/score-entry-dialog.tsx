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
import { scoreEntrySchema, gameScoreSchema, type ScoreEntryInput, type GameScoreInput } from "@/lib/validations";
import { submitScore, submitBestOfThreeScore } from "@/lib/actions/matches";
import { PlayerAvatar } from "@/components/player-avatar";
import { Loader2, Pencil } from "lucide-react";

function decidedWinner(games: GameScoreInput[]): 1 | 2 | null {
  const player1Wins = games.filter((g) => g.score1 > g.score2).length;
  const player2Wins = games.filter((g) => g.score2 > g.score1).length;
  if (player1Wins >= 2) return 1;
  if (player2Wins >= 2) return 2;
  return null;
}

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
  const [step, setStep] = useState(1);
  const [games, setGames] = useState<GameScoreInput[]>(initialGames);
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
  const gameForm = useForm<GameScoreInput>({ resolver: zodResolver(gameScoreSchema) });

  useEffect(() => {
    if (open) {
      setBestOfThree(initialIsBestOfThree);
      setStep(1);
      setGames(initialGames);
      singleForm.reset({
        score1: initialScore1 ?? undefined,
        score2: initialScore2 ?? undefined,
      });
      gameForm.reset(initialGames[0]);
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Loads whichever game's existing value (if any) into the form each time
  // the active step changes, so stepping back to edit a game re-shows it.
  useEffect(() => {
    gameForm.reset(games[step - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const saveBestOfThree = (finalGames: GameScoreInput[]) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await submitBestOfThreeScore(matchId, finalGames);
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

  const onSubmitGameStep = (data: GameScoreInput) => {
    const updated = [...games.slice(0, step - 1), data];
    setGames(updated);

    if (step === 1) {
      setStep(2);
    } else if (step === 2 && decidedWinner(updated) === null) {
      setStep(3);
    } else {
      saveBestOfThree(updated);
    }
  };

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

  const closeDialog = (next: boolean) => {
    if (isPending) return;
    onOpenChange(next);
    if (!next) {
      singleForm.reset();
      gameForm.reset();
    }
  };

  const boErrors = gameForm.formState.errors;
  const singleErrors = singleForm.formState.errors;

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
              onChange={(e) => {
                const checked = e.target.checked;
                setBestOfThree(checked);
                if (checked) {
                  setStep(1);
                  setGames(initialGames);
                  gameForm.reset(initialGames[0]);
                }
              }}
            />
            Best of 3
          </label>
        )}

        {bestOfThree ? (
          <form onSubmit={gameForm.handleSubmit(onSubmitGameStep)} className="space-y-4">
            {games.slice(0, step - 1).map((g, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">Game {i + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">
                    {g.score1}-{g.score2}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(i + 1)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Edit game ${i + 1}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <p className="text-sm font-medium">Game {step}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="game-score1" className="items-center gap-2 truncate">
                    <PlayerAvatar name={player1Name} />
                    {player1Name}
                  </Label>
                  <Input
                    id="game-score1"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={99}
                    autoFocus
                    className="h-12 text-center text-lg"
                    {...gameForm.register("score1", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="game-score2" className="items-center gap-2 truncate">
                    <PlayerAvatar name={player2Name} />
                    {player2Name}
                  </Label>
                  <Input
                    id="game-score2"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={99}
                    className="h-12 text-center text-lg"
                    {...gameForm.register("score2", { valueAsNumber: true })}
                  />
                </div>
              </div>
              {boErrors.score2 && <p className="text-xs text-destructive">{boErrors.score2.message}</p>}
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <DialogFooter>
              <Button type="submit" size="lg" className="h-11 w-full" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {step === 3 ? "Save" : "Next"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={singleForm.handleSubmit(onSubmitSingle)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="score1" className="items-center gap-2 truncate">
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
                <Label htmlFor="score2" className="items-center gap-2 truncate">
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
