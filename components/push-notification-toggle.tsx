"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/actions/push";

const noopSubscribe = () => () => {};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function getExistingSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

/**
 * A bell toggle for opting this browser in/out of Web Push. Only rendered
 * once we know the browser actually supports it (checked via
 * useSyncExternalStore, same hydration-safe pattern as ThemeToggle — the
 * server has no idea what the visitor's browser can do).
 */
export function PushNotificationToggle() {
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => "serviceWorker" in navigator && "PushManager" in window,
    () => false
  );
  const [subscribed, setSubscribed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    getExistingSubscription().then((sub) => {
      if (!cancelled) setSubscribed(!!sub);
    });
    return () => {
      cancelled = true;
    };
  }, [supported]);

  if (!supported) return null;

  const handleToggle = async () => {
    setIsPending(true);
    try {
      if (subscribed) {
        const sub = await getExistingSubscription();
        if (sub) {
          await unsubscribeFromPush(sub.endpoint);
          await sub.unsubscribe();
        }
        setSubscribed(false);
        toast.success("Notifications turned off");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error("Push notifications aren't set up yet");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Enable notifications for this site in your browser settings to turn this on");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const keys = sub.toJSON().keys;
      if (!keys?.p256dh || !keys.auth) throw new Error("Subscription is missing its keys");

      await subscribeToPush({ endpoint: sub.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } });
      setSubscribed(true);
      toast.success("Notifications turned on");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={subscribed ? "Turn off notifications" : "Turn on notifications"}
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : subscribed ? (
        <Bell className="size-4" />
      ) : (
        <BellOff className="size-4" />
      )}
    </button>
  );
}
