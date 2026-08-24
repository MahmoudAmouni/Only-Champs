import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <ListSkeleton rows={3} />
    </div>
  );
}
