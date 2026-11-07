import { describe, expect, it } from "vitest";
import { filterExplore, listMine } from "@/domain/filter";
import { noon, validInput } from "@/domain/fixtures";
import { placeError } from "@/domain/text";
import { effectiveStatus } from "@/domain/time";
import { createLocalDemoRepository } from "@/data/local-demo-repository";
import { createSharedRepository } from "@/data/shared-repository";
import { buildSeedMeetups } from "@/data/seed";
import { MemoryStorage } from "@/data/storage";

function ids() {
  let count = 0;
  return () => {
    count += 1;
    return `id${count}`;
  };
}

describe("local demo adapter", () => {
  it("labels every seed as an example and keeps public places", () => {
    const seeds = buildSeedMeetups();
    expect(seeds.length).toBeGreaterThan(0);
    for (const meetup of seeds) {
      expect(meetup.synthetic).toBe(true);
      expect(placeError(meetup.placeName)).toBeNull();
    }
  });

  it("stays inside one browser and survives a reload", () => {
    const storage = new MemoryStorage();
    const repo = createLocalDemoRepository(storage, { createId: ids() });
    const before = storage.writes;
    const first = repo.read(noon);
    expect(first.mode).toBe("local-demo");
    expect(first.availability).toBe("ready");
    expect(first.actor).toBeNull();
    expect(storage.writes).toBe(before);

    const early = repo.read(new Date(2026, 10, 7, 10, 0));
    const later = repo.read(new Date(2026, 10, 7, 11, 0));
    const earlyStart = early.meetups.find((meetup) => meetup.id === "seed-berlin-fussball");
    const laterStart = later.meetups.find((meetup) => meetup.id === "seed-berlin-fussball");
    if (!earlyStart || !laterStart) throw new Error("seed missing");
    expect(new Date(laterStart.startsAt).getTime() - new Date(earlyStart.startsAt).getTime()).toBe(
      60 * 60 * 1000,
    );

    const named = repo.setDisplayName("Mira", noon);
    if (!named.ok) throw new Error(named.error.message);
    const created = repo.create(validInput, noon);
    if (!created.ok) throw new Error(created.error.message);
    expect(created.value.synthetic).toBe(false);

    const reloaded = createLocalDemoRepository(storage, { createId: ids() });
    const loaded = reloaded.read(noon);
    expect(loaded.actor?.displayName).toBe("Mira");
    expect(loaded.meetups.some((meetup) => meetup.id === created.value.id && !meetup.synthetic)).toBe(true);

    const joined = reloaded.join("seed-berlin-fussball", noon);
    if (!joined.ok) throw new Error(joined.error.message);
    const duplicate = reloaded.join("seed-berlin-fussball", noon);
    if (duplicate.ok) throw new Error("duplicate join stored");
    expect(duplicate.error.code).toBe("already-joined");

    const full = reloaded.join("seed-berlin-kaffee", noon);
    if (full.ok) throw new Error("full seed accepted a join");
    expect(full.error.code).toBe("full");

    const actorId = reloaded.read(noon).actor?.id;
    const left = reloaded.leave("seed-berlin-fussball", noon);
    if (!left.ok) throw new Error(left.error.message);
    expect(left.value.participants.some((person) => person.id === actorId)).toBe(false);

    const ownLeave = reloaded.leave(created.value.id, noon);
    if (ownLeave.ok) throw new Error("organizer left");
    expect(ownLeave.error.code).toBe("organizer-must-cancel");

    const cancelled = reloaded.cancel(created.value.id, noon);
    if (!cancelled.ok) throw new Error(cancelled.error.message);
    expect(cancelled.value.status).toBe("cancelled");
    const afterCancel = reloaded.read(noon);
    const mine = listMine(
      { meetups: afterCancel.meetups, reports: afterCancel.reports, blocks: afterCancel.blocks },
      afterCancel.actor?.id ?? "",
      noon,
    );
    expect(mine.past.some((meetup) => meetup.id === created.value.id)).toBe(true);

    const reported = reloaded.report("seed-berlin-spazieren", "spam", noon);
    if (!reported.ok) throw new Error(reported.error.message);
    expect(reported.value.scope).toBe("local-demo");
    const view = reloaded.read(noon);
    const visible = filterExplore(
      { meetups: view.meetups, reports: view.reports, blocks: view.blocks },
      {
        localityId: "berlin",
        hobbyId: "alle",
        when: "alle",
        actorId: view.actor?.id ?? null,
        now: noon,
      },
    );
    expect(visible.some((meetup) => meetup.id === "seed-berlin-spazieren")).toBe(false);

    const reset = reloaded.reset(noon);
    expect(reset.actor).toBeNull();
    expect(reset.meetups.some((meetup) => meetup.id === created.value.id)).toBe(false);
    expect(reset.meetups.every((meetup) => meetup.synthetic)).toBe(true);
  });

  it("rejects an expired join and recovers from broken storage", () => {
    const storage = new MemoryStorage();
    const repo = createLocalDemoRepository(storage, { createId: ids() });
    const named = repo.setDisplayName("Jonas", noon);
    if (!named.ok) throw new Error(named.error.message);
    const created = repo.create({ ...validInput, preset: "jetzt" }, noon);
    if (!created.ok) throw new Error(created.error.message);
    const later = new Date(noon.getTime() + 3 * 60 * 60 * 1000);
    const expired = repo.read(later).meetups.find((meetup) => meetup.id === created.value.id);
    if (!expired) throw new Error("created meetup missing");
    expect(effectiveStatus(expired, later)).toBe("expired");
    const joined = repo.join(created.value.id, later);
    if (joined.ok) throw new Error("expired join stored");
    expect(joined.error.code).toBe("expired");

    storage.setItem("runde-demo-v1", "{");
    const recovered = createLocalDemoRepository(storage);
    expect(recovered.read(noon).actor).toBeNull();
    expect(recovered.read(noon).meetups.length).toBe(buildSeedMeetups().length);
    expect(recovered.read(noon).mode).toBe("local-demo");
  });
});

describe("shared repository", () => {
  it("refuses every write and does not pretend there is a community", () => {
    const shared = createSharedRepository();
    const now = noon;
    expect(shared.mode).toBe("shared");
    expect(shared.read(now).availability).toBe("unavailable");
    expect(shared.read(now).meetups).toEqual([]);
    const denied = [
      shared.setDisplayName("Mira", now),
      shared.create(validInput, now),
      shared.join("seed-berlin-fussball", now),
      shared.leave("seed-berlin-fussball", now),
      shared.cancel("seed-berlin-fussball", now),
      shared.report("seed-berlin-fussball", "spam", now),
      shared.block("seed-mira", now),
    ];
    for (const result of denied) {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("shared-unavailable");
    }
  });
});
