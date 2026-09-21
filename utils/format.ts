import { format } from "date-fns";
import { TournamentStatus, TournamentType } from "@/types";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

/** "21Sep2026" — the compact date form used in the invite share message. */
export function formatInviteDate(date: Date | string): string {
  return format(new Date(date), "d") + format(new Date(date), "MMM") + format(new Date(date), "yyyy");
}

/** "9:30pm" — the compact time form used in the invite share message. */
export function formatInviteTime(date: Date | string): string {
  return format(new Date(date), "h:mm") + format(new Date(date), "a").toLowerCase();
}

/**
 * A `<input type="datetime-local">`'s raw value has no timezone — parsing
 * it is only correct in the browser that produced it (the organizer's own
 * local time). Converting to an absolute ISO instant here, client-side,
 * before it ever reaches the server, is what makes the stored moment
 * unambiguous regardless of the server's own timezone.
 */
export function toIsoOrEmpty(datetimeLocalValue: string): string {
  if (!datetimeLocalValue) return "";
  const date = new Date(datetimeLocalValue);
  return isNaN(date.getTime()) ? "" : date.toISOString();
}

/** The inverse of toIsoOrEmpty — prefills a datetime-local input from a stored Date. */
export function toDatetimeLocalValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
