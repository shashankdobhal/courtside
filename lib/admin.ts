import "server-only";

/**
 * CourtSide has exactly one super admin, identified by email via env var
 * (like CRON_SECRET or GNEWS_API_KEY) rather than a role column — there's
 * no admin-management UI to invent a second one through anyway.
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  return !!adminEmail && !!email && email.toLowerCase() === adminEmail.toLowerCase();
}
