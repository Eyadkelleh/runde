import { Suspense } from "react";
import { LoadingState } from "@/components/app-shell";
import { MeetupDetail } from "@/components/meetup-detail";

export default function MeetupPage() {
  return (
    <Suspense fallback={<LoadingState label="Treffen wird geladen." />}>
      <MeetupDetail />
    </Suspense>
  );
}
