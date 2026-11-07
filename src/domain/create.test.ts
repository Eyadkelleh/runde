import { describe, expect, it } from "vitest";
import { createMeetup } from "@/domain/meetups";
import { domain, jonas, mira, noon, validInput } from "@/domain/fixtures";
import { JETZT_LEAD_MS } from "@/domain/time";
import { validateDisplayName } from "@/domain/text";

describe("createMeetup", () => {
  it("stores a public meetup with the organizer counted", () => {
    const result = createMeetup(domain(), validInput, mira, noon, "m-new");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.synthetic).toBe(false);
    expect(result.value.organizerId).toBe(mira.id);
    expect(result.value.participants).toEqual([{ id: mira.id, displayName: "Mira" }]);
    expect(result.value.placeName).toBe("Tempelhofer Feld, Eingang Oderstraße");
    expect(new Date(result.value.startsAt).getHours()).toBe(18);
    expect(result.value.note).toBe("Ball ist da.");
    expect(result.value.placeName.includes("<")).toBe(false);
  });

  it("strips markup from the place and rejects private places and links", () => {
    const stripped = createMeetup(
      domain(),
      { ...validInput, placeName: "  Tempelhofer Feld <b>Eingang</b>  " },
      mira,
      noon,
      "m-clean",
    );
    if (!stripped.ok) throw new Error(stripped.error.message);
    expect(stripped.value.placeName).toBe("Tempelhofer Feld bEingang/b");

    const home = createMeetup(domain(), { ...validInput, placeName: "bei mir zu Hause" }, mira, noon, "m-home");
    if (home.ok) throw new Error("private place accepted");
    expect(home.error.code).toBe("invalid-place");
    expect(home.error.fields?.placeName).toMatch(/öffentlichen Ort/);

    const link = createMeetup(
      domain(),
      { ...validInput, note: "Schau auf https://example.com" },
      mira,
      noon,
      "m-link",
    );
    if (link.ok) throw new Error("link accepted");
    expect(link.error.code).toBe("invalid-note");
  });

  it("reports every invalid field and rejects a late heute preset", () => {
    const result = createMeetup(
      domain(),
      { hobbyId: "tanzen", localityId: "dortmund", placeName: "x", note: "", capacity: 5, preset: "irgendwann" },
      { id: "p-x", displayName: "1" },
      noon,
      "m-bad",
    );
    if (result.ok) throw new Error("invalid create accepted");
    expect(result.error.code).toBe("invalid-name");
    expect(result.error.fields?.hobbyId).toBeTruthy();
    expect(result.error.fields?.localityId).toBeTruthy();
    expect(result.error.fields?.placeName).toBeTruthy();
    expect(result.error.fields?.capacity).toBeTruthy();
    expect(result.error.fields?.preset).toBeTruthy();
    expect(result.error.message).toBe("Prüf die markierten Felder.");

    const late = createMeetup(
      domain(),
      validInput,
      mira,
      new Date(2026, 10, 7, 21, 30),
      "m-late",
    );
    if (late.ok) throw new Error("late heute accepted");
    expect(late.error.code).toBe("preset-unavailable");
  });

  it("allows three open meetups and blocks the fourth until one is cancelled", () => {
    let state = domain();
    for (let index = 0; index < 3; index += 1) {
      const created = createMeetup(state, validInput, mira, noon, `m-${index}`);
      if (!created.ok) throw new Error(created.error.message);
      state = created.state;
    }
    const blocked = createMeetup(state, validInput, mira, noon, "m-4");
    if (blocked.ok) throw new Error("fourth meetup accepted");
    expect(blocked.error.code).toBe("too-many-open");

    const cancelled = {
      ...state,
      meetups: state.meetups.map((meetup, index) =>
        index === 0 ? { ...meetup, status: "cancelled" as const } : meetup,
      ),
    };
    const again = createMeetup(cancelled, { ...validInput, preset: "jetzt" }, mira, noon, "m-5");
    if (!again.ok) throw new Error(again.error.message);
    expect(new Date(again.value.startsAt).getTime() - noon.getTime()).toBe(JETZT_LEAD_MS);
  });

  it("rejects another person's open meetups from the limit and rejects short names", () => {
    const foreign = createMeetup(domain(), validInput, jonas, noon, "m-jonas");
    if (!foreign.ok) throw new Error(foreign.error.message);
    const own = createMeetup(foreign.state, validInput, mira, noon, "m-mira");
    expect(own.ok).toBe(true);
    expect(validateDisplayName("A").ok).toBe(false);
    expect(validateDisplayName("Annika").ok).toBe(true);
    expect(validateDisplayName("User2").ok).toBe(false);
  });
});
