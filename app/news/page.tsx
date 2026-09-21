import { formatDistanceToNow } from "date-fns";
import { getNewsFeed } from "@/lib/actions/news";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Newspaper } from "lucide-react";

export default async function NewsPage() {
  const items = await getNewsFeed();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <Newspaper className="size-5 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">News</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Badminton headlines, in a couple of lines. Tap through for the full story.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No news yet"
          description="Headlines refresh a few times a day — check back soon."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="flex-row items-center gap-3 p-4 transition-colors hover:bg-muted/50">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {item.sourceName} · {formatDistanceToNow(item.publishedAt, { addSuffix: true })}
                  </p>
                  <p className="mt-0.5 line-clamp-2 font-medium">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
