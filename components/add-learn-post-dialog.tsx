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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { learnPostSchema, type LearnPostInput } from "@/lib/validations";
import { createLearnPost } from "@/lib/actions/learn";
import { Loader2, Plus } from "lucide-react";

export function AddLearnPostDialog({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LearnPostInput>({
    resolver: zodResolver(learnPostSchema),
    defaultValues: { title: "", body: "", videoUrl: "" },
  });

  const onSubmit = (data: LearnPostInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await createLearnPost(profileId, data);
        toast.success("Posted to Learn");
        setOpen(false);
        reset();
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error("Failed to post");
      }
    });
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        Add Learn post
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!isPending) {
            setOpen(next);
            if (!next) {
              reset();
              setServerError(null);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a Learn post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="learn-title">Title</Label>
              <Input
                id="learn-title"
                placeholder="e.g. Fixing your backhand clear"
                className="h-11 text-base"
                autoFocus
                {...register("title")}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="learn-body">Note</Label>
              <Textarea
                id="learn-body"
                placeholder="Share a tip, drill, or write-up..."
                rows={4}
                {...register("body")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="learn-video-url">Video link</Label>
              <Input
                id="learn-video-url"
                placeholder="YouTube or Facebook video URL"
                className="h-11 text-base"
                {...register("videoUrl")}
              />
              {errors.videoUrl ? (
                <p className="text-sm text-destructive">{errors.videoUrl.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Add a note, a video link, or both.</p>
              )}
            </div>

            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <DialogFooter>
              <Button type="submit" size="lg" className="h-11 w-full" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Post
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
