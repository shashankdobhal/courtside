import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isSuperAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AdminDeleteTournamentButton } from "@/components/admin-delete-tournament-button";
import { LazyList } from "@/components/lazy-list";
import { formatDate, tournamentStatusLabel } from "@/utils/format";
import { TournamentStatus } from "@/types";
import { ShieldCheck, Radio } from "lucide-react";

const statusVariant: Record<string, "secondary" | "default" | "outline"> = {
  [TournamentStatus.PENDING]: "outline",
  [TournamentStatus.ACTIVE]: "default",
  [TournamentStatus.COMPLETED]: "secondary",
  [TournamentStatus.CANCELLED]: "outline",
};

export default async function AdminPage() {
  const session = await auth();
  if (!isSuperAdminEmail(session?.user?.email)) redirect("/");

  const [users, tournaments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { playerProfile: { select: { isCoach: true } } },
    }),
    prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { name: true, email: true } }, _count: { select: { players: true } } },
    }),
  ]);

  const tournamentNodes = tournaments.map((t) => (
    <Card key={t.id} className="flex-row items-center justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{t.name}</p>
          <Badge variant={statusVariant[t.status] ?? "outline"}>
            {tournamentStatusLabel[t.status as TournamentStatus] ?? t.status}
          </Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {t.owner?.name ?? t.owner?.email ?? "Unclaimed"} · {t._count.players} players ·{" "}
          {formatDate(t.createdAt)}
        </p>
      </div>
      <AdminDeleteTournamentButton tournamentId={t.id} name={t.name} />
    </Card>
  ));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <h1 className="font-heading text-2xl font-bold tracking-tight">Admin</h1>
      </div>

      <Card className="mb-8 flex-row items-center gap-2 p-4 text-sm">
        <Radio className="size-4 shrink-0 text-primary" />
        <span>
          Add or manage livestreams from the{" "}
          <Link href="/live" className="font-medium text-primary underline underline-offset-2">
            Live page
          </Link>
          .
        </span>
      </Card>

      <h2 className="mb-3 text-lg font-semibold tracking-tight">
        All tournaments ({tournaments.length})
      </h2>
      <LazyList items={tournamentNodes} pageSize={8} className="mb-8 space-y-2" />

      <h2 className="mb-3 text-lg font-semibold tracking-tight">All users ({users.length})</h2>
      <div className="divide-y rounded-2xl border bg-background">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground ring-1 ring-border">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="size-full object-cover" />
              ) : (
                (user.name?.trim().charAt(0) || user.email?.charAt(0) || "?").toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{user.name ?? "Unnamed"}</p>
                {user.playerProfile?.isCoach && <Badge variant="secondary">Coach</Badge>}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {user.email ?? "No email"}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              Joined {formatDate(user.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
