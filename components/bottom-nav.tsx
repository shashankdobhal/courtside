"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, BarChart3, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/leaderboard", label: "Stats", icon: BarChart3 },
] as const;

const trailingItems = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/profile", label: "Profile", icon: User },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}

/**
 * A native-feeling bottom tab bar for mobile, hidden at the `sm` breakpoint
 * and above where the top header already carries the same destinations.
 * The raised center button overlaps the bar (negative margin) rather than
 * sitting flush in it, the same visual language as most native app tab
 * bars with a primary create action.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] sm:hidden print:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-2">
        {items.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}

        <div className="flex flex-1 justify-center">
          <Link
            href="/tournaments/new"
            aria-label="Create tournament"
            className="-mt-8 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-background transition-transform active:scale-95"
          >
            <Plus className="size-6" />
          </Link>
        </div>

        {trailingItems.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}
