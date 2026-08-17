import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, ArrowRight } from "lucide-react";
import { formatDate, tournamentTypeLabel, tournamentStatusLabel } from "@/utils/format";
import { TournamentStatus, TournamentType } from "@/types";
import { TournamentCardActions } from "@/components/tournament-card-actions";

type TournamentCardData = {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: Date;
  _count: { players: number; matches: number };
};

const statusVariant: Record<string, "secondary" | "default" | "outline"> = {
  [TournamentStatus.PENDING]: "outline",
  [TournamentStatus.ACTIVE]: "default",
  [TournamentStatus.COMPLETED]: "secondary",
  [TournamentStatus.CANCELLED]: "outline",
};

export function TournamentCard({ tournament }: { tournament: TournamentCardData }) {
  const href =
    tournament.status === TournamentStatus.PENDING && tournament._count.players === 0
      ? `/tournaments/${tournament.id}/players`
      : `/tournaments/${tournament.id}`;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="space-y-1.5">
          <h3 className="font-semibold leading-tight text-base">{tournament.name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {formatDate(tournament.createdAt)}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant={statusVariant[tournament.status] ?? "outline"}>
            {tournamentStatusLabel[tournament.status as TournamentStatus] ?? tournament.status}
          </Badge>
          <TournamentCardActions tournamentId={tournament.id} status={tournament.status} />
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {tournamentTypeLabel[tournament.type as TournamentType] ?? tournament.type}
        </span>
        <Button asChild size="sm" variant="secondary">
          <Link href={href}>
            Open
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
