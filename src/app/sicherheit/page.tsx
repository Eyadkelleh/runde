import type { Metadata } from "next";
import { SafetyView } from "@/components/safety-view";

export const metadata: Metadata = {
  title: "Sicherheit",
};

export default function SafetyPage() {
  return <SafetyView />;
}
