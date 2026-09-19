import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/player-avatar";
import { JoinInviteCard } from "@/components/join-invite-card";
import { signInWithGoogle } from "@/lib/actions/auth";
import { Swords, BarChart3, Trophy, ChevronDown, Flame, Sparkles } from "lucide-react";

const loopSteps = [
  { icon: Swords, title: "PLAY", description: "Join tournaments and casual doubles sessions." },
  { icon: BarChart3, title: "TRACK", description: "Follow live scores, fixtures and standings." },
  { icon: Trophy, title: "BUILD", description: "Every match becomes part of your badminton record." },
];

const tournamentSteps = ["Players", "Fixtures", "Scores", "Champion"];
const doublesSteps = ["Pair teams", "Play", "Log score", "Play again"];
const karmaLevels = ["Rookie", "Rising Star", "Court Regular", "Smash Master", "Court Legend"];

function Stepper({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium">{step}</span>
          {i < steps.length - 1 && <ChevronDown className="size-3.5 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <div className="mx-auto w-full max-w-3xl px-5 pt-14 pb-10 text-center sm:px-8 sm:pt-24 sm:pb-14">
        <div className="mx-auto max-w-[760px] duration-500 animate-in fade-in slide-in-from-bottom-2">
          <h1 className="font-heading text-[42px] leading-[1.05] font-extrabold tracking-tight sm:text-[64px]">
            Your next badminton game, organized.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
            Create a tournament, join a game, track every score — and build your badminton
            history as you play.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-12 w-full px-7 text-base sm:w-auto">
              <Link href="/#join">Join a Tournament</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 w-full px-7 text-base sm:w-auto">
              <Link href="/tournaments/new">Create a Game</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free · No app download · Works on your phone
          </p>
        </div>
      </div>

      {/* Join invite card */}
      <div className="mx-auto w-full max-w-3xl px-5 pb-14 sm:px-8 sm:pb-20">
        <JoinInviteCard />
      </div>

      {/* One place for every game */}
      <div className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-heading text-[30px] font-bold tracking-tight sm:text-[40px]">
            One place for every game you play.
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            CourtSide keeps your games, scores and badminton history together.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
          {loopSteps.map((step) => (
            <Card key={step.title} className="items-center gap-2 p-6 text-center">
              <step.icon className="size-6 text-primary" />
              <p className="text-sm font-semibold tracking-wide">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Player identity */}
      <div className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-heading text-[30px] font-bold tracking-tight sm:text-[40px]">
            Every game becomes part of your record.
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Your CourtSide identity follows you from game to game — across tournaments, sessions
            and doubles matches.
          </p>
        </div>

        <Card className="mx-auto mt-10 max-w-sm gap-5 p-6">
          <div className="flex items-center gap-3">
            <PlayerAvatar name="Jordan Lee" size="md" className="size-14 text-lg" />
            <div>
              <p className="text-lg font-semibold">Jordan Lee</p>
              <p className="text-sm text-muted-foreground">🏸 Court Regular</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-heading text-2xl font-bold">27</p>
              <p className="text-xs text-muted-foreground">Matches</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold">18</p>
              <p className="text-xs text-muted-foreground">Wins</p>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold">66.7%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
          </div>
          <p className="text-center text-sm font-medium">🏆 3 Championships</p>
          <p className="text-center text-xs text-muted-foreground">Example profile — not real data</p>
        </Card>
        <p className="mt-4 text-center">
          <Link href="/leaderboard" className="text-sm font-medium text-primary hover:underline">
            View profile →
          </Link>
        </p>
      </div>

      {/* Tournament vs Doubles */}
      <div className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-heading text-[30px] font-bold tracking-tight sm:text-[40px]">
            Play your way.
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Whether you&apos;re running a tournament or just getting a few games in, CourtSide
            keeps it simple.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Card className="gap-4 p-6">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-xl font-semibold">Tournament</p>
              <p className="mt-1 text-sm text-muted-foreground">
                For competitive events with fixtures, standings and winners.
              </p>
            </div>
            <Stepper steps={tournamentSteps} />
            <p className="text-xs text-muted-foreground">Round robin · Knockout</p>
            <Button asChild variant="outline" className="mt-1 w-full">
              <Link href="/tournaments/new">Create Tournament →</Link>
            </Button>
          </Card>

          <Card className="gap-4 p-6">
            <span className="text-3xl">🏸</span>
            <div>
              <p className="text-xl font-semibold">Doubles Session</p>
              <p className="mt-1 text-sm text-muted-foreground">
                For casual badminton where teams play whoever is next.
              </p>
            </div>
            <Stepper steps={doublesSteps} />
            <p className="text-xs text-muted-foreground">Flexible · No bracket</p>
            <Button asChild variant="outline" className="mt-1 w-full">
              <Link href="/tournaments/new">Start a Session →</Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* Gamification */}
      <div className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-heading text-[30px] font-bold tracking-tight sm:text-[40px]">
            Keep playing. Keep climbing.
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Your activity builds streaks, karma and badminton milestones.
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-2 gap-y-3">
          {karmaLevels.map((level, i) => (
            <div key={level} className="flex items-center gap-2">
              <span className="rounded-full border bg-background px-3 py-1.5 text-sm font-medium">
                {level}
              </span>
              {i < karmaLevels.length - 1 && (
                <span className="text-muted-foreground">→</span>
              )}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <Flame className="size-4 text-amber-500" />
              <span className="text-sm font-semibold">7 day streak</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="h-2 w-4 rounded-full bg-amber-400" />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-violet-500" />
              <span className="text-sm font-semibold">Karma</span>
            </div>
            <p className="font-heading text-xl font-bold">1,240</p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="mx-auto w-full max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <h2 className="font-heading text-[30px] font-bold tracking-tight sm:text-[40px]">
          Ready for your next game?
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-base text-muted-foreground sm:text-lg">
          Join a game, create a session, and start building your CourtSide record.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          <Button asChild size="lg" className="h-12 w-full max-w-xs px-7 text-base sm:w-auto">
            <Link href="/#join">Join a Tournament</Link>
          </Button>
          <Link href="/tournaments/new" className="text-sm font-medium text-primary hover:underline">
            Create a Game →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-8">
          <div>
            <p className="font-heading text-sm font-bold tracking-tight">🏸 CourtSide</p>
            <p className="mt-1 text-sm text-muted-foreground">Badminton, organized.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <form action={signInWithGoogle}>
              <button type="submit" className="text-muted-foreground hover:text-foreground">
                Sign In
              </button>
            </form>
            <Link href="/#join" className="text-muted-foreground hover:text-foreground">
              Join a Game
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
        <div className="border-t px-5 py-4 text-center text-xs text-muted-foreground sm:px-8">
          © 2026 CourtSide
        </div>
      </footer>
    </main>
  );
}
