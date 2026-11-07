import type { Meetup, Result, TimePreset } from "@/domain/catalog";
import { isPreset } from "@/domain/catalog";
import { messages } from "@/domain/messages";

export const JETZT_LEAD_MS = 20 * 60 * 1000;
export const MEETUP_DURATION_MS = 90 * 60 * 1000;
export const JETZT_WINDOW_MS = 2 * 60 * 60 * 1000;

const WEEKDAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
] as const;

export function atLocal(now: Date, dayOffset: number, hours: number, minutes: number): Date {
  const next = new Date(now.getTime());
  next.setDate(now.getDate() + dayOffset);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function roundUpToMinutes(date: Date, step: number): Date {
  const next = new Date(date.getTime());
  next.setSeconds(0, 0);
  const minutes = next.getMinutes();
  const remainder = minutes % step;
  if (remainder !== 0) next.setMinutes(minutes + (step - remainder));
  return next;
}

export function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function resolvePreset(
  preset: string,
  now: Date,
): Result<{ startsAt: Date; endsAt: Date }> {
  if (!isPreset(preset)) {
    return { ok: false, error: { code: "invalid-preset", message: messages.invalidPreset } };
  }
  if (preset === "jetzt") {
    const startsAt = new Date(now.getTime() + JETZT_LEAD_MS);
    return {
      ok: true,
      value: { startsAt, endsAt: new Date(startsAt.getTime() + MEETUP_DURATION_MS) },
    };
  }
  if (preset === "morgen") {
    return {
      ok: true,
      value: { startsAt: atLocal(now, 1, 15, 0), endsAt: atLocal(now, 1, 17, 0) },
    };
  }
  const evening = atLocal(now, 0, 18, 0);
  if (now.getTime() <= evening.getTime() - 60 * 60 * 1000) {
    return { ok: true, value: { startsAt: evening, endsAt: atLocal(now, 0, 20, 0) } };
  }
  const startsAt = roundUpToMinutes(new Date(now.getTime() + 60 * 60 * 1000), 15);
  if (startsAt.getTime() >= atLocal(now, 0, 21, 0).getTime()) {
    return {
      ok: false,
      error: { code: "preset-unavailable", message: messages.presetUnavailable },
    };
  }
  return {
    ok: true,
    value: { startsAt, endsAt: new Date(startsAt.getTime() + MEETUP_DURATION_MS) },
  };
}

export function syntheticWindow(
  key: NonNullable<Meetup["scheduleKey"]>,
  now: Date,
): { startsAt: Date; endsAt: Date } | null {
  if (key === "soon") {
    const startsAt = new Date(now.getTime() + 35 * 60 * 1000);
    return { startsAt, endsAt: new Date(startsAt.getTime() + MEETUP_DURATION_MS) };
  }
  if (key === "tomorrow") {
    return { startsAt: atLocal(now, 1, 15, 0), endsAt: atLocal(now, 1, 17, 0) };
  }
  const today = resolvePreset("heute", now);
  return today.ok ? today.value : null;
}

export function applySchedule(meetup: Meetup, now: Date): Meetup {
  if (!meetup.synthetic || meetup.scheduleKey === null) return meetup;
  const window = syntheticWindow(meetup.scheduleKey, now);
  if (!window) {
    return {
      ...meetup,
      startsAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      endsAt: new Date(now.getTime() - 60 * 1000).toISOString(),
    };
  }
  return {
    ...meetup,
    startsAt: window.startsAt.toISOString(),
    endsAt: window.endsAt.toISOString(),
  };
}

export function effectiveStatus(meetup: Meetup, now: Date): "open" | "cancelled" | "expired" {
  if (meetup.status === "cancelled") return "cancelled";
  if (new Date(meetup.endsAt).getTime() <= now.getTime()) return "expired";
  return "open";
}

export function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

export function formatMeetupWhen(startsAt: Date, endsAt: Date, now: Date): string {
  const range = `${formatTime(startsAt)}–${formatTime(endsAt)}`;
  const lead = startsAt.getTime() - now.getTime();
  if (
    isSameLocalDay(startsAt, now) &&
    lead <= JETZT_WINDOW_MS &&
    lead >= -30 * 60 * 1000
  ) {
    return `Jetzt, ${range}`;
  }
  if (isSameLocalDay(startsAt, now)) return `Heute, ${range}`;
  const tomorrow = new Date(now.getTime());
  tomorrow.setDate(now.getDate() + 1);
  if (isSameLocalDay(startsAt, tomorrow)) return `Morgen, ${range}`;
  return `${WEEKDAYS[startsAt.getDay()]}, ${range}`;
}

export function presetLabel(preset: TimePreset): string {
  if (preset === "jetzt") return "Jetzt";
  if (preset === "heute") return "Heute";
  return "Morgen";
}
