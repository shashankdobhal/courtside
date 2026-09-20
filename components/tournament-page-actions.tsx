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
import { EditTournamentDialog } from "@/components/edit-tournament-dialog";
import { EditYoutubeDialog } from "@/components/edit-youtube-dialog";
import { regenerateFixtures } from "@/lib/actions/fixtures";
import { MoreVertical, Pencil, RefreshCw, Loader2, Radio } from "lucide-react";

export function TournamentPageActions({
  tournamentId,
  name,
  canRegenerate,
  youtubeUrl,
}: {
  tournamentId: string;
  name: string;
  canRegenerate: boolean;
  youtubeUrl: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const handleRegenerate = () => {
    startTransition(async () => {
      try {
        await regenerateFixtures(tournamentId);
        toast.success("Fixtures regenerated");
        setConfirmRegenerate(false);
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
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            aria-label="Tournament settings"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setYoutubeOpen(true)}>
            <Radio className="size-3.5" />
            {youtubeUrl ? "Edit Livestream Link" : "Add Livestream Link"}
          </DropdownMenuItem>
          {canRegenerate && (
            <DropdownMenuItem onClick={() => setConfirmRegenerate(true)}>
              <RefreshCw className="size-3.5" />
              Regenerate Fixtures
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTournamentDialog
        tournamentId={tournamentId}
        name={name}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <EditYoutubeDialog
        tournamentId={tournamentId}
        youtubeUrl={youtubeUrl}
        open={youtubeOpen}
        onOpenChange={setYoutubeOpen}
      />

      <AlertDialog
        open={confirmRegenerate}
        onOpenChange={(open) => !isPending && setConfirmRegenerate(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate fixtures?</AlertDialogTitle>
            <AlertDialogDescription>
              This rebuilds any not-yet-played matches from the current player list. Completed
              results are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                handleRegenerate();
              }}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
