"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { editPlayerProfileSchema, type EditPlayerProfileInput } from "@/lib/validations";
import { updatePlayerProfileDetails } from "@/lib/actions/player-profiles";
import { Loader2 } from "lucide-react";

export function EditPlayerProfileDialog({
  profileId,
  name,
  bio,
  playingStyle,
  hometown,
  company,
  upiId,
  isCoach,
  coachYearsExperience,
  coachSkills,
  coachAvailability,
  open,
  onOpenChange,
}: {
  profileId: string;
  name: string;
  bio: string | null;
  playingStyle: string | null;
  hometown: string | null;
  company: string | null;
  upiId: string | null;
  isCoach: boolean;
  coachYearsExperience: number | null;
  coachSkills: string | null;
  coachAvailability: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCoachEnabled, setIsCoachEnabled] = useState(isCoach);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EditPlayerProfileInput>({
    resolver: zodResolver(editPlayerProfileSchema),
    defaultValues: {
      name,
      bio: bio ?? "",
      playingStyle: playingStyle ?? "",
      hometown: hometown ?? "",
      company: company ?? "",
      upiId: upiId ?? "",
      isCoach,
      coachYearsExperience: coachYearsExperience ?? undefined,
      coachSkills: coachSkills ?? "",
      coachAvailability: coachAvailability ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name,
        bio: bio ?? "",
        playingStyle: playingStyle ?? "",
        hometown: hometown ?? "",
        company: company ?? "",
        upiId: upiId ?? "",
        isCoach,
        coachYearsExperience: coachYearsExperience ?? undefined,
        coachSkills: coachSkills ?? "",
        coachAvailability: coachAvailability ?? "",
      });
      setIsCoachEnabled(isCoach);
      setServerError(null);
    }
  }, [
    open,
    name,
    bio,
    playingStyle,
    hometown,
    company,
    upiId,
    isCoach,
    coachYearsExperience,
    coachSkills,
    coachAvailability,
    reset,
  ]);

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
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              placeholder="Your display name"
              className="h-11 text-base"
              autoFocus
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Shown everywhere on CourtSide — fixtures, standings, invites.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Input
              id="profile-bio"
              placeholder="A short line about you"
              className="h-11 text-base"
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

          <div className="space-y-2">
            <Label htmlFor="profile-upi-id">UPI ID</Label>
            <Input
              id="profile-upi-id"
              placeholder="e.g. name@okhdfcbank"
              className="h-11 text-base"
              {...register("upiId")}
            />
            {errors.upiId ? (
              <p className="text-sm text-destructive">{errors.upiId.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Lets others pay you straight from the expense settle-up list.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <Label htmlFor="profile-is-coach">Available to coach</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Lists you on the CourtSide coaches directory.
              </p>
            </div>
            <Controller
              name="isCoach"
              control={control}
              render={({ field }) => (
                <Switch
                  id="profile-is-coach"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    setIsCoachEnabled(checked);
                  }}
                  className="shrink-0"
                />
              )}
            />
          </div>

          {isCoachEnabled && (
            <div className="space-y-4 rounded-lg border p-3">
              <div className="space-y-2">
                <Label htmlFor="profile-coach-experience">Years of experience</Label>
                <Input
                  id="profile-coach-experience"
                  type="number"
                  min={0}
                  max={60}
                  placeholder="e.g. 5"
                  className="h-11 text-base"
                  {...register("coachYearsExperience", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                />
                {errors.coachYearsExperience && (
                  <p className="text-sm text-destructive">{errors.coachYearsExperience.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-coach-skills">Skills</Label>
                <Input
                  id="profile-coach-skills"
                  placeholder="e.g. Footwork, doubles strategy, juniors"
                  className="h-11 text-base"
                  {...register("coachSkills")}
                />
                {errors.coachSkills && (
                  <p className="text-sm text-destructive">{errors.coachSkills.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-coach-availability">Availability</Label>
                <Input
                  id="profile-coach-availability"
                  placeholder="e.g. Weekday evenings, weekend mornings"
                  className="h-11 text-base"
                  {...register("coachAvailability")}
                />
                {errors.coachAvailability && (
                  <p className="text-sm text-destructive">{errors.coachAvailability.message}</p>
                )}
              </div>
            </div>
          )}

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
