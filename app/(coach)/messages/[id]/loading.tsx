import { ChatSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <ChatSkeleton />
    </div>
  );
}
