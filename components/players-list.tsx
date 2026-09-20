"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/player-avatar";
import { EditPlayerDialog } from "@/components/edit-player-dialog";
import { PlayerActionsMenu } from "@/components/player-actions-menu";
import { displayName } from "@/utils/format";
import { cn } from "@/lib/utils";

export interface PlayersListPlayer {
  id: string;
  name: string;
  alias: string | null;
  profileId: string | null;
  withdrawn: boolean;
  profile?: { company: string | null } | null;
  partnerProfile?: { company: string | null } | null;
}

export function PlayersList({
  players,
  isOwner = false,
  canWithdraw = false,
}: {
  players: PlayersListPlayer[];
  isOwner?: boolean;
  canWithdraw?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingPlayer = players.find((p) => p.id === editingId) ?? null;

  return (
    <div className="space-y-2">
      {players.map((player) => {
        const companyLine = Array.from(
          new Set([player.profile?.company, player.partnerProfile?.company].filter(Boolean))
        ).join(" · ");

        return (
        <Card
          key={player.id}
          className={cn(
            "flex-row items-center justify-between gap-3 p-4",
            player.withdrawn && "opacity-60"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar name={displayName(player)} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {player.profileId ? (
                  <Link
                    href={`/players/${player.profileId}`}
                    className="truncate font-medium hover:underline"
                  >
                    {displayName(player)}
                  </Link>
                ) : (
                  <p className="truncate font-medium">{displayName(player)}</p>
                )}
                {player.withdrawn && (
                  <Badge variant="outline" className="shrink-0 text-muted-foreground">
                    Withdrawn
                  </Badge>
                )}
              </div>
              {player.alias && (
                <p className="truncate text-xs text-muted-foreground">{player.name}</p>
              )}
              {companyLine && (
                <p className="truncate text-xs text-muted-foreground">{companyLine}</p>
              )}
            </div>
          </div>
          {isOwner && !player.withdrawn && (
            <PlayerActionsMenu
              playerId={player.id}
              playerName={player.name}
              canWithdraw={canWithdraw}
              onEdit={() => setEditingId(player.id)}
            />
          )}
        </Card>
        );
      })}

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
