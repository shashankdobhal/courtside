"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createEventSchema, type CreateEventInput } from "@/lib/validations";
import { createEvent } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function CreateEventForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = (data: CreateEventInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await createEvent(data);
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        setServerError("Something went wrong. Please try again.");
        toast.error("Failed to create event");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Event Name</Label>
        <Input
          id="name"
          placeholder="Acme Corp Sports Day 2026"
          className="h-12 text-base"
          autoFocus
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        <p className="text-sm text-muted-foreground">
          You&apos;ll add each category — Singles, Doubles, Mixed Doubles — right after.
        </p>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Create
      </Button>
    </form>
  );
}
