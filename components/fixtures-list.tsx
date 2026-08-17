import { MatchCard, type MatchCardData } from "@/components/match-card";
import { Round } from "@/types";
import { roundLabel } from "@/utils/format";

const ROUND_ORDER = [Round.LEAGUE, Round.SEMI_FINAL_1, Round.SEMI_FINAL_2, Round.FINAL];

export function FixturesList({
  matches,
  readOnly = false,
}: {
  matches: MatchCardData[];
  readOnly?: boolean;
}) {
  const grouped = ROUND_ORDER.map((round) => ({
    round,
    matches: matches.filter((m) => m.round === round),
  })).filter((g) => g.matches.length > 0);

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
    </div>
  );
}
