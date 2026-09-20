"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveJoinTarget } from "@/lib/actions/tournaments";
import { ArrowRight, Loader2 } from "lucide-react";

export function JoinInviteCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const target = await resolveJoinTarget(value);
      if (!target) {
        setError("We couldn't find a game with that code or link.");
        return;
      }
      setError(null);
      router.push(target.type === "event" ? `/events/${target.id}` : `/tournaments/${target.id}/players`);
    });
  };

  return (
    <div id="join" className="scroll-mt-20 rounded-2xl border bg-muted/30 p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">Have a game invite?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your game code or paste your invite link.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Game code or invite link"
          className="h-12 flex-1 text-base sm:h-11"
          aria-label="Game code or invite link"
          aria-invalid={!!error}
        />
        <Button type="submit" size="lg" className="h-12 shrink-0 text-base sm:h-11" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Join
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
