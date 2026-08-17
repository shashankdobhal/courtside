"use client";

import { useState, useTransition } from "react";
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
import { scoreEntrySchema, type ScoreEntryInput } from "@/lib/validations";
import { submitScore } from "@/lib/actions/matches";
import { PlayerAvatar } from "@/components/player-avatar";
import { Loader2 } from "lucide-react";

export function ScoreEntryDialog({
  matchId,
  player1Name,
  player2Name,
  open,
  onOpenChange,
}: {
  matchId: string;
  player1Name: string;
  player2Name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScoreEntryInput>({
    resolver: zodResolver(scoreEntrySchema),
  });

  const onSubmit = (data: ScoreEntryInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await submitScore(matchId, data.score1, data.score2);
        toast.success("Score saved");
        reset();
        onOpenChange(false);
        router.refresh();
      } catch {
        setServerError("Something went wrong. Please try again.");
        toast.error("Failed to save score");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) {
          onOpenChange(next);
          if (!next) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enter Score</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                {...register("score1", { valueAsNumber: true })}
              />
              {errors.score1 && (
                <p className="text-xs text-destructive">{errors.score1.message}</p>
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
                {...register("score2", { valueAsNumber: true })}
              />
              {errors.score2 && (
                <p className="text-xs text-destructive">{errors.score2.message}</p>
              )}
            </div>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter>
            <Button type="submit" size="lg" className="h-11 w-full" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
