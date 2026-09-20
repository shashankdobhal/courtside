"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateFixturesAndActivate } from "@/lib/actions/tournaments";
import { Loader2, Users } from "lucide-react";

export function GenerateFixturesButton({
  tournamentId,
  canGenerate,
  minPlayers,
  entityLabel = "player",
}: {
  tournamentId: string;
  canGenerate: boolean;
  minPlayers: number;
  /** "player" or "team" — doubles fixtures are generated from teams, not individuals. */
  entityLabel?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        await generateFixturesAndActivate(tournamentId);
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        toast.error(message);
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="h-12 w-full text-base"
        onClick={handleGenerate}
        disabled={isPending || !canGenerate}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
        Generate Fixtures
      </Button>
      {!canGenerate && (
        <p className="text-center text-sm text-muted-foreground">
          At least {minPlayers} {entityLabel}
          {minPlayers === 1 ? "" : "s"} are required to generate fixtures.
        </p>
      )}
    </div>
  );
}
