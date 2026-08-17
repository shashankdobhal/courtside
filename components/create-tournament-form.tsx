"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createTournamentSchema, type CreateTournamentInput } from "@/lib/validations";
import { createTournament } from "@/lib/actions/tournaments";
import { TournamentType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Swords, Loader2 } from "lucide-react";

const typeOptions = [
  {
    value: TournamentType.ROUND_ROBIN,
    label: "Everyone Plays Everyone",
    description: "Every player faces every other player once.",
    icon: Users,
  },
  {
    value: TournamentType.ROUND_ROBIN_KNOCKOUT,
    label: "Round Robin + Knockout",
    description: "League stage, then semis and a final.",
    icon: Swords,
  },
];

export function CreateTournamentForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTournamentInput>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: { name: "", type: TournamentType.ROUND_ROBIN },
  });

  const selectedType = watch("type");

  const onSubmit = (data: CreateTournamentInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await createTournament(data);
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        setServerError("Something went wrong. Please try again.");
        toast.error("Failed to create tournament");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Tournament Name</Label>
        <Input
          id="name"
          placeholder="Sunday Smash 2026"
          className="h-12 text-base"
          autoFocus
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Tournament Type</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {typeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue("type", option.value, { shouldValidate: true })}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                  "min-h-28 active:scale-[0.99]",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-accent"
                )}
              >
                <Icon className="size-5" />
                <span className="font-medium leading-tight">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Create
      </Button>
    </form>
  );
}
