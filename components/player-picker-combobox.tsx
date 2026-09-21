"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchPlayerProfiles } from "@/lib/actions/player-profiles";
import { cn } from "@/lib/utils";

export interface PlayerPickerValue {
  name: string;
  profileId?: string;
}

export function PlayerPickerCombobox({
  value,
  onChange,
  placeholder = "Player name",
  autoFocus,
  className,
}: {
  value: PlayerPickerValue;
  onChange: (value: PlayerPickerValue) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value.name);
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const found = await searchPlayerProfiles(query);
      if (requestId.current === id) setResults(found);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, open]);

  const trimmedQuery = query.trim();
  const hasExactMatch = results.some(
    (r) => r.name.toLowerCase() === trimmedQuery.toLowerCase()
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setQuery(value.name);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          autoFocus={autoFocus}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 text-left text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            !value.name && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{value.name || placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or add a player…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {trimmedQuery && !hasExactMatch && (
              <CommandGroup>
                <CommandItem
                  value={`__new__${trimmedQuery}`}
                  onSelect={() => {
                    onChange({ name: trimmedQuery });
                    setOpen(false);
                  }}
                >
                  Add &ldquo;{trimmedQuery}&rdquo; as a new player
                </CommandItem>
              </CommandGroup>
            )}
            {results.length > 0 && (
              <CommandGroup heading={trimmedQuery ? "Matching players" : "Recently used"}>
                {results.map((profile) => (
                  <CommandItem
                    key={profile.id}
                    value={profile.id}
                    onSelect={() => {
                      onChange({ name: profile.name, profileId: profile.id });
                      setOpen(false);
                    }}
                  >
                    {profile.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!trimmedQuery && results.length === 0 && (
              <CommandEmpty>Type a name to search or add a player.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
