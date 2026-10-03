"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { AccountDataGrid } from "@/components/tables/AccountDataGrid";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { useAllAccounts } from "./hooks";

export function AccountsPage() {
  const { data, isPending, isError, refetch } = useAllAccounts();

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Search, filter and sort the portfolio to find accounts that need attention."
      />
      <SectionErrorBoundary title="Accounts table failed to render">
        <AccountDataGrid
          data={data?.data ?? []}
          isLoading={isPending}
          isError={isError}
          onRetry={() => {
            void refetch();
          }}
        />
      </SectionErrorBoundary>
    </div>
  );
}
