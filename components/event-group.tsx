import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Wraps a shared event's category cards on the homepage under one header. */
export function EventGroup({
  eventId,
  eventName,
  children,
}: {
  eventId: string;
  eventName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-dashed p-3 sm:p-4">
      <Link
        href={`/events/${eventId}`}
        className="flex items-center justify-between gap-2 px-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        {eventName}
        <ArrowRight className="size-3.5 shrink-0" />
      </Link>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
