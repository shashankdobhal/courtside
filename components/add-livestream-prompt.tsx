"use client";

import { useState } from "react";
import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditYoutubeDialog } from "@/components/edit-youtube-dialog";

export function AddLivestreamPrompt({ tournamentId }: { tournamentId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Radio className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">Streaming this on YouTube?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your stream link so players and spectators can watch live.
        </p>
      </div>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Radio className="size-3.5" />
        Add Livestream Link
      </Button>

      <EditYoutubeDialog
        tournamentId={tournamentId}
        youtubeUrl={null}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
