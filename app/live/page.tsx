import Link from "next/link";
import { Radio } from "lucide-react";
import { auth } from "@/auth";
import { getLivestreamTournaments } from "@/lib/actions/tournaments";
import { getPublicLivestreams } from "@/lib/actions/livestreams";
import { isSuperAdminEmail } from "@/lib/admin";
import { YoutubeEmbed } from "@/components/youtube-embed";
import { EmptyState } from "@/components/empty-state";
import { AddLivestreamButton } from "@/components/add-livestream-button";
import { LivestreamAdminControls } from "@/components/livestream-admin-controls";
import { gameFormatLabel } from "@/lib/tournament-display";
import { formatDate } from "@/utils/format";
import { TournamentStatus } from "@/types";

interface LiveItem {
  id: string;
  title: string;
  subtitle?: string;
  youtubeUrl: string;
  updatedAt: Date;
  isLive: boolean;
  href: string;
  isStandaloneStream: boolean;
}

export default async function LivePage() {
  const [tournaments, streams, session] = await Promise.all([
    getLivestreamTournaments(),
    getPublicLivestreams(),
    auth(),
  ]);
  const isAdmin = isSuperAdminEmail(session?.user?.email);

  const items: LiveItem[] = [
    ...tournaments.map((t) => ({
      id: t.id,
      title: t.name,
      subtitle: gameFormatLabel(t.format),
      youtubeUrl: t.youtubeUrl,
      updatedAt: t.updatedAt,
      isLive: t.status === TournamentStatus.ACTIVE,
      href: `/tournaments/${t.id}`,
      isStandaloneStream: false,
    })),
    ...streams.map((s) => ({
      id: s.id,
      title: s.title,
      youtubeUrl: s.youtubeUrl,
      updatedAt: s.updatedAt,
      isLive: s.isLive,
      href: s.youtubeUrl,
      isStandaloneStream: true,
    })),
  ];

  const live = items
    .filter((i) => i.isLive)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const past = items
    .filter((i) => !i.isLive)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Live</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Watch CourtSide games streaming on YouTube.
          </p>
        </div>
        {isAdmin && <AddLivestreamButton />}
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Radio}
            title="No streams yet"
            description="When an organizer adds a YouTube link to their game, it'll show up here."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {live.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                Live Now
              </h2>
              {live.map((item) => (
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
                    <div className="flex shrink-0 items-center gap-2">
                      {item.subtitle && (
                        <span className="text-sm text-muted-foreground">{item.subtitle}</span>
                      )}
                      {isAdmin && item.isStandaloneStream && (
                        <LivestreamAdminControls id={item.id} isLive />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                Past Streams
              </h2>
              <div className="divide-y rounded-2xl border bg-background">
                {past.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-4">
                    <Link
                      href={item.href}
                      target={item.isStandaloneStream ? "_blank" : undefined}
                      rel={item.isStandaloneStream ? "noopener noreferrer" : undefined}
                      className="min-w-0 flex-1 transition-colors hover:text-primary"
                    >
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(item.updatedAt)}
                        {item.subtitle ? ` · ${item.subtitle}` : ""}
                      </p>
                    </Link>
                    {isAdmin && item.isStandaloneStream ? (
                      <LivestreamAdminControls id={item.id} isLive={false} />
                    ) : (
                      <span className="shrink-0 text-sm text-muted-foreground">Watch →</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
