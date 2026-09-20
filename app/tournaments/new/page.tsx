import { auth } from "@/auth";
import { signInWithGoogleTo } from "@/lib/actions/auth";
import { getEvent } from "@/lib/actions/events";
import { CreateTournamentForm } from "@/components/create-tournament-form";
import { Button } from "@/components/ui/button";

export default async function NewTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const [session, { eventId }] = await Promise.all([auth(), searchParams]);
  const event = eventId ? await getEvent(eventId) : null;

  if (!session?.user) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 text-center sm:py-14">
        <h1 className="font-heading mb-4 text-2xl font-bold tracking-tight">Create Tournament</h1>
        <p className="mb-6 text-sm text-muted-foreground">Sign in to create a tournament.</p>
        <form action={signInWithGoogleTo.bind(null, "/tournaments/new")}>
          <Button type="submit" size="lg" className="h-12 w-full text-base">
            Sign in with Google
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-14">
      <h1 className={`font-heading text-2xl font-bold tracking-tight ${event ? "mb-2" : "mb-8"}`}>
        Create Tournament
      </h1>
      {event && (
        <p className="mb-8 text-sm text-muted-foreground">
          Adding a category to <span className="font-medium text-foreground">{event.name}</span>.
        </p>
      )}
      <CreateTournamentForm eventId={event?.id} />
    </main>
  );
}
