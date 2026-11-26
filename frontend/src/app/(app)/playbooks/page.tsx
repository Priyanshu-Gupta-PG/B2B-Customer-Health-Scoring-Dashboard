import type { Metadata } from "next";
import { PlaybooksView } from "@/features/playbooks/PlaybooksView";

export const metadata: Metadata = { title: "Playbooks" };

export default function PlaybooksPage() {
  return <PlaybooksView />;
}
