"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";
import {
  LogOut,
  User,
  Users,
  GraduationCap,
  Newspaper,
  BookOpen,
  Milestone,
  ShieldCheck,
} from "lucide-react";

export function UserMenu({
  name,
  image,
  isAdmin = false,
}: {
  name: string | null;
  image: string | null;
  isAdmin?: boolean;
}) {
  const initial = (name?.trim().charAt(0) || "?").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground ring-1 ring-border transition-opacity hover:opacity-80"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="size-full object-cover" />
          ) : (
            initial
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {name && (
          <div className="max-w-40 truncate px-2 py-2 text-sm font-medium">{name}</div>
        )}
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="size-3.5" />
            My Profile
          </Link>
        </DropdownMenuItem>
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
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck className="size-3.5" />
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
