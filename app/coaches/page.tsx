import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCoachDirectory } from "@/lib/actions/player-profiles";
import { signInWithGoogleTo } from "@/lib/actions/auth";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GraduationCap, Users } from "lucide-react";

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const showFollowing = view === "following";

  const session = await auth();
  const viewerProfile = session?.user?.id
    ? await prisma.playerProfile.findUnique({ where: { userId: session.user.id } })
    : null;

  const [allCoaches, followedIds] = await Promise.all([
    getCoachDirectory(),
    viewerProfile
      ? prisma.coachFollow
          .findMany({
            where: { followerProfileId: viewerProfile.id },
            select: { coachProfileId: true },
          })
          .then((rows) => new Set(rows.map((r) => r.coachProfileId)))
      : Promise.resolve(new Set<string>()),
  ]);

  const coaches = showFollowing ? allCoaches.filter((c) => followedIds.has(c.id)) : allCoaches;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Coaches</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Players offering coaching. Reach out directly to book a session.
        </p>
      </div>

      {session?.user?.id && (
        <div className="mb-6 flex gap-2">
          <Link
            href="/coaches"
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              !showFollowing
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            All coaches
          </Link>
          <Link
            href="/coaches?view=following"
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              showFollowing
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Following{followedIds.size > 0 ? ` (${followedIds.size})` : ""}
          </Link>
        </div>
      )}

      {showFollowing && !viewerProfile ? (
        <div className="rounded-2xl border p-6 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Sign in to see the coaches you follow.
          </p>
          <form action={signInWithGoogleTo.bind(null, "/coaches?view=following")}>
            <Button type="submit">Sign in with Google</Button>
          </form>
        </div>
      ) : coaches.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={showFollowing ? "Not following any coaches yet" : "No coaches on CourtSide yet"}
          description={
            showFollowing
              ? "Follow a coach from their profile to see them here."
              : "Nobody has listed themselves as a coach so far. Do you coach? Add your skills and availability from your own profile page to be the first."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {coaches.map((coach) => (
            <Link key={coach.id} href={`/coaches/${coach.id}`}>
              <Card className="h-full gap-3 p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar name={coach.name} size="md" />
                    <div>
                      <p className="font-medium">{coach.name}</p>
                      {coach.coachYearsExperience != null && (
                        <p className="text-xs text-muted-foreground">
                          {coach.coachYearsExperience} year
                          {coach.coachYearsExperience === 1 ? "" : "s"} coaching
                        </p>
                      )}
                    </div>
                  </div>
                  {followedIds.has(coach.id) && (
                    <Badge variant="secondary" className="shrink-0">
                      Following
                    </Badge>
                  )}
                </div>
                {coach.coachSkills && (
                  <p className="text-sm text-foreground">{coach.coachSkills}</p>
                )}
                {coach.coachAvailability && (
                  <p className="text-xs text-muted-foreground">{coach.coachAvailability}</p>
                )}
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3" />
                  {coach.followerCount} follower{coach.followerCount === 1 ? "" : "s"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
