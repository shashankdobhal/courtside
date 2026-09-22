import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getPlayerProfileStats } from "@/lib/actions/player-profiles";
import { getCoachInbox } from "@/lib/actions/coaches";
import { getFollowState } from "@/lib/actions/follows";
import { getProfileLearnPosts } from "@/lib/actions/learn";
import { prisma } from "@/lib/prisma";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import { ProfileEditor } from "@/components/profile-editor";
import { StatTile } from "@/components/stat-tile";
import { FollowButton } from "@/components/follow-button";
import { AddLearnPostDialog } from "@/components/add-learn-post-dialog";
import { DeleteLearnPostButton } from "@/components/delete-learn-post-button";
import { LearnPostCard } from "@/components/learn-post-card";
import { signInWithGoogleTo } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tournamentStatusLabel } from "@/utils/format";
import { skillLevelLabel } from "@/lib/tournament-display";
import { TournamentStatus, type SkillLevel } from "@/types";
import { Trophy, Flame } from "lucide-react";
import { auth } from "@/auth";

const statusVariant: Record<string, "secondary" | "default" | "outline"> = {
  [TournamentStatus.PENDING]: "outline",
  [TournamentStatus.ACTIVE]: "default",
  [TournamentStatus.COMPLETED]: "secondary",
  [TournamentStatus.CANCELLED]: "outline",
};

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const [data, session] = await Promise.all([getPlayerProfileStats(profileId), auth()]);

  if (!data) notFound();

  const { profile, stats, tournamentsWon, currentStreak, tournaments } = data;
  const winPct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  const isOwnProfile = !!session?.user?.id && profile.userId === session.user.id;
  const bioLine = [profile.playingStyle, profile.hometown, profile.company].filter(Boolean).join(" · ");
  const inbox = isOwnProfile && profile.isCoach ? await getCoachInbox(profile.id) : null;

  const viewerProfile =
    session?.user?.id && !isOwnProfile
      ? await prisma.playerProfile.findUnique({ where: { userId: session.user.id } })
      : null;
  const [{ followerCount, isFollowing }, learnPosts] = await Promise.all([
    isOwnProfile
      ? getFollowState(profile.id, null)
      : getFollowState(profile.id, viewerProfile?.id ?? null),
    getProfileLearnPosts(profile.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlayerAvatar name={profile.name} size="md" className="size-12 text-lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-bold tracking-tight">{profile.name}</h1>
                <Badge variant="outline">
                  {skillLevelLabel[profile.playingLevel as SkillLevel] ?? profile.playingLevel}
                </Badge>
                {profile.isCoach && <Badge variant="secondary">Coach</Badge>}
              </div>
              {bioLine && <p className="text-sm text-muted-foreground">{bioLine}</p>}
            </div>
          </div>
          {isOwnProfile && (
            <ProfileEditor
              profileId={profile.id}
              name={profile.name}
              bio={profile.bio}
              playingStyle={profile.playingStyle}
              hometown={profile.hometown}
              company={profile.company}
              upiId={profile.upiId}
              playingLevel={profile.playingLevel as SkillLevel}
              isCoach={profile.isCoach}
              coachYearsExperience={profile.coachYearsExperience}
              coachSkills={profile.coachSkills}
              coachAvailability={profile.coachAvailability}
              seasonOptIn={profile.seasonOptIn}
            />
          )}
        </div>

        {profile.isCoach && (
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
            {isOwnProfile && (
              <p>
                <Link
                  href={`/coaches/${profile.id}`}
                  className="text-primary underline underline-offset-2"
                >
                  View your public coach profile
                </Link>
              </p>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          {followerCount} follower{followerCount === 1 ? "" : "s"}
        </p>
      </div>

      {profile.bio && <p className="mb-6 text-sm text-foreground">{profile.bio}</p>}

      {!isOwnProfile && (
        <div className="mb-6">
          {session?.user?.id ? (
            <FollowButton profileId={profile.id} initiallyFollowing={isFollowing} />
          ) : (
            <form action={signInWithGoogleTo.bind(null, `/players/${profile.id}`)}>
              <Button type="submit" variant="outline" size="lg" className="h-11">
                Sign in to follow
              </Button>
            </form>
          )}
        </div>
      )}

      {inbox && (
        <div className="mb-8 space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Coaching requests</h2>
            {inbox.requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No coaching requests yet. They show up here — and as a push notification — as
                soon as someone reaches out.
              </p>
            ) : (
              <div className="space-y-2">
                {inbox.requests.map((r) => (
                  <Card key={r.id} className="flex-row items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.requesterName}</p>
                      <a
                        href={`tel:${r.requesterPhone}`}
                        className="text-sm text-primary underline underline-offset-2"
                      >
                        {r.requesterPhone}
                      </a>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(r.createdAt, { addSuffix: true })}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {inbox.followers.length > 0 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold tracking-tight">
                Followers ({inbox.followers.length})
              </h2>
              <p className="text-sm text-muted-foreground">
                {inbox.followers.map((f) => f.followerProfile.name).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Played" value={stats.played} />
        <StatTile label="Won" value={stats.won} />
        <StatTile label="Lost" value={stats.lost} />
        <StatTile label="Win %" value={`${winPct}%`} />
        <StatTile
          label="Point Diff"
          value={stats.pointDifference > 0 ? `+${stats.pointDifference}` : stats.pointDifference}
        />
        <StatTile label="Points Scored" value={stats.pointsFor} />
        <StatTile label="Points Conceded" value={stats.pointsAgainst} />
        <Card className="items-center gap-1 p-4 text-center">
          <p className="font-heading flex items-center gap-1 text-2xl font-bold">
            {tournamentsWon}
            <Trophy className="size-4 text-amber-500" />
          </p>
          <p className="text-xs text-muted-foreground">Tournaments Won</p>
        </Card>
      </div>

      {currentStreak > 0 && (
        <Badge variant="secondary" className="mb-8 gap-2">
          <Flame className="size-3.5 text-amber-500" />
          {currentStreak} tournament{currentStreak === 1 ? "" : "s"} won in a row
        </Badge>
      )}

      <h2 className="mb-3 text-lg font-semibold tracking-tight">Tournaments</h2>
      {tournaments.length === 0 ? (
        <EmptyState
          title="No tournaments yet"
          description="This player hasn't taken part in a tournament yet."
        />
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <Card className="flex-row items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate font-medium">{t.name}</p>
                  {t.isChampion && <Trophy className="size-3.5 shrink-0 text-amber-500" />}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {t.row && (
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {t.row.won}W - {t.row.lost}L
                    </span>
                  )}
                  <Badge variant={statusVariant[t.status] ?? "outline"}>
                    {tournamentStatusLabel[t.status as TournamentStatus] ?? t.status}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Learn</h2>
          {isOwnProfile && <AddLearnPostDialog profileId={profile.id} />}
        </div>
        {learnPosts.length === 0 ? (
          <EmptyState
            title="No Learn posts yet"
            description={
              isOwnProfile
                ? "Share a tip, drill, or video for other players."
                : "This player hasn't posted anything to Learn yet."
            }
          />
        ) : (
          <div className="space-y-3">
            {learnPosts.map((post) => (
              <LearnPostCard
                key={post.id}
                post={post}
                action={
                  isOwnProfile ? (
                    <DeleteLearnPostButton postId={post.id} title={post.title} />
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
