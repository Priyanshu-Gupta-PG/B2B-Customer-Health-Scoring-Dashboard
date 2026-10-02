"use client";

import { useEffect } from "react";
import { Card } from "./Card";
import { ErrorState } from "./ErrorState";

export function RouteErrorFallback({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <ErrorState
          title="Something went wrong"
          message="This page failed to load. Retry, or use the navigation to open another section."
          onRetry={retry}
        />
      </Card>
    </div>
  );
}
