import { describe, expect, it } from "vitest";
import { filterExplore } from "@/domain/filter";
import { domain, jonas, meetup, mira, noon } from "@/domain/fixtures";
import { blockParticipant, cancelMeetup, joinMeetup, reportMeetup } from "@/domain/meetups";
import { effectiveStatus } from "@/domain/time";

describe("cancellation and expiry", () => {
  it("lets only the organizer cancel, then blocks new joins", () => {
    const item = meetup();
    const stranger = cancelMeetup(domain([item]), item.id, jonas.id);
    if (stranger.ok) throw new Error("stranger cancelled");
    expect(stranger.error.code).toBe("not-organizer");

    const cancelled = cancelMeetup(domain([item]), item.id, mira.id);
    if (!cancelled.ok) throw new Error(cancelled.error.message);
    expect(cancelled.value.status).toBe("cancelled");

    const again = cancelMeetup(cancelled.state, item.id, mira.id);
    if (again.ok) throw new Error("cancelled twice");
    expect(again.error.code).toBe("already-cancelled");

    const joined = joinMeetup(cancelled.state, item.id, jonas, noon);
    if (joined.ok) throw new Error("cancelled meetup accepted a join");
    expect(joined.error.code).toBe("cancelled");

    const visible = filterExplore(cancelled.state, {
      localityId: "berlin",
      hobbyId: "alle",
      when: "alle",
      actorId: null,
      now: noon,
    });
    expect(visible).toHaveLength(0);
  });

  it("closes the meetup at the exact end and rejects a join then", () => {
    const ends = new Date(2026, 10, 7, 20, 0, 0, 0);
    const item = meetup({ endsAt: ends.toISOString() });
    expect(effectiveStatus(item, new Date(ends.getTime() - 1))).toBe("open");
    expect(effectiveStatus(item, ends)).toBe("expired");

    const joined = joinMeetup(domain([item]), item.id, jonas, ends);
    if (joined.ok) throw new Error("expired meetup accepted a join");
    expect(joined.error.code).toBe("expired");
    expect(joined.error.message).toBe("Das Treffen ist vorbei.");
  });

  it("keeps a report and a block on this device only", () => {
    const item = meetup();
    const reported = reportMeetup(domain([item]), item.id, jonas, "spam", noon, "r1");
    if (!reported.ok) throw new Error(reported.error.message);
    expect(reported.value.scope).toBe("local-demo");
    const repeat = reportMeetup(reported.state, item.id, jonas, "spam", noon, "r2");
    if (!repeat.ok) throw new Error(repeat.error.message);
    expect(repeat.value.id).toBe("r1");
    expect(repeat.state.reports).toHaveLength(1);

    const missing = reportMeetup(domain([item]), item.id, jonas, "nein", noon, "r3");
    if (missing.ok) throw new Error("bad reason accepted");
    expect(missing.error.code).toBe("invalid-reason");

    const self = blockParticipant(domain([item]), jonas.id, jonas.id, noon);
    if (self.ok) throw new Error("self block accepted");
    expect(self.error.code).toBe("cannot-block-self");

    const blocked = blockParticipant(domain([item]), jonas.id, mira.id, noon);
    if (!blocked.ok) throw new Error(blocked.error.message);
    expect(blocked.value.scope).toBe("local-demo");
    const visible = filterExplore(blocked.state, {
      localityId: "berlin",
      hobbyId: "alle",
      when: "alle",
      actorId: jonas.id,
      now: noon,
    });
    expect(visible).toHaveLength(0);
  });
});
