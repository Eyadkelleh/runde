import type {
  Actor,
  Block,
  CreateInput,
  DomainError,
  DomainState,
  FieldKey,
  Meetup,
  Mutation,
  Report,
} from "@/domain/catalog";
import {
  findReason,
  isCapacity,
  isHobbyId,
  isLocalityId,
} from "@/domain/catalog";
import { messages } from "@/domain/messages";
import { normalizeText, noteError, placeError, validateDisplayName } from "@/domain/text";
import { effectiveStatus, resolvePreset } from "@/domain/time";

const OPEN_CREATE_LIMIT = 3;

function fail(error: DomainError): Mutation<never> {
  return { ok: false, error };
}

function fieldFailure(
  code: DomainError["code"],
  fields: Partial<Record<FieldKey, string>>,
  formMessage?: string,
): Mutation<never> {
  const fieldMessages = Object.values(fields);
  const message =
    fieldMessages.length > 1
      ? messages.checkFields
      : (formMessage ?? fieldMessages[0] ?? messages.checkFields);
  return fail({ code, message, fields });
}

export function placesLeft(meetup: Meetup): number {
  return Math.max(0, meetup.capacity - meetup.participants.length);
}

export function seatsLabel(meetup: Meetup, now: Date): string {
  const status = effectiveStatus(meetup, now);
  if (status === "cancelled") return "Abgesagt";
  if (status === "expired") return "Vorbei";
  const left = placesLeft(meetup);
  if (left === 0) return "Voll";
  if (left === 1) return "1 Platz frei";
  return `${left} Plätze frei`;
}

export function organizerName(meetup: Meetup): string {
  return (
    meetup.participants.find((person) => person.id === meetup.organizerId)?.displayName ??
    "Unbekannt"
  );
}

export function isParticipant(meetup: Meetup, actorId: string | null): boolean {
  return actorId !== null && meetup.participants.some((person) => person.id === actorId);
}

function hiddenReason(state: DomainState, meetup: Meetup, actorId: string): "reported" | "blocked" | null {
  if (state.reports.some((report) => report.reporterId === actorId && report.meetupId === meetup.id)) {
    return "reported";
  }
  if (
    state.blocks.some(
      (block) => block.blockerId === actorId && block.blockedParticipantId === meetup.organizerId,
    )
  ) {
    return "blocked";
  }
  return null;
}

export function createMeetup(
  state: DomainState,
  input: CreateInput,
  actor: Actor,
  now: Date,
  id: string,
): Mutation<Meetup> {
  const fields: Partial<Record<FieldKey, string>> = {};
  const name = validateDisplayName(actor.displayName);
  if (!name.ok) fields.name = name.error.message;
  if (!isHobbyId(input.hobbyId)) fields.hobbyId = messages.invalidHobby;
  if (!isLocalityId(input.localityId)) fields.localityId = messages.invalidLocality;
  const placeProblem = placeError(input.placeName);
  if (placeProblem) fields.placeName = placeProblem;
  const note = noteError(input.note);
  if (note.error) fields.note = note.error;
  if (!isCapacity(input.capacity)) fields.capacity = messages.invalidCapacity;

  const preset = resolvePreset(input.preset, now);
  if (!preset.ok) fields.preset = preset.error.message;

  if (Object.keys(fields).length > 0) {
    const code = fields.name
      ? "invalid-name"
      : fields.hobbyId
        ? "invalid-hobby"
        : fields.localityId
          ? "invalid-locality"
          : fields.placeName
            ? "invalid-place"
            : fields.note
              ? "invalid-note"
              : fields.capacity
                ? "invalid-capacity"
                : preset.ok
                  ? "invalid-preset"
                  : preset.error.code;
    return fieldFailure(code, fields);
  }

  if (!preset.ok || !name.ok || !isHobbyId(input.hobbyId) || !isLocalityId(input.localityId) || !isCapacity(input.capacity)) {
    return fail({ code: "invalid-preset", message: messages.invalidPreset });
  }

  const openCount = state.meetups.filter(
    (meetup) => meetup.organizerId === actor.id && effectiveStatus(meetup, now) === "open",
  ).length;
  if (openCount >= OPEN_CREATE_LIMIT) {
    return fail({ code: "too-many-open", message: messages.tooManyOpen });
  }

  const meetup: Meetup = {
    id,
    hobbyId: input.hobbyId,
    localityId: input.localityId,
    placeName: normalizeText(input.placeName),
    startsAt: preset.value.startsAt.toISOString(),
    endsAt: preset.value.endsAt.toISOString(),
    capacity: input.capacity,
    note: note.note,
    organizerId: actor.id,
    participants: [{ id: actor.id, displayName: name.value }],
    status: "open",
    synthetic: false,
    scheduleKey: null,
    createdAt: now.toISOString(),
  };

  return {
    ok: true,
    state: { ...state, meetups: [...state.meetups, meetup] },
    value: meetup,
  };
}

export function joinMeetup(
  state: DomainState,
  meetupId: string,
  actor: Actor,
  now: Date,
): Mutation<Meetup> {
  const name = validateDisplayName(actor.displayName);
  if (!name.ok) return fail(name.error);
  const meetup = state.meetups.find((item) => item.id === meetupId);
  if (!meetup) return fail({ code: "not-found", message: messages.notFound });
  if (hiddenReason(state, meetup, actor.id)) {
    return fail({ code: "hidden", message: messages.hidden });
  }
  const status = effectiveStatus(meetup, now);
  if (status === "cancelled") return fail({ code: "cancelled", message: messages.cancelled });
  if (status === "expired") return fail({ code: "expired", message: messages.expired });
  if (isParticipant(meetup, actor.id)) {
    return fail({ code: "already-joined", message: messages.alreadyJoined });
  }
  if (meetup.participants.length >= meetup.capacity) {
    return fail({ code: "full", message: messages.full });
  }
  const next: Meetup = {
    ...meetup,
    participants: [...meetup.participants, { id: actor.id, displayName: name.value }],
  };
  return {
    ok: true,
    state: {
      ...state,
      meetups: state.meetups.map((item) => (item.id === meetup.id ? next : item)),
    },
    value: next,
  };
}

export function leaveMeetup(
  state: DomainState,
  meetupId: string,
  actorId: string,
): Mutation<Meetup> {
  const meetup = state.meetups.find((item) => item.id === meetupId);
  if (!meetup) return fail({ code: "not-found", message: messages.notFound });
  if (!isParticipant(meetup, actorId)) {
    return fail({ code: "not-participant", message: messages.notParticipant });
  }
  if (meetup.organizerId === actorId) {
    return fail({ code: "organizer-must-cancel", message: messages.organizerMustCancel });
  }
  const next: Meetup = {
    ...meetup,
    participants: meetup.participants.filter((person) => person.id !== actorId),
  };
  return {
    ok: true,
    state: {
      ...state,
      meetups: state.meetups.map((item) => (item.id === meetup.id ? next : item)),
    },
    value: next,
  };
}

export function cancelMeetup(
  state: DomainState,
  meetupId: string,
  actorId: string,
): Mutation<Meetup> {
  const meetup = state.meetups.find((item) => item.id === meetupId);
  if (!meetup) return fail({ code: "not-found", message: messages.notFound });
  if (meetup.organizerId !== actorId) {
    return fail({ code: "not-organizer", message: messages.notOrganizer });
  }
  if (meetup.status === "cancelled") {
    return fail({ code: "already-cancelled", message: messages.alreadyCancelled });
  }
  const next: Meetup = { ...meetup, status: "cancelled" };
  return {
    ok: true,
    state: {
      ...state,
      meetups: state.meetups.map((item) => (item.id === meetup.id ? next : item)),
    },
    value: next,
  };
}

export function reportMeetup(
  state: DomainState,
  meetupId: string,
  actor: Actor,
  reasonId: string,
  now: Date,
  id: string,
): Mutation<Report> {
  const meetup = state.meetups.find((item) => item.id === meetupId);
  if (!meetup) return fail({ code: "not-found", message: messages.notFound });
  const reason = findReason(reasonId);
  if (!reason) return fail({ code: "invalid-reason", message: messages.invalidReason });
  const existing = state.reports.find(
    (report) => report.reporterId === actor.id && report.meetupId === meetupId,
  );
  if (existing) return { ok: true, state, value: existing };
  const report: Report = {
    id,
    meetupId,
    reporterId: actor.id,
    reasonId: reason.id,
    createdAt: now.toISOString(),
    scope: "local-demo",
  };
  return {
    ok: true,
    state: { ...state, reports: [...state.reports, report] },
    value: report,
  };
}

export function blockParticipant(
  state: DomainState,
  actorId: string,
  blockedParticipantId: string,
  now: Date,
): Mutation<Block> {
  if (!blockedParticipantId || blockedParticipantId === actorId) {
    return fail({ code: "cannot-block-self", message: messages.cannotBlockSelf });
  }
  const existing = state.blocks.find(
    (block) => block.blockerId === actorId && block.blockedParticipantId === blockedParticipantId,
  );
  if (existing) return { ok: true, state, value: existing };
  const block: Block = {
    blockerId: actorId,
    blockedParticipantId,
    createdAt: now.toISOString(),
    scope: "local-demo",
  };
  return {
    ok: true,
    state: { ...state, blocks: [...state.blocks, block] },
    value: block,
  };
}

export function renameParticipants(state: DomainState, actor: Actor): DomainState {
  return {
    ...state,
    meetups: state.meetups.map((meetup) => ({
      ...meetup,
      participants: meetup.participants.map((person) =>
        person.id === actor.id ? { ...person, displayName: actor.displayName } : person,
      ),
    })),
  };
}
