"use client";

import { useState } from "react";
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
import { extractTournamentId } from "@/lib/extract-tournament-id";

export function JoinGameDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractTournamentId(value);
    if (!id) {
      setError("Enter a valid game code or invite link.");
      return;
    }
    setOpen(false);
    router.push(`/tournaments/${id}/players`);
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
            <Button type="submit" size="lg" className="h-12 w-full text-base">
              Join Game
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
