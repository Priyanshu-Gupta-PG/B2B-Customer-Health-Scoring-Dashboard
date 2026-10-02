import type { Metadata } from "next";
import { ScoringRulesScreen } from "@/features/rules/ScoringRulesScreen";

export const metadata: Metadata = { title: "Scoring Rules" };

export default function RulesPage() {
  return <ScoringRulesScreen />;
}
