import { TournamentFormat, TournamentStatus, SkillLevel } from "@/types";

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

export const skillLevelLabel: Record<string, string> = {
  [SkillLevel.BEGINNER]: "Beginner",
  [SkillLevel.INTERMEDIATE]: "Intermediate",
  [SkillLevel.ADVANCED]: "Advanced",
  [SkillLevel.PROFESSIONAL]: "Professional",
};

export const skillLevelOptions = [
  SkillLevel.BEGINNER,
  SkillLevel.INTERMEDIATE,
  SkillLevel.ADVANCED,
  SkillLevel.PROFESSIONAL,
] as const;

/**
 * "Mode" on the invite share message — always derived from this
 * tournament's own format, since a single Tournament row is only ever one
 * format. A game spanning both belongs under an Event instead.
 */
export function inviteModeLabel(format: string): string {
  return format === TournamentFormat.DOUBLES ? "Doubles" : "Singles Only";
}
