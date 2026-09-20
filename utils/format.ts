import { format } from "date-fns";
import { TournamentStatus, TournamentType } from "@/types";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function displayName(player: { name: string; alias?: string | null }): string {
  return player.alias?.trim() || player.name;
}

export function timeGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export const tournamentTypeLabel: Record<TournamentType, string> = {
  [TournamentType.ROUND_ROBIN]: "Everyone Plays Everyone",
  [TournamentType.ROUND_ROBIN_KNOCKOUT]: "Round Robin + Knockout",
  [TournamentType.KNOCKOUT]: "Knockout Bracket",
  [TournamentType.SESSION]: "Casual Session",
};

export const tournamentStatusLabel: Record<TournamentStatus, string> = {
  [TournamentStatus.PENDING]: "Pending",
  [TournamentStatus.ACTIVE]: "Active",
  [TournamentStatus.COMPLETED]: "Completed",
  [TournamentStatus.CANCELLED]: "Discontinued",
};

export const roundLabel: Record<string, string> = {
  LEAGUE: "League",
  SEMI_FINAL_1: "Semi Final 1",
  SEMI_FINAL_2: "Semi Final 2",
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTERFINAL: "Quarterfinal",
  SEMI_FINAL: "Semi Final",
  FINAL: "Final",
};
