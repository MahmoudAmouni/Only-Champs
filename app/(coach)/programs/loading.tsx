import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <CardGridSkeleton count={4} />
    </div>
  );
}
