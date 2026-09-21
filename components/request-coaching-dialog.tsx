"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { playerNameSchema, phoneSchema } from "@/lib/validations";
import { requestCoaching } from "@/lib/actions/coaches";
import { Loader2, MessageCircle } from "lucide-react";

export function RequestCoachingDialog({
  coachProfileId,
  coachName,
  isSignedIn,
}: {
  coachProfileId: string;
  coachName: string;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    name: isSignedIn ? z.string().optional() : playerNameSchema,
    phone: phoneSchema,
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await requestCoaching(coachProfileId, { name: data.name, phone: data.phone });
        toast.success("Request sent");
        setOpen(false);
        reset();
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error("Failed to send request");
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
        <Button type="button" size="lg" className="h-11 flex-1">
          <MessageCircle className="size-4" />
          Request coaching
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Request coaching from {coachName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isSignedIn && (
            <div className="space-y-2">
              <Label htmlFor="request-name">Your name</Label>
              <Input
                id="request-name"
                placeholder="Your full name"
                className="h-11 text-base"
                autoFocus
                {...register("name")}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="request-phone">Phone number</Label>
            <Input
              id="request-phone"
              type="tel"
              placeholder="e.g. 98765 43210"
              className="h-11 text-base"
              autoFocus={isSignedIn}
              {...register("phone")}
            />
            {errors.phone ? (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Shared with {coachName} so they can reach you directly.
              </p>
            )}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter>
            <Button type="submit" size="lg" className="h-11 w-full" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
