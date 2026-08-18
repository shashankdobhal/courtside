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
import { editPlayerSchema, type EditPlayerInput } from "@/lib/validations";
import { updatePlayer } from "@/lib/actions/players";
import { Loader2 } from "lucide-react";

export function EditPlayerDialog({
  playerId,
  name,
  alias,
  open,
  onOpenChange,
}: {
  playerId: string;
  name: string;
  alias: string | null;
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
  } = useForm<EditPlayerInput>({
    resolver: zodResolver(editPlayerSchema),
    defaultValues: { name, alias: alias ?? "" },
  });

  useEffect(() => {
    if (open) {
      reset({ name, alias: alias ?? "" });
      setServerError(null);
    }
  }, [open, name, alias, reset]);

  const onSubmit = (data: EditPlayerInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await updatePlayer(playerId, data);
        toast.success("Player updated");
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error("Failed to update player");
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
          <DialogTitle>Edit Player</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="player-name">Name</Label>
            <Input id="player-name" className="h-11 text-base" autoFocus {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-alias">Alias (fun name)</Label>
            <Input
              id="player-alias"
              placeholder="e.g. The Smasher"
              className="h-11 text-base"
              {...register("alias")}
            />
            {errors.alias && <p className="text-sm text-destructive">{errors.alias.message}</p>}
            <p className="text-xs text-muted-foreground">
              Shown everywhere instead of their real name when set.
            </p>
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
