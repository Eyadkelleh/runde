import { describe, expect, it } from "vitest";
import { nearestLocality } from "@/domain/catalog";
import { filterExplore, listMine, viewMeetup, visibleParticipants } from "@/domain/filter";
import { domain, jonas, meetup, mira, noon } from "@/domain/fixtures";
import { formatMeetupWhen } from "@/domain/time";

const soon = meetup({
  id: "soon",
  hobbyId: "laufen",
  startsAt: new Date(2026, 10, 7, 12, 30).toISOString(),
  endsAt: new Date(2026, 10, 7, 14, 0).toISOString(),
});
const evening = meetup({ id: "evening" });
const tomorrow = meetup({
  id: "tomorrow",
  hobbyId: "spazieren",
  startsAt: new Date(2026, 10, 8, 15, 0).toISOString(),
  endsAt: new Date(2026, 10, 8, 17, 0).toISOString(),
});
const hamburg = meetup({ id: "hamburg", localityId: "hamburg" });
const cancelled = meetup({ id: "cancelled", status: "cancelled" });
const expired = meetup({
  id: "expired",
  startsAt: new Date(2026, 10, 7, 9, 0).toISOString(),
  endsAt: new Date(2026, 10, 7, 11, 0).toISOString(),
});
const reported = meetup({ id: "reported", hobbyId: "kaffee" });
const blocked = meetup({
  id: "blocked",
  hobbyId: "radfahren",
  organizerId: "p-bad",
  participants: [{ id: "p-bad", displayName: "Rob" }],
});
const full = meetup({
  id: "full",
  hobbyId: "brettspiele",
  capacity: 2,
  participants: [
    { id: mira.id, displayName: "Mira" },
    { id: jonas.id, displayName: "Jonas" },
  ],
});
const withGuest = meetup({
  id: "guest",
  hobbyId: "radfahren",
  participants: [
    { id: mira.id, displayName: "Mira" },
    { id: "p-bad", displayName: "Rob" },
  ],
});

const state = domain(
  [soon, evening, tomorrow, hamburg, cancelled, expired, reported, blocked, full, withGuest],
  {
    reports: [
      {
        id: "r1",
        meetupId: "reported",
        reporterId: mira.id,
        reasonId: "spam",
        createdAt: noon.toISOString(),
        scope: "local-demo",
      },
    ],
    blocks: [
      {
        blockerId: mira.id,
        blockedParticipantId: "p-bad",
        createdAt: noon.toISOString(),
        scope: "local-demo",
      },
    ],
  },
);

function ids(when: "jetzt" | "heute" | "morgen" | "alle", hobbyId = "alle", actorId: string | null = mira.id) {
  return filterExplore(state, {
    localityId: "berlin",
    hobbyId,
    when,
    actorId,
    now: noon,
  }).map((meetup) => meetup.id);
}

describe("filterExplore", () => {
  it("keeps the chosen city, hobby, and near-term window", () => {
    expect(ids("jetzt")).toEqual(["soon"]);
    expect(ids("heute")).toEqual(["soon", "evening", "full", "guest"]);
    expect(ids("morgen")).toEqual(["tomorrow"]);
    expect(ids("alle", "fussball")).toEqual(["evening"]);
    expect(ids("alle")).not.toContain("hamburg");
    expect(ids("alle")).not.toContain("cancelled");
    expect(ids("alle")).not.toContain("expired");
    expect(ids("alle")).not.toContain("reported");
    expect(ids("alle")).not.toContain("blocked");
    expect(ids("alle")).toContain("full");
    expect(ids("alle")).toContain("guest");
  });

  it("shows a blocked organizer again when nobody is signed in", () => {
    expect(ids("alle", "alle", null)).toContain("blocked");
    expect(ids("alle", "alle", null)).toContain("reported");
  });

  it("sorts the open list by start time", () => {
    expect(ids("heute")).toEqual(["soon", "evening", "full", "guest"]);
  });
});

describe("listMine and visibility", () => {
  it("splits upcoming and finished meetups for the actor", () => {
    const joined = domain([
      meetup({
        id: "evening",
        participants: [
          { id: mira.id, displayName: "Mira" },
          { id: jonas.id, displayName: "Jonas" },
        ],
      }),
      meetup({
        id: "cancelled",
        status: "cancelled",
        participants: [
          { id: mira.id, displayName: "Mira" },
          { id: jonas.id, displayName: "Jonas" },
        ],
      }),
      meetup({
        id: "mine-expired",
        participants: [{ id: jonas.id, displayName: "Jonas" }],
        organizerId: mira.id,
        startsAt: new Date(2026, 10, 7, 9, 0).toISOString(),
        endsAt: new Date(2026, 10, 7, 11, 0).toISOString(),
      }),
    ]);
    const mine = listMine(joined, jonas.id, noon);
    expect(mine.upcoming.map((item) => item.id)).toEqual(["evening"]);
    expect(mine.past.map((item) => item.id)).toEqual(["cancelled", "mine-expired"]);
  });

  it("hides other names until you join, and hides a blocked person", () => {
    expect(visibleParticipants(withGuest, jonas.id, state.blocks).map((person) => person.id)).toEqual([
      mira.id,
    ]);
    expect(visibleParticipants(withGuest, mira.id, state.blocks).map((person) => person.id)).toEqual([
      mira.id,
    ]);
    expect(viewMeetup(state, "reported", mira.id).kind).toBe("hidden");
    expect(viewMeetup(state, "missing", mira.id).kind).toBe("missing");
    expect(viewMeetup(state, "evening", mira.id).kind).toBe("visible");
  });
});

describe("time and city suggestion", () => {
  it("labels today, tomorrow, and a soon start", () => {
    expect(formatMeetupWhen(new Date(soon.startsAt), new Date(soon.endsAt), noon)).toBe("Jetzt, 12:30–14:00");
    expect(formatMeetupWhen(new Date(evening.startsAt), new Date(evening.endsAt), noon)).toBe(
      "Heute, 18:00–20:00",
    );
    expect(formatMeetupWhen(new Date(tomorrow.startsAt), new Date(tomorrow.endsAt), noon)).toBe(
      "Morgen, 15:00–17:00",
    );
  });

  it("suggests the nearest fixed city and does not invent a new one", () => {
    expect(nearestLocality(48.15, 11.58)).toBe("muenchen");
    expect(nearestLocality(52.5, 13.4)).toBe("berlin");
    expect(["berlin", "hamburg", "muenchen", "koeln", "leipzig"]).toContain(nearestLocality(0, 0));
  });
});
