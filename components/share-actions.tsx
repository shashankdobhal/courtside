"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2, Link2, Printer } from "lucide-react";

export function ShareActions({ title }: { title: string }) {
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

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
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
  );
}
