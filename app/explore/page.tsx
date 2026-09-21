import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Compass, Radio, Newspaper, GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import { getLivestreamTournaments } from "@/lib/actions/tournaments";
import { getPublicLivestreams } from "@/lib/actions/livestreams";
import { getNewsFeed } from "@/lib/actions/news";
import { getCoachDirectory } from "@/lib/actions/player-profiles";
import { getLearnFeed } from "@/lib/actions/learn";
import { PlayerAvatar } from "@/components/player-avatar";
import { YoutubeEmbed } from "@/components/youtube-embed";
import { LearnPostCard } from "@/components/learn-post-card";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LazyList } from "@/components/lazy-list";
import { gameFormatLabel } from "@/lib/tournament-display";
import { TournamentStatus } from "@/types";

export default async function ExplorePage() {
  const [tournaments, streams, newsItems, coaches, learnPosts] = await Promise.all([
    getLivestreamTournaments(),
    getPublicLivestreams(),
    getNewsFeed(),
    getCoachDirectory(),
    getLearnFeed(),
  ]);

  const allLiveItems = [
    ...tournaments.map((t) => ({
      id: t.id,
      title: t.name,
      subtitle: gameFormatLabel(t.format) as string | undefined,
      youtubeUrl: t.youtubeUrl,
      isLive: t.status === TournamentStatus.ACTIVE,
      updatedAt: t.updatedAt,
      href: `/tournaments/${t.id}`,
      isStandaloneStream: false,
    })),
    ...streams.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: undefined as string | undefined,
      youtubeUrl: s.youtubeUrl,
      isLive: s.isLive,
      updatedAt: s.updatedAt,
      href: s.youtubeUrl,
      isStandaloneStream: true,
    })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const liveNow = allLiveItems.filter((i) => i.isLive);
  const pastStreams = allLiveItems.filter((i) => !i.isLive);

  const pastStreamNodes = pastStreams.map((item) => (
    <Link
      key={item.id}
      href={item.href}
      target={item.isStandaloneStream ? "_blank" : undefined}
      rel={item.isStandaloneStream ? "noopener noreferrer" : undefined}
      className="block"
    >
      <Card className="flex-row items-center justify-between gap-2 p-4 transition-colors hover:bg-muted/50">
        <div className="min-w-0">
          <p className="truncate font-medium">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDistanceToNow(item.updatedAt, { addSuffix: true })}
            {item.subtitle ? ` · ${item.subtitle}` : ""}
          </p>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">Watch →</span>
      </Card>
    </Link>
  ));

  const newsNodes = newsItems.map((item) => (
    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block">
      <Card className="flex-row items-center gap-3 p-4 transition-colors hover:bg-muted/50">
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {item.sourceName} · {formatDistanceToNow(item.publishedAt, { addSuffix: true })}
          </p>
          <p className="mt-0.5 line-clamp-2 font-medium">{item.title}</p>
        </div>
      </Card>
    </a>
  ));

  const coachNodes = coaches.map((coach) => (
    <Link key={coach.id} href={`/coaches/${coach.id}`} className="block">
      <Card className="flex-row items-center gap-3 p-4 transition-colors hover:bg-muted/50">
        <PlayerAvatar name={coach.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{coach.name}</p>
          {coach.coachSkills && (
            <p className="truncate text-xs text-muted-foreground">{coach.coachSkills}</p>
          )}
        </div>
      </Card>
    </Link>
  ));

  const learnNodes = learnPosts.map((post) => <LearnPostCard key={post.id} post={post} />);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Compass className="size-5 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Explore</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          What&apos;s happening around CourtSide right now.
        </p>
      </div>

      <Tabs defaultValue="live">
        <TabsList className="mb-4 grid w-full grid-cols-4">
          <TabsTrigger value="live">
            <Radio className="size-3.5" />
            Live
          </TabsTrigger>
          <TabsTrigger value="news">
            <Newspaper className="size-3.5" />
            News
          </TabsTrigger>
          <TabsTrigger value="learn">
            <BookOpen className="size-3.5" />
            Learn
          </TabsTrigger>
          <TabsTrigger value="coaches">
            <GraduationCap className="size-3.5" />
            Coaches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          {liveNow.length === 0 && pastStreams.length === 0 ? (
            <EmptyState
              icon={Radio}
              title="No streams yet"
              description="When an organizer adds a YouTube link to their game, it'll show up here."
            />
          ) : (
            <>
              {liveNow.length > 0 && (
                <div className="space-y-4">
                  {liveNow.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <YoutubeEmbed url={item.youtubeUrl} title={item.title} />
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={item.href}
                          target={item.isStandaloneStream ? "_blank" : undefined}
                          rel={item.isStandaloneStream ? "noopener noreferrer" : undefined}
                          className="min-w-0 truncate font-medium hover:underline"
                        >
                          {item.title}
                        </Link>
                        {item.subtitle && (
                          <span className="shrink-0 text-sm text-muted-foreground">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pastStreamNodes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                    Past Streams
                  </h3>
                  <LazyList items={pastStreamNodes} pageSize={6} className="space-y-3" />
                </div>
              )}

              <ExploreMoreLink href="/live" />
            </>
          )}
        </TabsContent>

        <TabsContent value="news" className="space-y-3">
          {newsNodes.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title="No news yet"
              description="Headlines refresh a few times a day — check back soon."
            />
          ) : (
            <>
              <LazyList items={newsNodes} pageSize={6} className="space-y-3" />
              <ExploreMoreLink href="/news" />
            </>
          )}
        </TabsContent>

        <TabsContent value="learn" className="space-y-3">
          {learnNodes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Learn posts yet"
              description="When a player shares a tip or video, it'll show up here."
            />
          ) : (
            <>
              <LazyList items={learnNodes} pageSize={6} className="space-y-3" />
              <ExploreMoreLink href="/learn" />
            </>
          )}
        </TabsContent>

        <TabsContent value="coaches" className="space-y-3">
          {coachNodes.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No coaches on CourtSide yet"
              description="Nobody has listed themselves as a coach so far."
            />
          ) : (
            <>
              <LazyList items={coachNodes} pageSize={8} className="space-y-3" />
              <ExploreMoreLink href="/coaches" />
            </>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

function ExploreMoreLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-primary hover:underline"
    >
      Explore more
      <ArrowRight className="size-3.5" />
    </Link>
  );
}
