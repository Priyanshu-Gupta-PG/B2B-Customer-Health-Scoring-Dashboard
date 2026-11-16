"use client";

import { catchError, type ErrorInfo } from "next/error";
import { ErrorState } from "./ErrorState";

function SectionErrorFallback({ title }: { title?: string }, { retry }: ErrorInfo) {
  return (
    <ErrorState
      title={title ?? "This section failed to render"}
      message="The rest of the page is still available. Retry to reload this section."
      onRetry={() => retry()}
    />
  );
}

/** Isolates a chart or table so a render failure does not white-screen the app. */
export const SectionErrorBoundary = catchError(SectionErrorFallback);
