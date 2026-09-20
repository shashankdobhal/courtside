import { cookies } from "next/headers";
import { TIMEZONE_COOKIE } from "@/lib/timezone-cookie";

const DEFAULT_TIME_ZONE = "UTC";

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * The visitor's own IANA timezone, read from the `tz` cookie set client-side
 * by <TimezoneSync> (see components/timezone-sync.tsx). Falls back to UTC —
 * the server's own timezone — for the first request before that cookie
 * exists, or for a signed-out/no-JS visitor.
 */
export async function getViewerTimeZone(): Promise<string> {
  const store = await cookies();
  const tz = store.get(TIMEZONE_COOKIE)?.value;
  return tz && isValidTimeZone(tz) ? tz : DEFAULT_TIME_ZONE;
}
