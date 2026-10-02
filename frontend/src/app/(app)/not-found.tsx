import type { Metadata } from "next";
import { NotFoundExperience } from "@/components/ui/NotFoundExperience";

export const metadata: Metadata = { title: "Not found" };

export default function AppNotFound() {
  return <NotFoundExperience />;
}
