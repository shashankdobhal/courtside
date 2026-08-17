import { notFound } from "next/navigation";
import { getTournament } from "@/lib/actions/tournaments";
import { calculateStandings, calculateChampion } from "@/lib/algorithms/standings";
import { StandingsTable } from "@/components/standings-table";
import { ShareActions } from "@/components/share-actions";
import { MatchStatus, Round } from "@/types";
import { formatDate, roundLabel } from "@/utils/format";
import { Trophy } from "lucide-react";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const playersById = new Map(tournament.players.map((p) => [p.id, p]));
  const standings = calculateStandings(tournament.players, tournament.matches);
  const champion = calculateChampion({
    type: tournament.type,
    standings,
    matches: tournament.matches,
  });

  const roundOrder: string[] = [Round.LEAGUE, Round.SEMI_FINAL_1, Round.SEMI_FINAL_2, Round.FINAL];
  const completedMatches = tournament.matches
    .filter((m) => m.status === MatchStatus.COMPLETED)
    .sort(
      (a, b) =>
        roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round) || a.matchOrder - b.matchOrder
    );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-14 print:py-4">
      <div className="mb-8 space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{tournament.name}</h1>
        <p className="text-sm text-muted-foreground">{formatDate(tournament.createdAt)}</p>
      </div>

      {champion && (
        <div className="mb-8 flex flex-col items-center gap-2 rounded-xl border bg-gradient-to-b from-amber-50 to-transparent py-8 text-center dark:from-amber-950/20 print:border-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Champion
          </p>
          <p className="text-2xl font-semibold">🏆 {champion.name}</p>
        </div>
      )}

      <div className="mb-4">
        <ShareActions title={tournament.name} />
      </div>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Final Standings</h2>
          <StandingsTable standings={standings} />
        </section>

        {completedMatches.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Completed Matches</h2>
            <div className="divide-y rounded-lg border">
              {completedMatches.map((m) => {
                const p1 = playersById.get(m.player1Id);
                const p2 = m.player2Id ? playersById.get(m.player2Id) : null;
                const p1Wins = m.winnerId === m.player1Id;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">
                      {roundLabel[m.round] ?? m.round}
                    </span>
                    <span className={`flex-1 truncate text-right ${p1Wins ? "font-semibold" : ""}`}>
                      {p1?.name}
                    </span>
                    <Trophy
                      className={`size-3.5 shrink-0 ${p1Wins ? "text-amber-500" : "opacity-0"}`}
                    />
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {m.score1} – {m.score2}
                    </span>
                    <Trophy
                      className={`size-3.5 shrink-0 ${!p1Wins ? "text-amber-500" : "opacity-0"}`}
                    />
                    <span className={`flex-1 truncate ${!p1Wins ? "font-semibold" : ""}`}>
                      {p2?.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
