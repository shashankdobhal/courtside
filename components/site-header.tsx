import Link from "next/link";
import { Trophy, BarChart3, Radio, GraduationCap, Newspaper, BookOpen, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { signInWithGoogle } from "@/lib/actions/auth";
import { isSuperAdminEmail } from "@/lib/admin";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { PushNotificationToggle } from "@/components/push-notification-toggle";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();
  const isAdmin = isSuperAdminEmail(session?.user?.email);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-heading flex items-center gap-2 text-sm font-bold tracking-tight transition-opacity hover:opacity-70"
        >
          <Trophy className="size-4 text-primary" />
          CourtSide
        </Link>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link
                href="/live"
                className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <Radio className="size-4" />
                Live
              </Link>
              <Link
                href="/leaderboard"
                className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <BarChart3 className="size-4" />
                Leaderboard
              </Link>
              <Link
                href="/coaches"
                className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <GraduationCap className="size-4" />
                Coaches
              </Link>
              <Link
                href="/news"
                className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <Newspaper className="size-4" />
                News
              </Link>
              <Link
                href="/learn"
                className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <BookOpen className="size-4" />
                Learn
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
                >
                  <ShieldCheck className="size-4" />
                  Admin
                </Link>
              )}
              <PushNotificationToggle />
              <ThemeToggle />
              <UserMenu
                name={session.user.name ?? null}
                image={session.user.image ?? null}
                isAdmin={isAdmin}
              />
            </>
          ) : (
            <>
              <Link
                href="/live"
                className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <Radio className="size-4" />
                Live
              </Link>
              <Link
                href="/coaches"
                className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <GraduationCap className="size-4" />
                Coaches
              </Link>
              <Link
                href="/news"
                className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <Newspaper className="size-4" />
                News
              </Link>
              <Link
                href="/learn"
                className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <BookOpen className="size-4" />
                Learn
              </Link>
              <Link
                href="/#join"
                className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Join a Game
              </Link>
              <ThemeToggle />
              <MobileMenu />
              <form action={signInWithGoogle}>
                <Button type="submit" size="sm" variant="outline">
                  Sign in
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
