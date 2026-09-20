"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2, Link2, Printer } from "lucide-react";

export function ShareActions({ title, joinCode }: { title: string; joinCode?: string }) {
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
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
