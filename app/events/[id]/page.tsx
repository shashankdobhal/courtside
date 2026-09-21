import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/actions/events";
import { ShareActions } from "@/components/share-actions";
import { EventActions } from "@/components/event-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus } from "lucide-react";
import { gameFormatLabel, gameHref } from "@/lib/tournament-display";
import { tournamentStatusLabel } from "@/utils/format";
import { TournamentStatus } from "@/types";
import { auth } from "@/auth";

const statusVariant: Record<string, "secondary" | "default" | "outline"> = {
  [TournamentStatus.PENDING]: "outline",
  [TournamentStatus.ACTIVE]: "default",
  [TournamentStatus.COMPLETED]: "secondary",
  [TournamentStatus.CANCELLED]: "outline",
};

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, session] = await Promise.all([getEvent(id), auth()]);

  if (!event) notFound();

  const isOwner = !!session?.user?.id && event.ownerId === session.user.id;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-14">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{event.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.tournaments.length} categor{event.tournaments.length === 1 ? "y" : "ies"}
          </p>
        </div>
        {isOwner && <EventActions eventId={event.id} />}
      </div>

      {isOwner && (
        <div className="mb-8">
          <ShareActions title={event.name} joinCode={event.joinCode} />
        </div>
      )}

      {event.tournaments.length > 0 && (
        <div className="mb-8 space-y-2">
          {event.tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={gameHref(tournament)}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-background p-4 transition-colors hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{tournament.name}</p>
                  <Badge variant={statusVariant[tournament.status] ?? "outline"}>
                    {tournamentStatusLabel[tournament.status as TournamentStatus] ?? tournament.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {gameFormatLabel(tournament.format)} · {tournament._count.players} players
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      {isOwner ? (
        <Button asChild variant="outline" className="h-12 w-full text-base">
          <Link href={`/tournaments/new?eventId=${event.id}`}>
            <Plus className="size-4" />
            Add Category
          </Link>
        </Button>
      ) : event.tournaments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          The organizer hasn&apos;t added any categories yet.
        </p>
      ) : null}
    </main>
  );
}
