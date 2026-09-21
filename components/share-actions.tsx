"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2, Link2, Printer } from "lucide-react";
import { formatInviteDate, formatInviteTime } from "@/utils/format";
import { skillLevelLabel, inviteModeLabel } from "@/lib/tournament-display";

export function ShareActions({
  title,
  joinCode,
  venue,
  scheduledAt,
  skillLevels,
  format,
}: {
  title: string;
  joinCode?: string;
  venue?: string | null;
  scheduledAt?: Date | null;
  skillLevels?: string[];
  format?: string;
}) {
  /**
   * The templated invite text only makes sense when there's a joinCode —
   * that's what distinguishes an invite-to-join share (this dialog, before
   * the game starts) from a results recap share (/tournaments/[id]/share,
   * after it's over), which keeps the plain title+url behavior.
   */
  const buildMessage = (url: string) => {
    if (!joinCode) return url;

    const lines = [`You are invited for a game/tournament :`, ""];
    // Date always shows — today's date stands in until the organizer sets one.
    lines.push(`Date : ${formatInviteDate(scheduledAt ?? new Date())}`);
    if (venue) lines.push(`Venue : ${venue}`);
    if (scheduledAt) lines.push(`Time : ${formatInviteTime(scheduledAt)}`);
    if (skillLevels && skillLevels.length > 0) {
      lines.push(`Level : ${skillLevels.map((l) => skillLevelLabel[l] ?? l).join("/")}`);
    }
    if (format) lines.push(`Mode : ${inviteModeLabel(format)}`);
    lines.push("", `Use below link to join the game : ${url}`);
    return lines.join("\n");
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = buildMessage(url);
    if (navigator.share) {
      try {
        await navigator.share(joinCode ? { title, text } : { title, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success(joinCode ? "Invite copied to clipboard" : "Link copied to clipboard");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildMessage(window.location.href));
    toast.success(joinCode ? "Invite copied to clipboard" : "Link copied to clipboard");
  };

  const handleCopyCode = async () => {
    if (!joinCode) return;
    await navigator.clipboard.writeText(joinCode);
    toast.success("Game code copied");
  };

  return (
    <div className="space-y-3 print:hidden">
      {joinCode && (
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex w-full flex-col items-center gap-1 rounded-xl border bg-muted/30 py-4 transition-colors hover:bg-muted/50"
        >
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Game code
          </span>
          <span className="font-heading text-3xl font-bold tracking-[0.3em]">{joinCode}</span>
        </button>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={handleShare}>
          <Share2 className="size-4" />
          Share
        </Button>
        <Button variant="secondary" onClick={handleCopy}>
          <Link2 className="size-4" />
          Copy Link
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>
    </div>
  );
}
