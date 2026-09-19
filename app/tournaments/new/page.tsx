import { auth } from "@/auth";
import { signInWithGoogleTo } from "@/lib/actions/auth";
import { CreateTournamentForm } from "@/components/create-tournament-form";
import { Button } from "@/components/ui/button";

export default async function NewTournamentPage() {
  const session = await auth();

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
      <h1 className="font-heading mb-8 text-2xl font-bold tracking-tight">Create Tournament</h1>
      <CreateTournamentForm />
    </main>
  );
}
