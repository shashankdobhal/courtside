import { getLearnFeed } from "@/lib/actions/learn";
import { LearnPostCard } from "@/components/learn-post-card";
import { EmptyState } from "@/components/empty-state";
import { BookOpen } from "lucide-react";

export default async function LearnPage() {
  const posts = await getLearnFeed();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Learn</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Tips, drills, and videos players have shared with the community.
        </p>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Learn posts yet"
          description="When a player shares a tip or video, it'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <LearnPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
