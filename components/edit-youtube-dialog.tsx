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
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { youtubeUrlSchema, type YoutubeUrlInput } from "@/lib/validations";
import { setTournamentYoutubeUrl } from "@/lib/actions/tournaments";
import { Loader2 } from "lucide-react";

export function EditYoutubeDialog({
  tournamentId,
  youtubeUrl,
  open,
  onOpenChange,
}: {
  tournamentId: string;
  youtubeUrl: string | null;
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
  } = useForm<YoutubeUrlInput>({
    resolver: zodResolver(youtubeUrlSchema),
    defaultValues: { youtubeUrl: youtubeUrl ?? "" },
  });

  useEffect(() => {
    if (open) {
      reset({ youtubeUrl: youtubeUrl ?? "" });
      setServerError(null);
    }
  }, [open, youtubeUrl, reset]);

  const onSubmit = (data: YoutubeUrlInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await setTournamentYoutubeUrl(tournamentId, data.youtubeUrl ?? "");
        toast.success(data.youtubeUrl ? "Livestream link saved" : "Livestream link removed");
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error("Failed to save livestream link");
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
          <DialogTitle>Livestream Link</DialogTitle>
          <DialogDescription>
            Paste a YouTube video or live stream link. Leave blank to remove it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube link</Label>
            <Input
              id="youtube-url"
              className="h-11 text-base"
              placeholder="https://youtube.com/watch?v=..."
              autoFocus
              {...register("youtubeUrl")}
            />
            {errors.youtubeUrl && (
              <p className="text-sm text-destructive">{errors.youtubeUrl.message}</p>
            )}
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
