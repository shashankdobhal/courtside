"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { activateDoublesSession } from "@/lib/actions/doubles";
import { Loader2, Play } from "lucide-react";

export function ActivateDoublesSessionButton({
  tournamentId,
  canActivate,
  minTeams,
}: {
  tournamentId: string;
  canActivate: boolean;
  minTeams: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleActivate = () => {
    startTransition(async () => {
      try {
        await activateDoublesSession(tournamentId);
        router.push(`/tournaments/${tournamentId}`);
      } catch (err) {
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
        onClick={handleActivate}
        disabled={isPending || !canActivate}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        Activate Session
      </Button>
      {!canActivate && (
        <p className="text-center text-sm text-muted-foreground">
          At least {minTeams} teams are required to start.
        </p>
      )}
    </div>
  );
}
