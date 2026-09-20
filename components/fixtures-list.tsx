import { MatchCard, type MatchCardData } from "@/components/match-card";
import { TbdMatchCard } from "@/components/tbd-match-card";
import { KNOCKOUT_ROUND_SEQUENCE, knockoutRoundsFromFirst } from "@/lib/algorithms/bracket";
import { Round, TournamentType } from "@/types";
import { roundLabel } from "@/utils/format";

const ROUND_ROBIN_KNOCKOUT_ORDER = [Round.LEAGUE, Round.SEMI_FINAL_1, Round.SEMI_FINAL_2, Round.FINAL];
const ROUND_ROBIN_KNOCKOUT_ROUNDS = [Round.SEMI_FINAL_1, Round.SEMI_FINAL_2, Round.FINAL];

export function FixturesList({
  matches,
  readOnly = false,
  tournamentType,
}: {
  matches: MatchCardData[];
  readOnly?: boolean;
  tournamentType?: string;
}) {
  let roundOrder: string[];
  let pendingCandidates: string[];

  if (tournamentType === TournamentType.ROUND_ROBIN_KNOCKOUT) {
    roundOrder = ROUND_ROBIN_KNOCKOUT_ORDER;
    pendingCandidates = ROUND_ROBIN_KNOCKOUT_ROUNDS;
  } else if (tournamentType === TournamentType.KNOCKOUT) {
    const presentRounds = matches.map((m) => m.round);
    const firstRound = KNOCKOUT_ROUND_SEQUENCE.find((r) => presentRounds.includes(r));
    const fullSequence = firstRound ? knockoutRoundsFromFirst(firstRound) : [];
    roundOrder = fullSequence;
    pendingCandidates = fullSequence;
  } else {
    roundOrder = [Round.LEAGUE];
    pendingCandidates = [];
  }

  const grouped = roundOrder.map((round) => ({
    round,
    matches: matches.filter((m) => m.round === round),
  })).filter((g) => g.matches.length > 0);

  const existingRounds = new Set(grouped.map((g) => g.round));
  const pendingRounds = pendingCandidates.filter((round) => !existingRounds.has(round));

  return (
    <div className="space-y-6">
      {grouped.map(({ round, matches }) => (
        <div key={round} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{roundLabel[round]}</h3>
          <div className="space-y-2">
            {matches.map((match, i) => (
              <MatchCard key={match.id} match={match} readOnly={readOnly} index={i} />
            ))}
          </div>
        </div>
      ))}

      {pendingRounds.map((round) => (
        <div key={round} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{roundLabel[round]}</h3>
          <div className="space-y-2">
            <TbdMatchCard />
          </div>
        </div>
      ))}
    </div>
  );
}
