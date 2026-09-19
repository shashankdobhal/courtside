"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractTournamentId } from "@/lib/extract-tournament-id";
import { ArrowRight } from "lucide-react";

export function JoinInviteCard() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractTournamentId(value);
    if (!id) {
      setError("Enter a valid CourtSide invite link or code.");
      return;
    }
    setError(null);
    router.push(`/tournaments/${id}/players`);
  };

  return (
    <div id="join" className="scroll-mt-20 rounded-2xl border bg-muted/30 p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">Have a game invite?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your tournament code or paste your invite link.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Tournament code or invite link"
          className="h-12 flex-1 text-base sm:h-11"
          aria-label="Tournament code or invite link"
          aria-invalid={!!error}
        />
        <Button type="submit" size="lg" className="h-12 shrink-0 text-base sm:h-11">
          Join
          <ArrowRight className="size-4" />
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
