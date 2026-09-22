"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditPlayerProfileDialog } from "@/components/edit-player-profile-dialog";
import { SeasonOptInToggle } from "@/components/season-opt-in-toggle";
import { Pencil, GraduationCap, ArrowRight } from "lucide-react";
import type { SkillLevel } from "@/types";

export function ProfileEditor({
  profileId,
  name,
  bio,
  playingStyle,
  hometown,
  company,
  upiId,
  playingLevel,
  isCoach,
  coachYearsExperience,
  coachSkills,
  coachAvailability,
  seasonOptIn,
}: {
  profileId: string;
  name: string;
  bio: string | null;
  playingStyle: string | null;
  hometown: string | null;
  company: string | null;
  upiId: string | null;
  playingLevel: SkillLevel;
  isCoach: boolean;
  coachYearsExperience: number | null;
  coachSkills: string | null;
  coachAvailability: string | null;
  seasonOptIn: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <SeasonOptInToggle profileId={profileId} optedIn={seasonOptIn} />
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </div>

      {!isCoach && (
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Coach other players?</span>
            <span className="block text-xs text-muted-foreground">
              List yourself on the CourtSide coaches directory.
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-primary" />
        </button>
      )}

      <EditPlayerProfileDialog
        profileId={profileId}
        name={name}
        bio={bio}
        playingStyle={playingStyle}
        hometown={hometown}
        company={company}
        upiId={upiId}
        playingLevel={playingLevel}
        isCoach={isCoach}
        coachYearsExperience={coachYearsExperience}
        coachSkills={coachSkills}
        coachAvailability={coachAvailability}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
