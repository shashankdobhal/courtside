"use client";

import { useState, useTransition } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addLivestreamSchema, type AddLivestreamInput } from "@/lib/validations";
import { addLivestream } from "@/lib/actions/livestreams";
import { Loader2, Plus } from "lucide-react";

export function AddLivestreamButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddLivestreamInput>({ resolver: zodResolver(addLivestreamSchema) });

  const onSubmit = (data: AddLivestreamInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await addLivestream(data);
        toast.success("Livestream added");
        setOpen(false);
        reset();
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error("Failed to add livestream");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setOpen(next);
        if (!next) {
          reset();
          setServerError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus className="size-3.5" />
          Add livestream
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a livestream</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="livestream-title">Title</Label>
            <Input
              id="livestream-title"
              placeholder="e.g. State Championships Finals"
              className="h-11 text-base"
              autoFocus
              {...register("title")}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="livestream-url">YouTube link</Label>
            <Input
              id="livestream-url"
              placeholder="https://youtube.com/watch?v=..."
              className="h-11 text-base"
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
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
