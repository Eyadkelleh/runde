import type {
  Block,
  DomainState,
  Meetup,
  Participant,
  WhenFilter,
} from "@/domain/catalog";
import { effectiveStatus, isSameLocalDay, JETZT_WINDOW_MS } from "@/domain/time";
import { isParticipant } from "@/domain/meetups";

export type ExploreQuery = {
  localityId: string;
  hobbyId: string;
  when: WhenFilter;
  actorId: string | null;
  now: Date;
};

export type MeetupView =
  | { kind: "missing" }
  | { kind: "hidden"; meetup: Meetup; reason: "reported" | "blocked" }
  | { kind: "visible"; meetup: Meetup };

function matchesWhen(meetup: Meetup, when: WhenFilter, now: Date): boolean {
  if (when === "alle") return true;
  const start = new Date(meetup.startsAt);
  const end = new Date(meetup.endsAt);
  if (end.getTime() <= now.getTime()) return false;
  if (when === "jetzt") {
    return start.getTime() <= now.getTime() + JETZT_WINDOW_MS && end.getTime() > now.getTime();
  }
  if (when === "heute") return isSameLocalDay(start, now);
  const tomorrow = new Date(now.getTime());
  tomorrow.setDate(now.getDate() + 1);
  return isSameLocalDay(start, tomorrow);
}

export function filterExplore(state: DomainState, query: ExploreQuery): Meetup[] {
  const hiddenMeetups = new Set(
    query.actorId
      ? state.reports.filter((report) => report.reporterId === query.actorId).map((report) => report.meetupId)
      : [],
  );
  const blockedOrganizers = new Set(
    query.actorId
      ? state.blocks
          .filter((block) => block.blockerId === query.actorId)
          .map((block) => block.blockedParticipantId)
      : [],
  );

  return state.meetups
    .filter((meetup) => {
      if (meetup.localityId !== query.localityId) return false;
      if (query.hobbyId !== "alle" && meetup.hobbyId !== query.hobbyId) return false;
      if (effectiveStatus(meetup, query.now) !== "open") return false;
      if (hiddenMeetups.has(meetup.id)) return false;
      if (blockedOrganizers.has(meetup.organizerId)) return false;
      return matchesWhen(meetup, query.when, query.now);
    })
    .sort((left, right) => {
      const delta = new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime();
      return delta === 0 ? left.id.localeCompare(right.id) : delta;
    });
}

export function listMine(state: DomainState, actorId: string, now: Date): {
  upcoming: Meetup[];
  past: Meetup[];
} {
  const upcoming: Meetup[] = [];
  const past: Meetup[] = [];
  for (const meetup of state.meetups) {
    if (!isParticipant(meetup, actorId)) continue;
    if (effectiveStatus(meetup, now) === "open") upcoming.push(meetup);
    else past.push(meetup);
  }
  upcoming.sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  past.sort((left, right) => new Date(right.endsAt).getTime() - new Date(left.endsAt).getTime());
  return { upcoming, past };
}

export function viewMeetup(state: DomainState, id: string, actorId: string | null): MeetupView {
  const meetup = state.meetups.find((item) => item.id === id);
  if (!meetup) return { kind: "missing" };
  if (actorId && state.reports.some((report) => report.reporterId === actorId && report.meetupId === id)) {
    return { kind: "hidden", meetup, reason: "reported" };
  }
  if (
    actorId &&
    state.blocks.some(
      (block) => block.blockerId === actorId && block.blockedParticipantId === meetup.organizerId,
    )
  ) {
    return { kind: "hidden", meetup, reason: "blocked" };
  }
  return { kind: "visible", meetup };
}

export function visibleParticipants(
  meetup: Meetup,
  actorId: string | null,
  blocks: Block[],
): Participant[] {
  const blocked = new Set(
    blocks
      .filter((block) => actorId !== null && block.blockerId === actorId)
      .map((block) => block.blockedParticipantId),
  );
  const people = meetup.participants.filter((person) => !blocked.has(person.id));
  if (isParticipant(meetup, actorId)) return people;
  return people.filter((person) => person.id === meetup.organizerId);
}
