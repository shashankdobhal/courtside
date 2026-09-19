"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDoublesMatch } from "@/lib/actions/doubles";
import { Loader2, Plus } from "lucide-react";

export interface DoublesTeamOption {
  id: string;
  name: string;
}

export function AddDoublesMatchDialog({
  tournamentId,
  teams,
}: {
  tournamentId: string;
  teams: DoublesTeamOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [team1Id, setTeam1Id] = useState<string | undefined>();
  const [team2Id, setTeam2Id] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const canSubmit = !!team1Id && !!team2Id && team1Id !== team2Id;

  const handleSubmit = () => {
    if (!team1Id || !team2Id) return;
    setServerError(null);
    startTransition(async () => {
      try {
        await addDoublesMatch(tournamentId, team1Id, team2Id);
        toast.success("Match added");
        setOpen(false);
        setTeam1Id(undefined);
        setTeam2Id(undefined);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error(message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-12 w-full text-base">
          <Plus className="size-4" />
          Add Match
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a match</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Team A</Label>
            <Select value={team1Id} onValueChange={setTeam1Id}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Team B</Label>
            <Select value={team2Id} onValueChange={setTeam2Id}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams
                  .filter((team) => team.id !== team1Id)
                  .map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending} className="w-full">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Add Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
