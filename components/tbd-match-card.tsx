import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TbdMatchCard() {
  return (
    <Card className="flex-row items-center justify-between gap-3 border-dashed p-4 duration-300 animate-in fade-in fill-mode-both">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <TbdPlayer />
        <span className="shrink-0 text-xs font-medium text-muted-foreground">vs</span>
        <TbdPlayer align="right" />
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">Awaiting result</span>
    </Card>
  );
}

function TbdPlayer({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5",
        align === "right" && "flex-row-reverse text-right"
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed text-[10px] font-semibold text-muted-foreground">
        ?
      </span>
      <span className="truncate text-sm text-muted-foreground">TBD</span>
    </div>
  );
}
