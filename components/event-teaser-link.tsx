import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";

/** Highlighted nudge toward multi-category Events, reused wherever someone might otherwise miss it. */
export function EventTeaserLink() {
  return (
    <Link
      href="/events/new"
      className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Layers className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">Running Singles, Doubles, and more together?</span>
        <span className="block text-xs text-muted-foreground">
          Create an event to group them under one shared invite.
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-primary" />
    </Link>
  );
}
