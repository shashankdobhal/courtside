import Link from "next/link";
import { auth } from "@/auth";
import { listCommunitiesForViewer } from "@/lib/actions/communities";
import { signInWithGoogleTo } from "@/lib/actions/auth";
import { RequestJoinCommunityButton } from "@/components/request-join-community-button";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, ArrowRight } from "lucide-react";
import { CommunityRole, CommunityMembershipStatus } from "@/types";

export default async function CommunitiesPage() {
  const session = await auth();
  const communities = await listCommunitiesForViewer(session?.user?.id);

  const mine = communities.filter((c) => c.viewerMembership?.status === CommunityMembershipStatus.APPROVED);
  const pending = communities.filter((c) => c.viewerMembership?.status === CommunityMembershipStatus.PENDING);
  const discover = communities.filter((c) => !c.viewerMembership);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold tracking-tight">Communities</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Join a community to see its shared leaderboard and player rankings.
          </p>
        </div>
        {session?.user && (
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/communities/new">
              <Plus className="size-4" />
              Create
            </Link>
          </Button>
        )}
      </div>

      {!session?.user && (
        <Card className="mb-8 gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">Sign in to create or join a community.</p>
          <form action={signInWithGoogleTo.bind(null, "/communities")}>
            <Button type="submit">Sign in with Google</Button>
          </form>
        </Card>
      )}

      {mine.length > 0 && (
        <div className="mb-8 space-y-2">
          <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
            My Communities
          </h2>
          {mine.map((c) => (
            <Link
              key={c.id}
              href={`/communities/${c.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-background p-4 transition-colors hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{c.name}</p>
                  {c.viewerMembership?.role === CommunityRole.ADMIN && (
                    <Badge variant="secondary">Admin</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-8 space-y-2">
          <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
            Pending Requests
          </h2>
          {pending.map((c) => (
            <Card key={c.id} className="flex-row items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">Waiting for admin approval</p>
              </div>
              <RequestJoinCommunityButton communityId={c.id} state="pending" />
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
          Discover
        </h2>
        {discover.length === 0 ? (
          communities.length === 0 && (
            <EmptyState
              icon={Users}
              title="No communities yet"
              description="Be the first to create one — you'll be its admin."
            />
          )
        ) : (
          discover.map((c) => (
            <Card key={c.id} className="flex-row items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                {c.description && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{c.description}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                </p>
              </div>
              {session?.user ? (
                <RequestJoinCommunityButton communityId={c.id} state="none" />
              ) : (
                <Badge variant="outline" className="shrink-0 text-muted-foreground">
                  Sign in to join
                </Badge>
              )}
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
