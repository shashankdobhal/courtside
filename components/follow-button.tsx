"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { followProfile, unfollowProfile } from "@/lib/actions/follows";
import { Loader2 } from "lucide-react";

export function FollowButton({
  profileId,
  initiallyFollowing,
}: {
  profileId: string;
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
          await followProfile(profileId);
        } else {
          await unfollowProfile(profileId);
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
