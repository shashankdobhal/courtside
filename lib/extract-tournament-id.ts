/**
 * Pulls a tournament id out of whatever someone pastes — a full invite URL
 * (any host), a bare id, or a path fragment. Shared by the signed-out
 * landing page's join card and the signed-in "Join Game" dialog so both
 * route into the same existing /tournaments/[id]/players entry point.
 */
export function extractTournamentId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const tournamentPathMatch = trimmed.match(/\/tournaments\/([a-zA-Z0-9_-]+)/);
  if (tournamentPathMatch) return tournamentPathMatch[1];

  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;

  return null;
}
