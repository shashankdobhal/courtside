import { auth } from "@/auth";
import { signInWithGoogleTo } from "@/lib/actions/auth";
import { CreateEventForm } from "@/components/create-event-form";
import { Button } from "@/components/ui/button";

export default async function NewEventPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 text-center sm:py-14">
        <h1 className="font-heading mb-4 text-2xl font-bold tracking-tight">Create Event</h1>
        <p className="mb-6 text-sm text-muted-foreground">Sign in to create an event.</p>
        <form action={signInWithGoogleTo.bind(null, "/events/new")}>
          <Button type="submit" size="lg" className="h-12 w-full text-base">
            Sign in with Google
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-14">
      <h1 className="font-heading mb-2 text-2xl font-bold tracking-tight">Create Event</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        For a tournament that runs several categories at once, like Men&apos;s Singles, Doubles, and
        Mixed Doubles, all under one shared invite.
      </p>
      <CreateEventForm />
    </main>
  );
}
