import type { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { TopNav } from "@/components/layout/TopNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
