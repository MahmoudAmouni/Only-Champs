import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-28" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="max-w-lg space-y-4">
        <Skeleton className="h-24 w-24 rounded-lg" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
