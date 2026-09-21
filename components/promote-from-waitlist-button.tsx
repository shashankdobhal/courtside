"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { promoteFromWaitlist } from "@/lib/actions/players";
import { Loader2, ArrowUpToLine } from "lucide-react";

export function PromoteFromWaitlistButton({
  playerId,
  playerName,
}: {
  playerId: string;
  playerName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        await promoteFromWaitlist(playerId);
        toast.success(`${playerName} moved to the roster`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="shrink-0"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUpToLine className="size-3.5" />}
      Move to roster
    </Button>
  );
}
