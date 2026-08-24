"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger/15">
        <AlertTriangle className="size-6 text-danger" />
      </div>
      <div>
        <p className="font-medium text-foreground">Something went wrong</p>
        <p className="mt-1 max-w-[40ch] text-sm text-muted-foreground">
          Give it another try — if it keeps happening, the issue has been logged.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
