import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JoinGameDialog } from "@/components/join-game-dialog";
import { EventTeaserLink } from "@/components/event-teaser-link";

export function PrimaryGameActions({ joinFirst = false }: { joinFirst?: boolean }) {
  const createButton = (
    <Button asChild size="lg" className="h-12 w-full text-base sm:w-auto sm:px-6">
      <Link href="/tournaments/new">
        <Plus className="size-5" />
        Create Game
      </Link>
    </Button>
  );
  const joinButton = <JoinGameDialog />;

  return (
    <div className="space-y-3">
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
      <EventTeaserLink />
    </div>
  );
}
