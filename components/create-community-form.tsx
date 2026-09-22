"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createCommunitySchema, type CreateCommunityInput } from "@/lib/validations";
import { createCommunity } from "@/lib/actions/communities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function CreateCommunityForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCommunityInput>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (data: CreateCommunityInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await createCommunity(data);
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        setServerError("Something went wrong. Please try again.");
        toast.error("Failed to create community");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Community Name</Label>
        <Input
          id="name"
          placeholder="Sunday Morning Smashers"
          className="h-12 text-base"
          autoFocus
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Who's this for, and where do you usually play?"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        You&apos;ll be this community&apos;s first admin — you can approve join requests and nominate
        more admins once it&apos;s created.
      </p>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Create
      </Button>
    </form>
  );
}
