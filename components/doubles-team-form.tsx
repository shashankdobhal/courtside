"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { doublesTeamSchema, type DoublesTeamInput } from "@/lib/validations";
import { createDoublesTeam } from "@/lib/actions/doubles";
import { PlayerPickerCombobox } from "@/components/player-picker-combobox";
import { Loader2, UsersRound } from "lucide-react";

const emptyTeam: DoublesTeamInput = {
  player1: { name: "", profileId: undefined },
  player2: { name: "", profileId: undefined },
};

export function DoublesTeamForm({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DoublesTeamInput>({
    resolver: zodResolver(doublesTeamSchema),
    defaultValues: emptyTeam,
  });

  const onSubmit = (data: DoublesTeamInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await createDoublesTeam(tournamentId, data);
        toast.success("Team added");
        reset(emptyTeam);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error("Failed to add team");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Controller
          control={control}
          name="player1"
          render={({ field }) => (
            <PlayerPickerCombobox
              value={{ name: field.value.name, profileId: field.value.profileId }}
              onChange={field.onChange}
              placeholder="First player"
              autoFocus
            />
          )}
        />
        {errors.player1?.name && (
          <p className="text-sm text-destructive">{errors.player1.name.message}</p>
        )}
        <Controller
          control={control}
          name="player2"
          render={({ field }) => (
            <PlayerPickerCombobox
              value={{ name: field.value.name, profileId: field.value.profileId }}
              onChange={field.onChange}
              placeholder="Second player"
            />
          )}
        />
        {errors.player2?.name && (
          <p className="text-sm text-destructive">{errors.player2.name.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <UsersRound className="size-4" />}
        Add Team
      </Button>
    </form>
  );
}
