"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editTournamentSchema, type EditTournamentInput } from "@/lib/validations";
import { updateTournament } from "@/lib/actions/tournaments";
import { Loader2 } from "lucide-react";

export function EditTournamentDialog({
  tournamentId,
  name,
  open,
  onOpenChange,
}: {
  tournamentId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTournamentInput>({
    resolver: zodResolver(editTournamentSchema),
    defaultValues: { name },
  });

  useEffect(() => {
    if (open) {
      reset({ name });
      setServerError(null);
    }
  }, [open, name, reset]);

  const onSubmit = (data: EditTournamentInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await updateTournament(tournamentId, data);
        toast.success("Tournament updated");
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error("Failed to update tournament");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename Tournament</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tournament-name">Name</Label>
            <Input id="tournament-name" className="h-11 text-base" autoFocus {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter>
            <Button type="submit" size="lg" className="h-11 w-full" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
