"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { MockProvider } from "@/mocks/MockProvider";
import { ToastContainer } from "@/components/ui/ToastContainer";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MockProvider>
          <AuthProvider>
            {children}
            <ToastContainer />
          </AuthProvider>
        </MockProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
