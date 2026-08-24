"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger/15">
        <AlertTriangle className="size-6 text-danger" />
      </div>
      <div>
        <p className="font-medium text-foreground">Couldn&apos;t load this page</p>
        <p className="mt-1 max-w-[40ch] text-sm text-muted-foreground">
          Give it another try — if it keeps happening, the issue has been logged.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
