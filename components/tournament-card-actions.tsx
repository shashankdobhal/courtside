"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { discontinueTournament, deleteTournament } from "@/lib/actions/tournaments";
import { TournamentStatus } from "@/types";
import { MoreVertical, Ban, Trash2, Loader2 } from "lucide-react";

export function TournamentCardActions({
  tournamentId,
  status,
}: {
  tournamentId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<"discontinue" | "delete" | null>(null);

  const canDiscontinue =
    status === TournamentStatus.PENDING || status === TournamentStatus.ACTIVE;

  const handleConfirm = () => {
    const action = confirmAction;
    startTransition(async () => {
      try {
        if (action === "discontinue") {
          await discontinueTournament(tournamentId);
          toast.success("Tournament discontinued");
        } else if (action === "delete") {
          await deleteTournament(tournamentId);
          toast.success("Tournament deleted");
        }
        setConfirmAction(null);
        router.refresh();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            aria-label="Tournament actions"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canDiscontinue && (
            <DropdownMenuItem onClick={() => setConfirmAction("discontinue")}>
              <Ban className="size-3.5" />
              Discontinue
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmAction("delete")}
          >
            <Trash2 className="size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && !isPending && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "delete" ? "Delete tournament?" : "Discontinue tournament?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "delete"
                ? "This permanently deletes the tournament, its players, and all match results. This cannot be undone."
                : "This stops the tournament before completion. Scores can no longer be entered, but its results stay visible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmAction === "delete" ? "destructive" : "default"}
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {confirmAction === "delete" ? "Delete" : "Discontinue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
