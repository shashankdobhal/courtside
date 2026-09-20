"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditPlayerProfileDialog } from "@/components/edit-player-profile-dialog";
import { SeasonOptInToggle } from "@/components/season-opt-in-toggle";
import { Pencil } from "lucide-react";

export function ProfileEditor({
  profileId,
  bio,
  playingStyle,
  hometown,
  company,
  upiId,
  seasonOptIn,
}: {
  profileId: string;
  bio: string | null;
  playingStyle: string | null;
  hometown: string | null;
  company: string | null;
  upiId: string | null;
  seasonOptIn: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <SeasonOptInToggle profileId={profileId} optedIn={seasonOptIn} />
      <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
        <Pencil className="size-3.5" />
        Edit
      </Button>
      <EditPlayerProfileDialog
        profileId={profileId}
        bio={bio}
        playingStyle={playingStyle}
        hometown={hometown}
        company={company}
        upiId={upiId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
