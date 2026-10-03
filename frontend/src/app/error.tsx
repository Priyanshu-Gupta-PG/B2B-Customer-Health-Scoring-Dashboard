"use client";

import { RouteErrorFallback } from "@/components/ui/RouteErrorFallback";

export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteErrorFallback error={error} retry={retry} />;
}
