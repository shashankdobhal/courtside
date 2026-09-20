"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveJoinTarget } from "@/lib/actions/tournaments";
import { Loader2 } from "lucide-react";

export function JoinGameDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const tournamentId = await resolveJoinTarget(value);
      if (!tournamentId) {
        setError("We couldn't find a game with that code or link.");
        return;
      }
      setOpen(false);
      router.push(`/tournaments/${tournamentId}/players`);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setValue("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="h-12 flex-1 text-base sm:flex-none sm:px-7">
          Join Game
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a game</DialogTitle>
          <DialogDescription>Paste your invite link or enter your game code.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Invite link or game code"
            className="h-12 text-base"
            autoFocus
            aria-invalid={!!error}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Join Game
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
