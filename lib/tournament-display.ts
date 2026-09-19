import { TournamentFormat, TournamentStatus } from "@/types";

/**
 * Short umbrella label for a game's format, used on the homepage where the
 * spec calls for "Tournament"/"Doubles" instead of the more technical
 * round-robin/knockout wording used inside a tournament itself.
 */
export function gameFormatLabel(format: string): string {
  return format === TournamentFormat.DOUBLES ? "Doubles" : "Tournament";
}

/** Where a game's "Open"/"Continue Setup" action should route to. */
export function gameHref(tournament: { id: string; status: string }): string {
  return tournament.status === TournamentStatus.PENDING
    ? `/tournaments/${tournament.id}/players`
    : `/tournaments/${tournament.id}`;
}
