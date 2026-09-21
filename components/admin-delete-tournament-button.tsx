"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminDeleteTournament } from "@/lib/actions/tournaments";
import { Trash2, Loader2 } from "lucide-react";

export function AdminDeleteTournamentButton({
  tournamentId,
  name,
}: {
  tournamentId: string;
  name: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await adminDeleteTournament(tournamentId);
        toast.success("Tournament deleted");
        setConfirmOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground"
        aria-label={`Delete ${name}`}
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="size-3.5" />
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !isPending && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{name}&rdquo; and all of its players and match results will be permanently
              deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
