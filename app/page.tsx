import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Trophy } from "lucide-react";
import { getTournaments } from "@/lib/actions/tournaments";
import { TournamentCard } from "@/components/tournament-card";
import { EmptyState } from "@/components/empty-state";

export default async function HomePage() {
  const tournaments = await getTournaments();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <div className="mb-10 flex flex-col items-center gap-6 text-center sm:mb-14">
        <div className="flex items-center gap-2">
          <Trophy className="size-7" />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">CourtSide</h1>
        </div>
        <Button asChild size="lg" className="h-12 px-8 text-base">
          <Link href="/tournaments/new">
            <Plus className="size-5" />
            Create Tournament
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {tournaments.length > 0 ? "Previous tournaments" : "No tournaments yet"}
        </h2>

        {tournaments.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="Create your first tournament to start adding players and generating fixtures."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
