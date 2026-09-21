"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { endLivestream, deleteLivestream } from "@/lib/actions/livestreams";
import { Loader2, Trash2 } from "lucide-react";

export function LivestreamAdminControls({ id, isLive }: { id: string; isLive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleEnd = () => {
    startTransition(async () => {
      try {
        await endLivestream(id);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteLivestream(id);
        toast.success("Livestream removed");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="flex shrink-0 items-center gap-1">
      {isLive && (
        <Button type="button" size="sm" variant="outline" onClick={handleEnd} disabled={isPending}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          End
        </Button>
      )}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Delete livestream"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
