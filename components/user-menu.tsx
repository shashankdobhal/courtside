"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";
import { LogOut } from "lucide-react";

export function UserMenu({ name, image }: { name: string | null; image: string | null }) {
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
          <div className="max-w-40 truncate px-2 py-1.5 text-sm font-medium">{name}</div>
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
