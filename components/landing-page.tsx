import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/actions/auth";
import {
  Trophy,
  Swords,
  TrendingUp,
  BarChart3,
  Users,
  ListChecks,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Swords,
    title: "Singles & Doubles",
    description: "Head-to-head fixtures, or team up in pairs for a casual doubles session.",
    bg: "bg-primary/10",
    fg: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Live Standings",
    description: "Every score updates the table instantly — know exactly where you stand.",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    fg: "text-sky-600 dark:text-sky-400",
  },
  {
    icon: Trophy,
    title: "Best-of-Three Finals",
    description: "Turn up the drama for semis and the final with a full best-of-three.",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    fg: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: BarChart3,
    title: "Weekly Leaderboard",
    description: "Climb the season leaderboard as you rack up wins, week over week.",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    fg: "text-violet-600 dark:text-violet-400",
  },
];

const steps = [
  { icon: Users, text: "Sign in and start a tournament" },
  { icon: ListChecks, text: "Add players, generate fixtures" },
  { icon: Sparkles, text: "Log scores, watch it play out" },
];

export function LandingPage({
  stats,
}: {
  stats: { tournaments: number; matches: number; players: number } | null;
}) {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <div className="relative mb-10 overflow-hidden rounded-3xl border px-6 py-14 text-center sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 60% at 20% -10%, color-mix(in oklch, var(--primary) 30%, transparent), transparent 65%), radial-gradient(ellipse 70% 50% at 85% 0%, color-mix(in oklch, oklch(0.83 0.15 80) 45%, transparent), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 110%, color-mix(in oklch, oklch(0.7 0.15 300) 30%, transparent), transparent 65%)",
            }}
          />
          <div className="relative flex flex-col items-center gap-6">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-background text-3xl shadow-lg ring-1 ring-foreground/10">
              🏸
            </div>
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                Your badminton crew&apos;s
                <br />
                new home court
              </h1>
              <p className="mx-auto max-w-sm text-base text-muted-foreground">
                Run tournaments, settle rivalries, and see who&apos;s really the best on court —
                all in seconds, right from your phone.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <form action={signInWithGoogle}>
                <Button type="submit" size="lg" className="h-12 px-8 text-base shadow-md shadow-primary/20">
                  Sign in with Google
                </Button>
              </form>
              <Button asChild variant="ghost" size="lg" className="h-12 px-6 text-base">
                <Link href="/leaderboard">See the Leaderboard →</Link>
              </Button>
            </div>
          </div>
        </div>

        {stats && (stats.tournaments > 0 || stats.matches > 0) && (
          <div className="mb-10 grid grid-cols-3 gap-3">
            {[
              { label: "Tournaments", value: stats.tournaments },
              { label: "Matches Played", value: stats.matches },
              { label: "Players", value: stats.players },
            ].map((s) => (
              <Card key={s.label} className="items-center gap-1 p-4 text-center">
                <p className="font-heading text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>
        )}

        <div className="mb-10 space-y-3">
          <h2 className="text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Everything you need on match day
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title} className="gap-3 p-5">
                <div className={`flex size-10 items-center justify-center rounded-xl ${f.bg}`}>
                  <f.icon className={`size-5 ${f.fg}`} />
                </div>
                <div className="space-y-1">
                  <p className="font-heading font-semibold">{f.title}</p>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-10 overflow-hidden rounded-3xl border bg-gradient-to-b from-primary/5 to-transparent p-6 sm:p-8">
          <h2 className="mb-6 text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Up and running in three steps
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.text} className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="size-5" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Step {i + 1}</p>
                <p className="text-sm font-medium">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-3xl border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent px-6 py-10 text-center">
          <p className="font-heading text-xl font-bold tracking-tight">Ready to smash it?</p>
          <form action={signInWithGoogle}>
            <Button type="submit" size="lg" className="h-12 px-8 text-base shadow-md shadow-primary/20">
              Sign in with Google
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
