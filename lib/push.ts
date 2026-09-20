import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

/**
 * Sends a push notification to every device a user has subscribed on.
 * Best-effort only — a send failure here should never break whatever
 * triggered it (fixture generation, a match result), so every error is
 * swallowed after logging, except the standard "this subscription is
 * gone" responses (404/410), which prune the stale row instead of
 * retrying it forever.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Push notification failed", err);
        }
      }
    })
  );
}

/**
 * Resolves a batch of roster Player ids to the distinct set of userIds to
 * notify — only players whose reusable identity is linked to a Google
 * account (PlayerProfile.userId) can receive a push at all.
 */
export async function getUserIdsForPlayerIds(playerIds: string[]): Promise<string[]> {
  if (playerIds.length === 0) return [];

  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { profile: { select: { userId: true } } },
  });

  const userIds = players
    .map((p) => p.profile?.userId)
    .filter((id): id is string => !!id);
  return Array.from(new Set(userIds));
}
