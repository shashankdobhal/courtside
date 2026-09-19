import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/stat-tile";
import { Plus, Zap, Trophy, Swords } from "lucide-react";
import { getTournaments } from "@/lib/actions/tournaments";
import { TournamentCard } from "@/components/tournament-card";
import { EmptyState } from "@/components/empty-state";
import { TournamentStatus } from "@/types";
import { auth } from "@/auth";

export default async function HomePage() {
  const [tournaments, session] = await Promise.all([getTournaments(), auth()]);
  const userId = session?.user?.id;
  const firstName = session?.user?.name?.trim().split(" ")[0];

  const activeCount = tournaments.filter((t) => t.status === TournamentStatus.ACTIVE).length;
  const completedCount = tournaments.filter((t) => t.status === TournamentStatus.COMPLETED).length;
  const totalMatches = tournaments.reduce((sum, t) => sum + t._count.matches, 0);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <div className="mb-8 flex flex-col items-center gap-6 text-center sm:mb-10">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {firstName ? `Welcome back, ${firstName}` : "CourtSide"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Run casual tournaments — fixtures, scores, and standings in seconds.
          </p>
        </div>
        <Button asChild size="lg" className="h-12 px-8 text-base shadow-sm">
          <Link href="/tournaments/new">
            <Plus className="size-5" />
            Create Tournament
          </Link>
        </Button>
      </div>

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
