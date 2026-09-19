"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { joinTournament } from "@/lib/actions/players";
import { Loader2, UserPlus } from "lucide-react";

export function JoinTournamentButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleJoin = () => {
    startTransition(async () => {
      try {
        await joinTournament(tournamentId);
        toast.success("You're in!");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        toast.error(message);
      }
    });
  };

  return (
    <Button size="lg" className="h-12 w-full text-base" onClick={handleJoin} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
      Join Tournament
    </Button>
  );
}
