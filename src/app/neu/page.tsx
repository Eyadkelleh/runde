import type { Metadata } from "next";
import { CreateForm } from "@/components/create-form";

export const metadata: Metadata = {
  title: "Treffen anlegen",
};

export default function CreatePage() {
  return <CreateForm />;
}
