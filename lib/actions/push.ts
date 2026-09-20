"use server";

import { prisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/auth-helpers";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Registers (or re-registers) this browser's push subscription for the
 * signed-in user. Upserted by endpoint, which is stable per browser
 * install — re-subscribing the same device updates its keys in place
 * instead of creating a duplicate row.
 */
export async function subscribeToPush(subscription: PushSubscriptionInput) {
  const session = await requireSignedIn();

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId: session.user.id,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function unsubscribeFromPush(endpoint: string) {
  const session = await requireSignedIn();
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });
}
