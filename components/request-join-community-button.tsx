"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestToJoinCommunity, leaveCommunity } from "@/lib/actions/communities";
import { Loader2 } from "lucide-react";

export function RequestJoinCommunityButton({
  communityId,
  state,
}: {
  communityId: string;
  state: "none" | "pending";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const requested = state === "pending" || sent;

  const handleClick = () => {
    startTransition(async () => {
      try {
        if (requested) {
          await leaveCommunity(communityId);
        } else {
          await requestToJoinCommunity(communityId);
          setSent(true);
        }
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <Button
      type="button"
      variant={requested ? "outline" : "default"}
      size="sm"
      className="shrink-0"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {requested ? "Cancel request" : "Request to join"}
    </Button>
  );
}
