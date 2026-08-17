import { LucideIcon, Trophy } from "lucide-react";

export function EmptyState({
  icon: Icon = Trophy,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 px-6 text-center duration-500 animate-in fade-in zoom-in-95">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted transition-transform duration-300 hover:scale-110 hover:rotate-6">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
