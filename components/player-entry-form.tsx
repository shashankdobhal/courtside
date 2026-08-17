"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { playersSchema } from "@/lib/validations";
import { setupPlayersAndFixtures } from "@/lib/actions/tournaments";
import { Plus, X, Loader2, Users } from "lucide-react";

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 32;

const formSchema = z.object({ players: playersSchema });
type FormValues = z.infer<typeof formSchema>;

export function PlayerEntryForm({ tournamentId }: { tournamentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      players: [{ name: "" }, { name: "" }, { name: "" }, { name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "players" });

  const onSubmit = (data: FormValues) => {
    setServerError(null);
    const names = data.players.map((p) => p.name);
    startTransition(async () => {
      try {
        await setupPlayersAndFixtures(tournamentId, names);
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        setServerError("Something went wrong. Please try again.");
        toast.error("Failed to generate fixtures");
      }
    });
  };

  const playersError = errors.players?.root?.message ?? errors.players?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
                {index + 1}
              </div>
              <Input
                placeholder="Player Name"
                className="h-11 text-base"
                autoFocus={index === 0}
                {...register(`players.${index}.name` as const)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(index)}
                disabled={fields.length <= MIN_PLAYERS}
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
        ))}
      </div>

      {typeof playersError === "string" && (
        <p className="text-sm text-destructive">{playersError}</p>
      )}
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        onClick={() => append({ name: "" })}
        disabled={fields.length >= MAX_PLAYERS}
      >
        <Plus className="size-4" />
        Add Player
        <span className="text-muted-foreground">
          ({fields.length}/{MAX_PLAYERS})
        </span>
      </Button>

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
        Generate Fixtures
      </Button>
    </form>
  );
}
