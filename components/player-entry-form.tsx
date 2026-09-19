"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { playerNameSchema, MAX_PLAYERS } from "@/lib/validations";
import { addPlayers } from "@/lib/actions/tournaments";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerPickerCombobox } from "@/components/player-picker-combobox";
import { Plus, X, Loader2, UserPlus } from "lucide-react";

const formSchema = z.object({
  players: z
    .array(z.object({ name: playerNameSchema, profileId: z.string().optional() }))
    .min(1, "Add at least one player")
    .max(MAX_PLAYERS, `Maximum ${MAX_PLAYERS} players allowed`)
    .superRefine((players, ctx) => {
      const seen = new Map<string, number>();
      players.forEach((p, i) => {
        const key = p.name.trim().toLowerCase();
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Duplicate player name",
            path: [i, "name"],
          });
        } else {
          seen.set(key, i);
        }
      });
    }),
});
type FormValues = z.infer<typeof formSchema>;

const emptyRow = { name: "", profileId: undefined };

export function PlayerEntryForm({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { players: [emptyRow] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "players" });

  const onSubmit = (data: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await addPlayers(tournamentId, data.players);
        toast.success(data.players.length === 1 ? "Player added" : "Players added");
        reset({ players: [emptyRow] });
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error("Failed to add players");
      }
    });
  };

  const playersError = errors.players?.root?.message ?? errors.players?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        {fields.map((field, index) => {
          const liveName = watch(`players.${index}.name`);
          return (
          <div key={field.id} className="space-y-1">
            <div className="flex items-center gap-2">
              {liveName?.trim() ? (
                <div className="flex size-11 shrink-0 items-center justify-center">
                  <PlayerAvatar name={liveName} size="md" className="duration-150 animate-in zoom-in-75" />
                </div>
              ) : (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>
              )}
              <Controller
                control={control}
                name={`players.${index}`}
                render={({ field }) => (
                  <PlayerPickerCombobox
                    value={{ name: field.value.name, profileId: field.value.profileId }}
                    onChange={field.onChange}
                    placeholder="Player Name"
                    autoFocus={index === 0}
                  />
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(index)}
                disabled={fields.length <= 1}
                aria-label="Remove player"
              >
                <X className="size-4" />
              </Button>
            </div>
            {errors.players?.[index]?.name && (
              <p className="pl-[52px] text-sm text-destructive">
                {errors.players[index]?.name?.message}
              </p>
            )}
          </div>
          );
        })}
      </div>

      {typeof playersError === "string" && (
        <p className="text-sm text-destructive">{playersError}</p>
      )}
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        onClick={() => append(emptyRow)}
        disabled={fields.length >= MAX_PLAYERS}
      >
        <Plus className="size-4" />
        Add Row
        <span className="text-muted-foreground">
          ({fields.length}/{MAX_PLAYERS})
        </span>
      </Button>

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        Add Players
      </Button>
    </form>
  );
}
