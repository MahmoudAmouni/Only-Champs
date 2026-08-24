import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Skeleton className="h-80 w-full rounded-none" />
      <div className="mx-auto max-w-3xl space-y-6 px-6">
        <Skeleton className="-mt-12 size-24 rounded-full border-4 border-background" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
