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
import { withdrawPlayer } from "@/lib/actions/players";
import { MoreVertical, Pencil, UserX, Loader2 } from "lucide-react";

export function PlayerActionsMenu({
  playerId,
  playerName,
  canWithdraw,
  onEdit,
}: {
  playerId: string;
  playerName: string;
  canWithdraw: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const handleWithdraw = () => {
    startTransition(async () => {
      try {
        await withdrawPlayer(playerId);
        toast.success(`${playerName} withdrawn`);
        setConfirmWithdraw(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        toast.error(message);
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
            className="shrink-0 text-muted-foreground"
            aria-label={`${playerName} actions`}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          {canWithdraw && (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmWithdraw(true)}>
              <UserX className="size-3.5" />
              Withdraw
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmWithdraw}
        onOpenChange={(open) => !isPending && setConfirmWithdraw(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw {playerName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their pending matches will be voided and excluded from standings. This can&apos;t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                handleWithdraw();
              }}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
