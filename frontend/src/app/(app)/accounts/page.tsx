import type { Metadata } from "next";
import { AccountsPage } from "@/features/accounts/AccountsPage";

export const metadata: Metadata = { title: "Accounts" };

export default function AccountsRoute() {
  return <AccountsPage />;
}
