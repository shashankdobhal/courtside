"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, GraduationCap, Newspaper, BookOpen, Milestone, Menu } from "lucide-react";

/**
 * Signed-out mobile visitors have no account avatar to carry the dropdown
 * that gives signed-in mobile users a way to reach Coaches/News (the
 * header's own links to those are desktop-only, `hidden sm:flex`) — this
 * is that same access path for the signed-out case.
 */
export function MobileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="More"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
        >
          <Menu className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/academy">
            <Milestone className="size-3.5" />
            Academy
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/communities">
            <Users className="size-3.5" />
            Communities
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/coaches">
            <GraduationCap className="size-3.5" />
            Coaches
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/news">
            <Newspaper className="size-3.5" />
            News
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/learn">
            <BookOpen className="size-3.5" />
            Learn
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
