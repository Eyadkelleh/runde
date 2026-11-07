import {
  DEFAULT_PREFERENCES,
  type Actor,
  type Block,
  type CreateInput,
  type DomainState,
  type Meetup,
  type Preferences,
  type Report,
  type Result,
  isHobbyId,
  isLocalityId,
  isWhenFilter,
} from "@/domain/catalog";
import { applySchedule } from "@/domain/time";
import {
  blockParticipant,
  cancelMeetup,
  createMeetup,
  joinMeetup,
  leaveMeetup,
  renameParticipants,
  reportMeetup,
} from "@/domain/meetups";
import { messages } from "@/domain/messages";
import { validateDisplayName } from "@/domain/text";
import { buildSeedMeetups } from "@/data/seed";
import type { DemoSnapshot, MeetupRepository } from "@/data/repository";
import type { KeyValueStorage } from "@/data/storage";

const STORAGE_KEY = "runde-demo-v1";
const MEETUP_CAP = 80;

type Persisted = {
  version: 1;
  actor: Actor | null;
  meetups: Meetup[];
  reports: Report[];
  blocks: Block[];
  preferences: Preferences;
};

function emptyState(): Persisted {
  return {
    version: 1,
    actor: null,
    meetups: buildSeedMeetups(),
    reports: [],
    blocks: [],
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMeetup(value: unknown): value is Meetup {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.placeName === "string" &&
    typeof value.organizerId === "string" &&
    Array.isArray(value.participants) &&
    (value.status === "open" || value.status === "cancelled")
  );
}

function reconcile(stored: Meetup[]): Meetup[] {
  const seeds = buildSeedMeetups();
  const seedIds = new Set(seeds.map((meetup) => meetup.id));
  const previous = new Map(stored.map((meetup) => [meetup.id, meetup]));
  const mergedSeeds = seeds.map((seed) => {
    const saved = previous.get(seed.id);
    if (!saved) return seed;
    return {
      ...seed,
      participants: saved.participants,
      status: saved.status,
    };
  });
  const own = stored.filter((meetup) => !seedIds.has(meetup.id) && meetup.synthetic !== true);
  return [...mergedSeeds, ...own].slice(0, MEETUP_CAP);
}

function preferencesFrom(value: unknown): Preferences {
  if (!isRecord(value)) return { ...DEFAULT_PREFERENCES };
  const localityId = typeof value.localityId === "string" ? value.localityId : "";
  const hobbyId = typeof value.hobbyId === "string" ? value.hobbyId : "alle";
  const when = typeof value.when === "string" ? value.when : "heute";
  const hobby: Preferences["hobbyId"] =
    hobbyId === "alle" || isHobbyId(hobbyId) ? hobbyId : "alle";
  return {
    localityId: isLocalityId(localityId) ? localityId : DEFAULT_PREFERENCES.localityId,
    hobbyId: hobby,
    when: isWhenFilter(when) ? when : DEFAULT_PREFERENCES.when,
  };
}

function actorFrom(value: unknown): Actor | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.displayName !== "string") {
    return null;
  }
  const name = validateDisplayName(value.displayName);
  if (!name.ok) return null;
  return { id: value.id, displayName: name.value };
}

function parsePersisted(raw: string | null): Persisted {
  if (!raw) return emptyState();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1) return emptyState();
    const meetups = Array.isArray(parsed.meetups) ? parsed.meetups.filter(isMeetup) : [];
    const reports = Array.isArray(parsed.reports) ? (parsed.reports as Report[]) : [];
    const blocks = Array.isArray(parsed.blocks) ? (parsed.blocks as Block[]) : [];
    return {
      version: 1,
      actor: actorFrom(parsed.actor),
      meetups: reconcile(meetups),
      reports: reports.filter(
        (report) =>
          isRecord(report) &&
          typeof report.meetupId === "string" &&
          typeof report.reporterId === "string" &&
          report.scope === "local-demo",
      ),
      blocks: blocks.filter(
        (block) =>
          isRecord(block) &&
          typeof block.blockerId === "string" &&
          typeof block.blockedParticipantId === "string" &&
          block.scope === "local-demo",
      ),
      preferences: preferencesFrom(parsed.preferences),
    };
  } catch {
    return emptyState();
  }
}

  function domainOf(state: Persisted, now?: Date): DomainState {
    return {
      meetups: now ? state.meetups.map((meetup) => applySchedule(meetup, now)) : state.meetups,
      reports: state.reports,
      blocks: state.blocks,
    };
  }

export function createLocalDemoRepository(
  storage: KeyValueStorage,
  options?: { createId?: () => string },
): MeetupRepository {
  let state = parsePersisted(storage.getItem(STORAGE_KEY));
  const createId =
    options?.createId ??
    (() => {
      const value =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(16).slice(2);
      return value.replace(/-/g, "").slice(0, 12);
    });

  function snapshot(now: Date): DemoSnapshot {
    return {
      mode: "local-demo",
      availability: "ready",
      availabilityMessage: null,
      actor: state.actor,
      meetups: state.meetups.map((meetup) => applySchedule(meetup, now)),
      reports: state.reports,
      blocks: state.blocks,
      preferences: state.preferences,
      now: now.toISOString(),
    };
  }

  function write(next: Persisted): Result<null> {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      return { ok: false, error: { code: "storage", message: messages.storage } };
    }
    state = next;
    return { ok: true, value: null };
  }

  function requireActor(): Result<Actor> {
    if (!state.actor) {
      return { ok: false, error: { code: "invalid-name", message: messages.nameRequired } };
    }
    return { ok: true, value: state.actor };
  }

  return {
    mode: "local-demo",
    read: snapshot,
    setPreferences(preferences, now) {
      const saved = write({ ...state, preferences });
      if (!saved.ok) return saved;
      return { ok: true, value: snapshot(now) };
    },
    setDisplayName(name, now) {
      const valid = validateDisplayName(name);
      if (!valid.ok) return valid;
      const actor = state.actor
        ? { ...state.actor, displayName: valid.value }
        : { id: `p-${createId()}`, displayName: valid.value };
      const domain = renameParticipants(domainOf(state), actor);
      const saved = write({ ...state, actor, meetups: domain.meetups });
      if (!saved.ok) return saved;
      return { ok: true, value: snapshot(now) };
    },
    create(input: CreateInput, now) {
      const actor = requireActor();
      if (!actor.ok) return actor;
      if (state.meetups.length >= MEETUP_CAP) {
        return { ok: false, error: { code: "too-many-open", message: messages.tooManyOpen } };
      }
      const result = createMeetup(domainOf(state, now), input, actor.value, now, `m-${createId()}`);
      if (!result.ok) return result;
      const saved = write({ ...state, ...result.state });
      if (!saved.ok) return saved;
      return { ok: true, value: result.value };
    },
    join(id, now) {
      const actor = requireActor();
      if (!actor.ok) return actor;
      const result = joinMeetup(domainOf(state, now), id, actor.value, now);
      if (!result.ok) return result;
      const saved = write({ ...state, ...result.state });
      if (!saved.ok) return saved;
      return { ok: true, value: result.value };
    },
    leave(id, now) {
      const actor = requireActor();
      if (!actor.ok) return actor;
      const result = leaveMeetup(domainOf(state, now), id, actor.value.id);
      if (!result.ok) return result;
      const saved = write({ ...state, ...result.state });
      if (!saved.ok) return saved;
      return { ok: true, value: result.value };
    },
    cancel(id, now) {
      const actor = requireActor();
      if (!actor.ok) return actor;
      const result = cancelMeetup(domainOf(state, now), id, actor.value.id);
      if (!result.ok) return result;
      const saved = write({ ...state, ...result.state });
      if (!saved.ok) return saved;
      return { ok: true, value: result.value };
    },
    report(id, reasonId, now) {
      const actor = requireActor();
      if (!actor.ok) return actor;
      const result = reportMeetup(domainOf(state, now), id, actor.value, reasonId, now, `r-${createId()}`);
      if (!result.ok) return result;
      const saved = write({ ...state, ...result.state });
      if (!saved.ok) return saved;
      return { ok: true, value: result.value };
    },
    block(participantId, now) {
      const actor = requireActor();
      if (!actor.ok) return actor;
      const result = blockParticipant(domainOf(state, now), actor.value.id, participantId, now);
      if (!result.ok) return result;
      const saved = write({ ...state, ...result.state });
      if (!saved.ok) return saved;
      return { ok: true, value: result.value };
    },
    reset(now) {
      const next = emptyState();
      write(next);
      return snapshot(now);
    },
  };
}

export function createBrowserRepository(storage: KeyValueStorage): MeetupRepository {
  return createLocalDemoRepository(storage);
}
