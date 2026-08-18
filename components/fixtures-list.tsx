import { MatchCard, type MatchCardData } from "@/components/match-card";
import { TbdMatchCard } from "@/components/tbd-match-card";
import { Round, TournamentType } from "@/types";
import { roundLabel } from "@/utils/format";

const ROUND_ORDER = [Round.LEAGUE, Round.SEMI_FINAL_1, Round.SEMI_FINAL_2, Round.FINAL];
const KNOCKOUT_ROUNDS = [Round.SEMI_FINAL_1, Round.SEMI_FINAL_2, Round.FINAL];

export function FixturesList({
  matches,
  readOnly = false,
  tournamentType,
}: {
  matches: MatchCardData[];
  readOnly?: boolean;
  tournamentType?: string;
}) {
  const grouped = ROUND_ORDER.map((round) => ({
    round,
    matches: matches.filter((m) => m.round === round),
  })).filter((g) => g.matches.length > 0);

  const existingRounds = new Set(grouped.map((g) => g.round));
  const isKnockout = tournamentType === TournamentType.ROUND_ROBIN_KNOCKOUT;
  const pendingRounds = isKnockout
    ? KNOCKOUT_ROUNDS.filter((round) => !existingRounds.has(round))
    : [];

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
