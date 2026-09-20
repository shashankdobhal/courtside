"use client";

import { useState } from "react";
import { Radio, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditYoutubeDialog } from "@/components/edit-youtube-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const steps = [
  "Open the YouTube app or studio and tap Go Live (or schedule one for later).",
  "Once it's live, tap Share on your stream and copy the link.",
  "Paste that link into “Add Livestream Link” below.",
];

export function AddLivestreamPrompt({ tournamentId }: { tournamentId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mb-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-6 text-center">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="How to set up a YouTube livestream"
            className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Info className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="p-4 text-left">
          <p className="text-sm font-medium">How to go live on YouTube</p>
          <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-medium text-foreground">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </PopoverContent>
      </Popover>

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
        isPublic={false}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
