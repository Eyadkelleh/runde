import type { Result } from "@/domain/catalog";
import { DEFAULT_PREFERENCES } from "@/domain/catalog";
import { messages } from "@/domain/messages";
import type { DemoSnapshot, MeetupRepository } from "@/data/repository";

/**
 * Shared persistence is intentionally unavailable.
 *
 * A real store needs its own database, an authenticated account id, the domain
 * functions executed on the server, access checks, and a person who reads
 * reports. Existing Supabase projects in this account belong to other
 * applications and are not a backend for Runde.
 */
function unavailable(): Result<never> {
  return {
    ok: false,
    error: { code: "shared-unavailable", message: messages.sharedUnavailable },
  };
}

function empty(now: Date): DemoSnapshot {
  return {
    mode: "shared",
    availability: "unavailable",
    availabilityMessage: messages.sharedUnavailable,
    actor: null,
    meetups: [],
    reports: [],
    blocks: [],
    preferences: { ...DEFAULT_PREFERENCES },
    now: now.toISOString(),
  };
}

export function createSharedRepository(): MeetupRepository {
  return {
    mode: "shared",
    read: empty,
    setPreferences() {
      return unavailable();
    },
    setDisplayName() {
      return unavailable();
    },
    create() {
      return unavailable();
    },
    join() {
      return unavailable();
    },
    leave() {
      return unavailable();
    },
    cancel() {
      return unavailable();
    },
    report() {
      return unavailable();
    },
    block() {
      return unavailable();
    },
    reset(now) {
      return empty(now);
    },
  };
}
