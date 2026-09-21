"use client";

import { useEffect, useState, useTransition } from "react";
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
import { editTournamentSchema, MAX_PLAYERS, type EditTournamentInput } from "@/lib/validations";
import { updateTournament } from "@/lib/actions/tournaments";
import { toIsoOrEmpty, toDatetimeLocalValue } from "@/utils/format";
import { SkillLevelChecklist } from "@/components/skill-level-checklist";
import type { SkillLevel } from "@/types";
import { Loader2 } from "lucide-react";

export function EditTournamentDialog({
  tournamentId,
  name,
  venue,
  scheduledAt,
  skillLevels,
  playerLimit,
  open,
  onOpenChange,
}: {
  tournamentId: string;
  name: string;
  venue: string | null;
  scheduledAt: Date | null;
  skillLevels: string[];
  playerLimit: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultValues = {
    name,
    venue: venue ?? "",
    scheduledAt: toDatetimeLocalValue(scheduledAt),
    skillLevels: skillLevels as SkillLevel[],
    playerLimit: playerLimit ?? undefined,
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditTournamentInput>({
    resolver: zodResolver(editTournamentSchema),
    defaultValues,
  });

  const selectedSkillLevels = watch("skillLevels") ?? [];

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name, venue, scheduledAt, skillLevels, playerLimit, reset]);

  const onSubmit = (data: EditTournamentInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await updateTournament(tournamentId, {
          ...data,
          scheduledAt: toIsoOrEmpty(data.scheduledAt ?? ""),
        });
        toast.success("Tournament updated");
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error("Failed to update tournament");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Tournament</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tournament-name">Name</Label>
            <Input id="tournament-name" className="h-11 text-base" autoFocus {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tournament-venue">Venue</Label>
            <Input
              id="tournament-venue"
              placeholder="e.g. Sportyzo Academy"
              className="h-11 text-base"
              {...register("venue")}
            />
            {errors.venue && <p className="text-sm text-destructive">{errors.venue.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tournament-scheduled-at">Date &amp; time</Label>
            <Input
              id="tournament-scheduled-at"
              type="datetime-local"
              className="h-11 text-base"
              {...register("scheduledAt")}
            />
            {errors.scheduledAt && (
              <p className="text-sm text-destructive">{errors.scheduledAt.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Level</Label>
            <SkillLevelChecklist
              value={selectedSkillLevels}
              onChange={(next) => setValue("skillLevels", next, { shouldValidate: true })}
              idPrefix="edit-level"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tournament-player-limit">Player limit</Label>
            <Input
              id="tournament-player-limit"
              type="number"
              min={2}
              max={MAX_PLAYERS}
              placeholder="e.g. 6"
              className="h-11 text-base"
              {...register("playerLimit", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
            {errors.playerLimit ? (
              <p className="text-sm text-destructive">{errors.playerLimit.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Raising this promotes the earliest waitlisted players automatically.
              </p>
            )}
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
