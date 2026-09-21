"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Explains why there's no "Mode" selector: it's read straight off this tournament's own format. */
export function ModeInfoPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="About mode"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Info className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-3 text-sm">
        <p>
          The invite&apos;s Mode (Singles Only / Doubles) is set automatically from this
          tournament&apos;s format above.
        </p>
        <p className="mt-1 text-muted-foreground">
          Need both singles and doubles in one invite? Create an Event instead.
        </p>
      </PopoverContent>
    </Popover>
  );
}
