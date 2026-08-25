import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-lg space-y-8 px-6 py-12">
      <Skeleton className="h-1 w-full rounded-full" />
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
