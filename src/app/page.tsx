import type { Metadata } from "next";
import { ExploreView } from "@/components/explore-view";

export const metadata: Metadata = {
  title: "Was ist offen",
};

export default function HomePage() {
  return <ExploreView />;
}
