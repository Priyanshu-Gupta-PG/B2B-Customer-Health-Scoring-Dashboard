"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { MockProvider } from "@/mocks/MockProvider";
import { ToastContainer } from "@/components/ui/ToastContainer";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <MockProvider>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </MockProvider>
    </QueryClientProvider>
  );
}
