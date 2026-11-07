import type { Metadata } from "next";
import { MeineView } from "@/components/meine-view";

export const metadata: Metadata = {
  title: "Meine Treffen",
};

export default function MeinePage() {
  return <MeineView />;
}
