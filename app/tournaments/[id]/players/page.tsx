import { notFound, redirect } from "next/navigation";
import { getTournament } from "@/lib/actions/tournaments";
import { PlayerEntryForm } from "@/components/player-entry-form";
import { TournamentStatus } from "@/types";

export default async function PlayersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);

  if (!tournament) notFound();
  if (tournament.status !== TournamentStatus.PENDING) {
    redirect(`/tournaments/${tournament.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-14">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{tournament.name}</h1>
        <p className="text-sm text-muted-foreground">Add players to generate fixtures.</p>
      </div>
      <PlayerEntryForm tournamentId={tournament.id} tournamentType={tournament.type} />
    </main>
  );
}
