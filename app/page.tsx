import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/stat-tile";
import { Plus, Zap, Trophy, Swords } from "lucide-react";
import { getMyTournaments } from "@/lib/actions/tournaments";
import { TournamentCard } from "@/components/tournament-card";
import { EmptyState } from "@/components/empty-state";
import { LandingPage } from "@/components/landing-page";
import { GamificationPanel } from "@/components/gamification-panel";
import { getPlayerGamificationStats } from "@/lib/actions/gamification";
import { TournamentStatus } from "@/types";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const firstName = session?.user?.name?.trim().split(" ")[0];

  if (!session?.user) {
    return <LandingPage />;
  }

  const [tournaments, gamificationStats] = await Promise.all([
    getMyTournaments(userId!),
    getPlayerGamificationStats(userId!),
  ]);

  const activeCount = tournaments.filter((t) => t.status === TournamentStatus.ACTIVE).length;
  const completedCount = tournaments.filter((t) => t.status === TournamentStatus.COMPLETED).length;
  const totalMatches = tournaments.reduce((sum, t) => sum + t._count.matches, 0);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <div className="relative mb-8 overflow-hidden rounded-3xl border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent px-6 py-10 text-center sm:mb-10 sm:py-14">
        <div className="relative flex flex-col items-center gap-6">
          <div className="space-y-1.5">
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {firstName ? `Welcome back, ${firstName}` : "CourtSide"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Run casual tournaments — fixtures, scores, and standings in seconds.
            </p>
          </div>
          <Button asChild size="lg" className="h-12 px-8 text-base shadow-md shadow-primary/20">
            <Link href="/tournaments/new">
              <Plus className="size-5" />
              Create Tournament
            </Link>
          </Button>
        </div>
      </div>

      <GamificationPanel stats={gamificationStats} />

      {tournaments.length > 0 && (
        <div className="mb-10 grid grid-cols-3 gap-3">
          <StatTile label="Active" value={activeCount} icon={Zap} accent={activeCount > 0} />
          <StatTile label="Completed" value={completedCount} icon={Trophy} />
          <StatTile label="Matches" value={totalMatches} icon={Swords} />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {tournaments.length > 0 ? "Your Tournaments" : "No tournaments yet"}
        </h2>

        {tournaments.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="Create your first tournament to start adding players and generating fixtures."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} isOwner={!!userId && t.ownerId === userId} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
