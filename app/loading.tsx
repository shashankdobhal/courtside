import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
      <div className="mb-10 flex flex-col items-center gap-6 sm:mb-14">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 w-48 rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
