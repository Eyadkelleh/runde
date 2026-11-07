import { describe, expect, it } from "vitest";
import { joinMeetup, leaveMeetup, placesLeft } from "@/domain/meetups";
import { domain, jonas, leila, meetup, mira, noon } from "@/domain/fixtures";

describe("join and leave", () => {
  it("fills a seat, rejects a duplicate, and frees the seat on leave", () => {
    const item = meetup();
    const joined = joinMeetup(domain([item]), item.id, jonas, noon);
    if (!joined.ok) throw new Error(joined.error.message);
    expect(placesLeft(joined.value)).toBe(2);
    expect(joined.value.participants.map((person) => person.id)).toEqual([mira.id, jonas.id]);

    const duplicate = joinMeetup(joined.state, item.id, jonas, noon);
    if (duplicate.ok) throw new Error("duplicate join accepted");
    expect(duplicate.error.code).toBe("already-joined");

    const left = leaveMeetup(joined.state, item.id, jonas.id);
    if (!left.ok) throw new Error(left.error.message);
    expect(placesLeft(left.value)).toBe(3);
    expect(left.value.participants).toHaveLength(1);
  });

  it("enforces capacity and keeps the organizer from leaving", () => {
    const item = meetup({
      capacity: 2,
      participants: [
        { id: mira.id, displayName: "Mira" },
        { id: jonas.id, displayName: "Jonas" },
      ],
    });
    const full = joinMeetup(domain([item]), item.id, leila, noon);
    if (full.ok) throw new Error("full meetup accepted a join");
    expect(full.error.code).toBe("full");
    expect(full.error.message).toBe("Es ist kein Platz mehr frei.");

    const organizer = leaveMeetup(domain([item]), item.id, mira.id);
    if (organizer.ok) throw new Error("organizer left");
    expect(organizer.error.code).toBe("organizer-must-cancel");

    const stranger = leaveMeetup(domain([item]), item.id, leila.id);
    if (stranger.ok) throw new Error("stranger left");
    expect(stranger.error.code).toBe("not-participant");
  });

  it("refuses a hidden meetup", () => {
    const item = meetup();
    const hidden = joinMeetup(
      domain([item], {
        reports: [
          {
            id: "r1",
            meetupId: item.id,
            reporterId: jonas.id,
            reasonId: "privatort",
            createdAt: noon.toISOString(),
            scope: "local-demo",
          },
        ],
      }),
      item.id,
      jonas,
      noon,
    );
    if (hidden.ok) throw new Error("hidden meetup accepted a join");
    expect(hidden.error.code).toBe("hidden");
  });
});
