"use server";

import { prisma } from "@/lib/prisma";

const FEED_LIMIT = 30;

export async function getNewsFeed() {
  return prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    take: FEED_LIMIT,
  });
}
