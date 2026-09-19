"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setSeasonOptIn } from "@/lib/actions/player-profiles";
import { Loader2, ListOrdered } from "lucide-react";

export function SeasonOptInToggle({
  profileId,
  optedIn,
}: {
  profileId: string;
  optedIn: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await setSeasonOptIn(profileId, !optedIn);
        toast.success(optedIn ? "You're off the leaderboard" : "You're on the leaderboard");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        toast.error(message);
      }
    });
  };

  return (
    <Button size="sm" variant={optedIn ? "secondary" : "outline"} onClick={handleToggle} disabled={isPending}>
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ListOrdered className="size-3.5" />}
      {optedIn ? "On the leaderboard" : "Not on the leaderboard"}
    </Button>
  );
}
