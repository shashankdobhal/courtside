import Link from "next/link";
import { Trophy } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight transition-opacity hover:opacity-70"
        >
          <Trophy className="size-4" />
          CourtSide
        </Link>
      </div>
    </header>
  );
}
