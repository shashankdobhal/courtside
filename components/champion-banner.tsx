"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export function ChampionBanner({ name, tournamentId }: { name: string; tournamentId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const key = `courtside-confetti-${tournamentId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    confetti({ particleCount: 100, spread: 80, startVelocity: 45, origin: { y: 0.4 } });
    confetti({ particleCount: 60, spread: 120, startVelocity: 35, origin: { y: 0.4 }, scalar: 0.8 });
  }, [tournamentId]);

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-gradient-to-b from-amber-50 to-transparent py-8 text-center duration-500 animate-in fade-in zoom-in-95 dark:from-amber-950/20">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Champion
      </p>
      <p className="text-2xl font-semibold">🏆 {name}</p>
    </div>
  );
}
