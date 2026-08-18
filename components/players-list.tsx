"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/player-avatar";
import { EditPlayerDialog } from "@/components/edit-player-dialog";
import { displayName } from "@/utils/format";
import { Pencil } from "lucide-react";

export interface PlayersListPlayer {
  id: string;
  name: string;
  alias: string | null;
}

export function PlayersList({ players }: { players: PlayersListPlayer[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingPlayer = players.find((p) => p.id === editingId) ?? null;

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <Card key={player.id} className="flex-row items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar name={displayName(player)} size="md" />
            <div className="min-w-0">
              <p className="truncate font-medium">{displayName(player)}</p>
              {player.alias && (
                <p className="truncate text-xs text-muted-foreground">{player.name}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            aria-label={`Edit ${player.name}`}
            onClick={() => setEditingId(player.id)}
          >
            <Pencil className="size-4" />
          </Button>
        </Card>
      ))}

      {editingPlayer && (
        <EditPlayerDialog
          playerId={editingPlayer.id}
          name={editingPlayer.name}
          alias={editingPlayer.alias}
          open={editingId !== null}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </div>
  );
}
