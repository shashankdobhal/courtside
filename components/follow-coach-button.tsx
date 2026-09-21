"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { followCoach, unfollowCoach } from "@/lib/actions/coaches";
import { Loader2 } from "lucide-react";

export function FollowCoachButton({
  coachProfileId,
  initiallyFollowing,
}: {
  coachProfileId: string;
  initiallyFollowing: boolean;
}) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !isFollowing;
    setIsFollowing(next);
    startTransition(async () => {
      try {
        if (next) {
          await followCoach(coachProfileId);
        } else {
          await unfollowCoach(coachProfileId);
        }
        router.refresh();
      } catch (err) {
        setIsFollowing(!next);
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <Button
      type="button"
      variant={isFollowing ? "outline" : "default"}
      size="lg"
      className="h-11"
      onClick={toggle}
      disabled={isPending}
    >
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
