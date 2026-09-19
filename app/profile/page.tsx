import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signInWithGoogleTo } from "@/lib/actions/auth";
import { resolveOrCreateUserPlayerProfile } from "@/lib/actions/player-profiles";
import { Button } from "@/components/ui/button";

export default async function MyProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 text-center sm:py-14">
        <h1 className="font-heading mb-4 text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="mb-6 text-sm text-muted-foreground">Sign in to view your profile.</p>
        <form action={signInWithGoogleTo.bind(null, "/profile")}>
          <Button type="submit" size="lg" className="h-12 w-full text-base">
            Sign in with Google
          </Button>
        </form>
      </main>
    );
  }

  const profile = await resolveOrCreateUserPlayerProfile(
    session.user.id,
    session.user.name ?? "Player"
  );
  redirect(`/players/${profile.id}`);
}
