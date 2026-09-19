import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  icon: Icon,
  accent = false,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("items-center gap-1 p-4 text-center", className)}>
      {Icon && (
        <Icon className={cn("mb-1 size-4", accent ? "text-primary" : "text-muted-foreground")} />
      )}
      <p className={cn("text-2xl font-semibold", accent && "text-primary")}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
