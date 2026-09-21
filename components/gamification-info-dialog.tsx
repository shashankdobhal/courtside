"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RankBadge } from "@/components/rank-badge";
import { KARMA_LEVELS, KARMA_BREAKDOWN } from "@/lib/algorithms/gamification";
import { Info, Flame, Sparkles, Trophy } from "lucide-react";

export function GamificationInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="How progress works"
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Info className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Climb the Ranks</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          <p className="text-muted-foreground">
            Every match earns karma. Rack up enough and you level up from{" "}
            <span className="font-medium text-foreground">E-Rank</span> all the way to{" "}
            <span className="font-medium text-foreground">S-Rank</span> — quick at first, then
            a real grind the higher you climb.
          </p>

          <div className="space-y-2 rounded-lg border p-3">
            <p className="flex items-center gap-2 font-medium">
              <Sparkles className="size-4 text-violet-500" />
              How you earn karma
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>+{KARMA_BREAKDOWN.perMatch} for every match you play</li>
              <li>+{KARMA_BREAKDOWN.perWin} for every match you win</li>
              <li>+{KARMA_BREAKDOWN.perStreakDay} for every day of your current streak</li>
            </ul>
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <p className="flex items-center gap-2 font-medium">
              <Flame className="size-4 text-amber-500" />
              Keep your streak alive
            </p>
            <p className="text-muted-foreground">
              Play at least one match a day to build your streak. You get one day of grace —
              miss two in a row and it resets.
            </p>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-2 font-medium">
              <Trophy className="size-4 text-amber-500" />
              The rank ladder
            </p>
            <div className="space-y-1.5">
              {KARMA_LEVELS.map((tier, i) => (
                <div key={tier.letter} className="flex items-center justify-between gap-2">
                  <RankBadge levelIndex={i} />
                  <span className="text-xs text-muted-foreground">
                    {tier.minKarma === 0 ? "Start here" : `${tier.minKarma}+ karma`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
