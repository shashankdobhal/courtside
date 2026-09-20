import Link from "next/link";
import { getMyTournaments } from "@/lib/actions/tournaments";
import { getPlayerGamificationStats } from "@/lib/actions/gamification";
import { getMyProfileStats } from "@/lib/actions/player-profiles";
import { LandingPage } from "@/components/landing-page";
import { PrimaryGameActions } from "@/components/primary-game-actions";
import { ActiveGameCard } from "@/components/active-game-card";
import { RecentResultsList, type RecentResult } from "@/components/recent-results-list";
import { PersonalStatsTile } from "@/components/personal-stats-tile";
import { GamificationPanel } from "@/components/gamification-panel";
import { GameHistoryList } from "@/components/game-history-list";
import { EmptyState } from "@/components/empty-state";
import { timeGreeting } from "@/utils/format";
import { TournamentStatus } from "@/types";
import { auth } from "@/auth";

const HISTORY_LIMIT = 8;

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const firstName = session?.user?.name?.trim().split(" ")[0];

  if (!session?.user) {
    return <LandingPage />;
  }

  const [tournaments, gamificationStats, profileStats] = await Promise.all([
    getMyTournaments(userId!),
    getPlayerGamificationStats(userId!),
    getMyProfileStats(userId!),
  ]);

  const hasAnyGames = tournaments.length > 0;
  const activeGames = tournaments.filter(
    (t) => t.status === TournamentStatus.PENDING || t.status === TournamentStatus.ACTIVE
  );

  const profileTournamentsById = new Map(
    (profileStats?.tournaments ?? []).map((t) => [t.id, t])
  );
  const recentResults: RecentResult[] = tournaments
    .filter((t) => t.status === TournamentStatus.COMPLETED)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 4)
    .map((t) => {
      const played = profileTournamentsById.get(t.id);
      const subtext = played?.row
        ? `${played.row.played} match${played.row.played === 1 ? "" : "es"} · ${played.row.won} win${played.row.won === 1 ? "" : "s"}`
        : `${t._count.matches} match${t._count.matches === 1 ? "" : "es"}`;
      return {
        id: t.id,
        name: t.name,
        date: t.updatedAt,
        isChampion: played?.isChampion ?? false,
        subtext,
      };
    });

  const historyGames = tournaments.slice(0, HISTORY_LIMIT);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
      <div className="space-y-10 sm:space-y-14">
        <div>
          <h1 className="font-heading text-[28px] font-bold tracking-tight sm:text-[32px]">
            {hasAnyGames
              ? `${timeGreeting()}, ${firstName ?? "there"} 👋`
              : `Welcome to CourtSide, ${firstName ?? "there"} 👋`}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            {hasAnyGames
              ? "Here's what's happening on CourtSide."
              : "Your badminton games will live here. Start by joining a game or creating one."}
          </p>
        </div>

        <PrimaryGameActions joinFirst={!hasAnyGames} />

        {hasAnyGames && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
              Your Games
            </h2>
            {activeGames.length === 0 ? (
              <EmptyState
                title="No active games"
                description="You're not playing anything right now."
                action={<PrimaryGameActions joinFirst />}
              />
            ) : (
              <div className="space-y-3">
                {activeGames.map((t) => (
                  <ActiveGameCard
                    key={t.id}
                    tournament={t}
                    isOwner={!!userId && t.ownerId === userId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {recentResults.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
              Recent Results
            </h2>
            <RecentResultsList results={recentResults} />
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
            Your Badminton
          </h2>
          <PersonalStatsTile
            matches={profileStats?.stats.played ?? 0}
            wins={profileStats?.stats.won ?? 0}
            titles={profileStats?.tournamentsWon ?? 0}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
            Your Progress
          </h2>
          <GamificationPanel stats={gamificationStats} />
        </div>

        {hasAnyGames && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
              Game History
            </h2>
            <GameHistoryList games={historyGames} />
            {tournaments.length > HISTORY_LIMIT && (
              <Link
                href="/games"
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
