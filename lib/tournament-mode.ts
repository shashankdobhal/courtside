import { TournamentFormat, TournamentType } from "@/types";

/**
 * Whether this tournament's roster is a flat list of individual players —
 * singles always, or a casual doubles session, where pairs are formed per
 * match on the fly (see resolveDoublesPairing) rather than registered
 * upfront. A tournament-style doubles event (round robin/knockout) instead
 * needs fixed teams as stable bracket/fixture entities.
 */
export function usesIndividualRoster(tournament: { format: string; type: string }): boolean {
  return tournament.format === TournamentFormat.SINGLES || tournament.type === TournamentType.SESSION;
}
