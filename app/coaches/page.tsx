import Link from "next/link";
import { getCoachDirectory } from "@/lib/actions/player-profiles";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default async function CoachesPage() {
  const coaches = await getCoachDirectory();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Coaches</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Players offering coaching. Reach out directly to book a session.
        </p>
      </div>

      {coaches.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No coaches on CourtSide yet"
          description="Nobody has listed themselves as a coach so far. Do you coach? Add your skills and availability from your own profile page to be the first."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {coaches.map((coach) => (
            <Link key={coach.id} href={`/coaches/${coach.id}`}>
              <Card className="h-full gap-3 p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <PlayerAvatar name={coach.name} size="md" />
                  <div>
                    <p className="font-medium">{coach.name}</p>
                    {coach.coachYearsExperience != null && (
                      <p className="text-xs text-muted-foreground">
                        {coach.coachYearsExperience} year
                        {coach.coachYearsExperience === 1 ? "" : "s"} coaching
                      </p>
                    )}
                  </div>
                </div>
                {coach.coachSkills && (
                  <p className="text-sm text-foreground">{coach.coachSkills}</p>
                )}
                {coach.coachAvailability && (
                  <p className="text-xs text-muted-foreground">{coach.coachAvailability}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
