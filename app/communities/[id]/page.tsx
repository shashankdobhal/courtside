import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCommunity } from "@/lib/actions/communities";
import { RequestJoinCommunityButton } from "@/components/request-join-community-button";
import { PendingRequestActions, MemberActions } from "@/components/community-membership-actions";
import { PlayerAvatar } from "@/components/player-avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { CommunityRole, CommunityMembershipStatus } from "@/types";

export default async function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [community, session] = await Promise.all([getCommunity(id), auth()]);

  if (!community) notFound();

  const viewerProfile = session?.user?.id
    ? await prisma.playerProfile.findUnique({ where: { userId: session.user.id } })
    : null;
  const viewerMembership = viewerProfile
    ? community.memberships.find((m) => m.profileId === viewerProfile.id)
    : undefined;
  const isAdmin =
    viewerMembership?.role === CommunityRole.ADMIN &&
    viewerMembership?.status === CommunityMembershipStatus.APPROVED;

  const approved = community.memberships.filter(
    (m) => m.status === CommunityMembershipStatus.APPROVED
  );
  const pending = community.memberships.filter(
    (m) => m.status === CommunityMembershipStatus.PENDING
  );

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-14">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Users className="size-5 shrink-0 text-primary" />
            <h1 className="font-heading truncate text-2xl font-bold tracking-tight">
              {community.name}
            </h1>
          </div>
          {community.description && (
            <p className="text-sm text-muted-foreground">{community.description}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {approved.length} member{approved.length === 1 ? "" : "s"}
          </p>
        </div>
        {!viewerMembership && session?.user && (
          <RequestJoinCommunityButton communityId={community.id} state="none" />
        )}
        {viewerMembership?.status === CommunityMembershipStatus.PENDING && (
          <RequestJoinCommunityButton communityId={community.id} state="pending" />
        )}
      </div>

      {isAdmin && pending.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
            Requests to join ({pending.length})
          </h2>
          <div className="divide-y rounded-2xl border bg-background">
            {pending.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-4">
                <PlayerAvatar name={m.profile.name} size="sm" />
                <p className="min-w-0 flex-1 truncate font-medium">{m.profile.name}</p>
                <PendingRequestActions membershipId={m.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
          Members
        </h2>
        <div className="divide-y rounded-2xl border bg-background">
          {approved.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <PlayerAvatar name={m.profile.name} size="sm" />
              <p className="min-w-0 flex-1 truncate font-medium">{m.profile.name}</p>
              {m.role === CommunityRole.ADMIN && <Badge variant="secondary">Admin</Badge>}
              {isAdmin && m.role !== CommunityRole.ADMIN && <MemberActions membershipId={m.id} />}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
