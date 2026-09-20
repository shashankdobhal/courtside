"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIMEZONE_COOKIE } from "@/lib/timezone-cookie";

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

/**
 * Records the visitor's own IANA timezone in a cookie so Server Components
 * (which always run in the server's own timezone) can compute "today" the
 * way the visitor's clock sees it — see lib/timezone.ts. Refreshes the route
 * once when the cookie is first set or changes (e.g. the visitor traveled),
 * so calendar-day data like streaks doesn't stay off until the next navigation.
 */
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (readCookie(TIMEZONE_COOKIE) === timeZone) return;
      document.cookie = `${TIMEZONE_COOKIE}=${timeZone}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    } catch {
      // Intl.DateTimeFormat is universally supported in browsers we target.
    }
  }, [router]);

  return null;
}
