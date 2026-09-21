import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PlayerAvatar } from "@/components/player-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/follow-button";
import { RequestCoachingDialog } from "@/components/request-coaching-dialog";
import { signInWithGoogleTo } from "@/lib/actions/auth";
import { getFollowState } from "@/lib/actions/follows";

export default async function CoachProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const [profile, session] = await Promise.all([
    prisma.playerProfile.findUnique({ where: { id: profileId } }),
    auth(),
  ]);

  if (!profile || !profile.isCoach) notFound();

  const isOwnProfile = !!session?.user?.id && profile.userId === session.user.id;
  const bioLine = [profile.playingStyle, profile.hometown, profile.company]
    .filter(Boolean)
    .join(" · ");

  const viewerProfile = session?.user?.id
    ? await prisma.playerProfile.findUnique({ where: { userId: session.user.id } })
    : null;

  const { followerCount, isFollowing } = await getFollowState(profile.id, viewerProfile?.id ?? null);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <div className="relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <PlayerAvatar name={profile.name} size="md" className="size-12 text-lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight">{profile.name}</h1>
              <Badge variant="secondary">Coach</Badge>
            </div>
            {bioLine && <p className="text-sm text-muted-foreground">{bioLine}</p>}
          </div>
        </div>

        <div className="mt-4 space-y-1 border-t pt-4 text-sm">
          {profile.coachYearsExperience != null && (
            <p>
              <span className="text-muted-foreground">Experience:</span>{" "}
              {profile.coachYearsExperience} year{profile.coachYearsExperience === 1 ? "" : "s"}
            </p>
          )}
          {profile.coachSkills && (
            <p>
              <span className="text-muted-foreground">Skills:</span> {profile.coachSkills}
            </p>
          )}
          {profile.coachAvailability && (
            <p>
              <span className="text-muted-foreground">Availability:</span>{" "}
              {profile.coachAvailability}
            </p>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {followerCount} follower{followerCount === 1 ? "" : "s"}
        </p>
      </div>

      {profile.bio && <p className="mb-6 text-sm text-foreground">{profile.bio}</p>}

      {isOwnProfile ? (
        <p className="text-sm text-muted-foreground">
          This is your public coach profile.{" "}
          <Link
            href={`/players/${profile.id}`}
            className="text-primary underline underline-offset-2"
          >
            Manage it from your profile
          </Link>
          .
        </p>
      ) : (
        <div className="flex gap-3">
          {session?.user?.id ? (
            <FollowButton profileId={profile.id} initiallyFollowing={isFollowing} />
          ) : (
            <form action={signInWithGoogleTo.bind(null, `/coaches/${profile.id}`)}>
              <Button type="submit" variant="outline" size="lg" className="h-11">
                Sign in to follow
              </Button>
            </form>
          )}
          <RequestCoachingDialog
            coachProfileId={profile.id}
            coachName={profile.name}
            isSignedIn={!!session?.user?.id}
          />
        </div>
      )}
    </main>
  );
}
