const stats = [
  { key: "matches", label: "Matches" },
  { key: "wins", label: "Wins" },
  { key: "winRate", label: "Win rate" },
  { key: "titles", label: "Titles" },
] as const;

export function PersonalStatsTile({
  matches,
  wins,
  titles,
}: {
  matches: number;
  wins: number;
  titles: number;
}) {
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const values: Record<(typeof stats)[number]["key"], string> = {
    matches: String(matches),
    wins: String(wins),
    winRate: `${winRate}%`,
    titles: titles > 0 ? `🏆 ${titles}` : String(titles),
  };

  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-background p-5 sm:grid-cols-4 sm:divide-x">
      {stats.map(({ key, label }) => (
        <div key={key} className="text-center sm:px-2">
          <p className="font-heading text-3xl font-bold">{values[key]}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}
