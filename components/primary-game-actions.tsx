import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JoinGameDialog } from "@/components/join-game-dialog";

export function PrimaryGameActions({ joinFirst = false }: { joinFirst?: boolean }) {
  const createButton = (
    <Button asChild size="lg" className="h-12 flex-1 text-base sm:flex-none sm:px-6">
      <Link href="/tournaments/new">
        <Plus className="size-5" />
        Create Game
      </Link>
    </Button>
  );
  const joinButton = <JoinGameDialog />;

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        {joinFirst ? (
          <>
            {joinButton}
            {createButton}
          </>
        ) : (
          <>
            {createButton}
            {joinButton}
          </>
        )}
      </div>
      <Link
        href="/events/new"
        className="block text-center text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:text-left"
      >
        Running Singles, Doubles, and more at once? Create an event instead →
      </Link>
    </div>
  );
}
