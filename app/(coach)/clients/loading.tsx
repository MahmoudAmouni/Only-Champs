import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-32" />
      <ListSkeleton rows={8} />
    </div>
  );
}
