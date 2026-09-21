"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

/**
 * Reveals a pre-rendered (server-side) list of items a page at a time as
 * the sentinel at the bottom scrolls into view, instead of mounting
 * hundreds of DOM nodes (with embedded YouTube iframes, in the Live tab's
 * case) up front. The items themselves are still fetched and rendered on
 * the server in one pass — this only staggers what actually mounts.
 */
export function LazyList({
  items,
  pageSize = 8,
  className,
}: {
  items: ReactNode[];
  pageSize?: number;
  className?: string;
}) {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(pageSize, items.length));
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((count) => Math.min(count + pageSize, items.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length, pageSize]);

  return (
    <div className={className}>
      {items.slice(0, visibleCount)}
      {visibleCount < items.length && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
