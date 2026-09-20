/**
 * Pulls a video id out of the handful of URL shapes YouTube hands out for
 * the same video (watch, share link, live, embed). Anything else is treated
 * as not a YouTube link — no video id fabricated from a partial match.
 */
export function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m)\./, "");

  if (host === "youtu.be") {
    return url.pathname.slice(1).split("/")[0] || null;
  }

  if (host === "youtube.com") {
    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }
    const match = url.pathname.match(/^\/(live|embed|shorts)\/([^/]+)/);
    if (match) return match[2];
  }

  return null;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
