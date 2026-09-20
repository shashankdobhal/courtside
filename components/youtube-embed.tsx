import { extractYoutubeVideoId, youtubeEmbedUrl } from "@/lib/youtube";

export function YoutubeEmbed({ url, title }: { url: string; title: string }) {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) return null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border bg-black">
      <iframe
        src={youtubeEmbedUrl(videoId)}
        title={title}
        className="size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
