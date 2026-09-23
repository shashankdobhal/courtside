import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CommunityRole } from "@/types";
import { ArrowRight, Users } from "lucide-react";

export function CommunitiesStrip({
  communities,
}: {
  communities: { id: string; name: string; role: string }[];
}) {
  return (
    <div className="space-y-2">
      {communities.map((c) => (
        <Link
          key={c.id}
          href={`/communities/${c.id}`}
          className="flex items-center justify-between gap-3 rounded-2xl border bg-background p-4 transition-colors hover:bg-accent"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Users className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{c.name}</span>
            {c.role === CommunityRole.ADMIN && <Badge variant="secondary">Admin</Badge>}
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
