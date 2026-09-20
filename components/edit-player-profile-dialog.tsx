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
import { editPlayerProfileSchema, type EditPlayerProfileInput } from "@/lib/validations";
import { updatePlayerProfileDetails } from "@/lib/actions/player-profiles";
import { Loader2 } from "lucide-react";

export function EditPlayerProfileDialog({
  profileId,
  bio,
  playingStyle,
  hometown,
  company,
  open,
  onOpenChange,
}: {
  profileId: string;
  bio: string | null;
  playingStyle: string | null;
  hometown: string | null;
  company: string | null;
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
  } = useForm<EditPlayerProfileInput>({
    resolver: zodResolver(editPlayerProfileSchema),
    defaultValues: {
      bio: bio ?? "",
      playingStyle: playingStyle ?? "",
      hometown: hometown ?? "",
      company: company ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        bio: bio ?? "",
        playingStyle: playingStyle ?? "",
        hometown: hometown ?? "",
        company: company ?? "",
      });
      setServerError(null);
    }
  }, [open, bio, playingStyle, hometown, company, reset]);

  const onSubmit = (data: EditPlayerProfileInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await updatePlayerProfileDetails(profileId, data);
        toast.success("Profile updated");
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error("Failed to update profile");
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
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Input
              id="profile-bio"
              placeholder="A short line about you"
              className="h-11 text-base"
              autoFocus
              {...register("bio")}
            />
            {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-playing-style">Playing style</Label>
            <Input
              id="profile-playing-style"
              placeholder="e.g. Aggressive smasher"
              className="h-11 text-base"
              {...register("playingStyle")}
            />
            {errors.playingStyle && (
              <p className="text-sm text-destructive">{errors.playingStyle.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-hometown">Hometown</Label>
            <Input
              id="profile-hometown"
              placeholder="e.g. Bengaluru"
              className="h-11 text-base"
              {...register("hometown")}
            />
            {errors.hometown && (
              <p className="text-sm text-destructive">{errors.hometown.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-company">Company</Label>
            <Input
              id="profile-company"
              placeholder="e.g. Acme Corp"
              className="h-11 text-base"
              {...register("company")}
            />
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company.message}</p>
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
