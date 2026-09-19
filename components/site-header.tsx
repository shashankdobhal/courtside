import Link from "next/link";
import { Trophy, BarChart3 } from "lucide-react";
import { auth } from "@/auth";
import { signInWithGoogle } from "@/lib/actions/auth";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight transition-opacity hover:opacity-70"
        >
          <Trophy className="size-4" />
          CourtSide
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <BarChart3 className="size-4" />
            Leaderboard
          </Link>
          {session?.user ? (
            <UserMenu name={session.user.name ?? null} image={session.user.image ?? null} />
          ) : (
            <form action={signInWithGoogle}>
              <Button type="submit" size="sm" variant="outline">
                Sign in
              </Button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
