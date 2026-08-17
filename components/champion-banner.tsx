export function ChampionBanner({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-gradient-to-b from-amber-50 to-transparent py-8 text-center dark:from-amber-950/20">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Champion
      </p>
      <p className="text-2xl font-semibold">🏆 {name}</p>
    </div>
  );
}
