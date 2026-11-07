import Link from "next/link";
import { findHobby, type Meetup } from "@/domain/catalog";
import { seatsLabel } from "@/domain/meetups";
import { formatMeetupWhen } from "@/domain/time";
export function MeetupCard({ meetup, now }: { meetup: Meetup; now: Date }) {
  const hobby = findHobby(meetup.hobbyId);
  const when = formatMeetupWhen(new Date(meetup.startsAt), new Date(meetup.endsAt), now);
  const seats = seatsLabel(meetup, now);
  return (
    <li>
      <Link
        href={`/treffen/${meetup.id}`}
        data-testid="meetup-card"
        className="block rounded-xl border border-border bg-card px-5 py-5 hover:border-foreground/25"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-[1.7rem] leading-none tracking-tight">
            {hobby?.label ?? "Treffen"}
          </h2>
          {meetup.synthetic ? (
            <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs">Beispiel</span>
          ) : null}
        </div>
        <p className="mt-4 text-base font-medium">{when}</p>
        <p className="mt-1 text-muted-foreground">{meetup.placeName}</p>
        <p className="mt-5 text-sm">{seats}</p>
      </Link>
    </li>
  );
}
