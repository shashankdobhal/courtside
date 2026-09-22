"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveMembership, removeMembership, nominateAdmin } from "@/lib/actions/communities";
import { Check, X, ShieldPlus, Loader2 } from "lucide-react";

function useMembershipAction(action: (membershipId: string) => Promise<void>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (membershipId: string) => {
    startTransition(async () => {
      try {
        await action(membershipId);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return { run, isPending };
}

export function PendingRequestActions({ membershipId }: { membershipId: string }) {
  const approve = useMembershipAction(approveMembership);
  const decline = useMembershipAction(removeMembership);
  const isPending = approve.isPending || decline.isPending;

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Approve"
        disabled={isPending}
        onClick={() => approve.run(membershipId)}
      >
        {approve.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-muted-foreground"
        aria-label="Decline"
        disabled={isPending}
        onClick={() => decline.run(membershipId)}
      >
        {decline.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
      </Button>
    </div>
  );
}

export function MemberActions({ membershipId }: { membershipId: string }) {
  const nominate = useMembershipAction(nominateAdmin);
  const remove = useMembershipAction(removeMembership);
  const isPending = nominate.isPending || remove.isPending;

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-muted-foreground"
        aria-label="Make admin"
        disabled={isPending}
        onClick={() => nominate.run(membershipId)}
      >
        {nominate.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ShieldPlus className="size-3.5" />
        )}
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-muted-foreground"
        aria-label="Remove"
        disabled={isPending}
        onClick={() => remove.run(membershipId)}
      >
        {remove.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
      </Button>
    </div>
  );
}
