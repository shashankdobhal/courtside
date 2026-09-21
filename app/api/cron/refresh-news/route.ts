import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GNEWS_SEARCH_URL = "https://gnews.io/api/v4/search";
const SUMMARY_MAX_LENGTH = 200;
const PRUNE_AFTER_DAYS = 60;

interface GNewsArticle {
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string };
}

interface GNewsResponse {
  articles: GNewsArticle[];
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

/**
 * Runs on Vercel Cron (see vercel.json) — pulls badminton-tagged
 * articles from GNews and upserts them by url, deduping across runs.
 * Best-effort: a missing API key or a failed fetch never throws past
 * this route, it just no-ops and reports why.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ingested: 0, note: "GNEWS_API_KEY not configured" });
  }

  const url = `${GNEWS_SEARCH_URL}?q=badminton&lang=en&max=10&apikey=${apiKey}`;

  let data: GNewsResponse;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { ingested: 0, error: `GNews responded ${response.status}` },
        { status: 200 }
      );
    }
    data = await response.json();
  } catch (err) {
    console.error("News ingestion fetch failed", err);
    return NextResponse.json({ ingested: 0, error: "fetch failed" }, { status: 200 });
  }

  let ingested = 0;
  for (const article of data.articles ?? []) {
    if (!article.title || !article.url || !article.publishedAt) continue;
    await prisma.newsItem
      .upsert({
        where: { url: article.url },
        update: {
          title: article.title,
          summary: truncate(article.description ?? "", SUMMARY_MAX_LENGTH),
          sourceName: article.source?.name ?? "Unknown",
          imageUrl: article.image ?? null,
          publishedAt: new Date(article.publishedAt),
        },
        create: {
          title: article.title,
          summary: truncate(article.description ?? "", SUMMARY_MAX_LENGTH),
          url: article.url,
          sourceName: article.source?.name ?? "Unknown",
          imageUrl: article.image ?? null,
          publishedAt: new Date(article.publishedAt),
        },
      })
      .catch((err) => console.error("Failed to upsert news item", article.url, err));
    ingested++;
  }

  const pruneCutoff = new Date(Date.now() - PRUNE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const pruned = await prisma.newsItem.deleteMany({
    where: { publishedAt: { lt: pruneCutoff } },
  });

  return NextResponse.json({ ingested, pruned: pruned.count });
}
