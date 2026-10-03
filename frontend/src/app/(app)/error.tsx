"use client";

import { RouteErrorFallback } from "@/components/ui/RouteErrorFallback";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteErrorFallback error={error} retry={retry} />;
}
