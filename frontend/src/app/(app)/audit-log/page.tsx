import type { Metadata } from "next";
import { AuditLogView } from "@/features/audit/AuditLogView";

export const metadata: Metadata = { title: "Audit Log" };

export default function AuditLogPage() {
  return <AuditLogView />;
}
