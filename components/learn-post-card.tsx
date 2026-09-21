import Link from "next/link";
import type { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { YoutubeEmbed } from "@/components/youtube-embed";
import { extractYoutubeVideoId } from "@/lib/youtube";

export interface LearnPostData {
  id: string;
  title: string;
  body: string | null;
  videoUrl: string | null;
  createdAt: Date;
  author?: { id: string; name: string };
}

/** Presentational only — safe to render from a server component. */
export function LearnPostCard({ post, action }: { post: LearnPostData; action?: ReactNode }) {
  const videoId = post.videoUrl ? extractYoutubeVideoId(post.videoUrl) : null;

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{post.title}</p>
          {post.author && (
            <Link
              href={`/players/${post.author.id}`}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {post.author.name}
            </Link>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(post.createdAt, { addSuffix: true })}
          </span>
          {action}
        </div>
      </div>

      {post.body && <p className="text-sm whitespace-pre-wrap text-foreground">{post.body}</p>}

      {post.videoUrl &&
        (videoId ? (
          <YoutubeEmbed url={post.videoUrl} title={post.title} />
        ) : (
          <a
            href={post.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary underline underline-offset-2"
          >
            Watch video →
          </a>
        ))}
    </Card>
  );
}
