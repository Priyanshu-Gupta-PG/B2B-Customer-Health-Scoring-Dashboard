import type { Metadata } from "next";
import { SettingsView } from "@/features/system/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsView />;
}
