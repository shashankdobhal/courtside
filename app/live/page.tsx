import Link from "next/link";
import { Radio } from "lucide-react";
import { getLivestreamTournaments } from "@/lib/actions/tournaments";
import { YoutubeEmbed } from "@/components/youtube-embed";
import { EmptyState } from "@/components/empty-state";
import { gameFormatLabel } from "@/lib/tournament-display";
import { formatDate } from "@/utils/format";
import { TournamentStatus } from "@/types";

export default async function LivePage() {
  const tournaments = await getLivestreamTournaments();
  const live = tournaments.filter((t) => t.status === TournamentStatus.ACTIVE);
  const past = tournaments.filter((t) => t.status !== TournamentStatus.ACTIVE);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <h1 className="font-heading text-2xl font-bold tracking-tight">Live</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Watch CourtSide games streaming on YouTube.
      </p>

      {tournaments.length === 0 ? (
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
              {live.map((t) => (
                <div key={t.id} className="space-y-2">
                  <YoutubeEmbed url={t.youtubeUrl} title={t.name} />
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/tournaments/${t.id}`} className="font-medium hover:underline">
                      {t.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {gameFormatLabel(t.format)}
                    </span>
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
                {past.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.id}`}
                    className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatDate(t.updatedAt)} · {gameFormatLabel(t.format)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-muted-foreground">Watch →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
