import { cn } from "@/lib/utils";
import { KARMA_LEVELS } from "@/lib/algorithms/gamification";

/** A hunter-rank pill: colored letter badge + tier name, tinted per rank. */
export function RankBadge({
  levelIndex,
  className,
}: {
  levelIndex: number;
  className?: string;
}) {
  const tier = KARMA_LEVELS[levelIndex] ?? KARMA_LEVELS[0];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs font-semibold",
        tier.badgeClass,
        className
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-current/20 text-[10px] font-bold">
        {tier.letter}
      </span>
      {tier.name}
    </span>
  );
}
