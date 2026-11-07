import type { Actor, CreateInput, DomainState, Meetup } from "@/domain/catalog";

export const noon = new Date(2026, 10, 7, 12, 0, 0, 0);

export const mira: Actor = { id: "p-mira", displayName: "Mira" };
export const jonas: Actor = { id: "p-jonas", displayName: "Jonas" };
export const leila: Actor = { id: "p-leila", displayName: "Leila" };

export const validInput: CreateInput = {
  hobbyId: "fussball",
  localityId: "berlin",
  placeName: "Tempelhofer Feld, Eingang Oderstraße",
  note: "Ball ist da.",
  capacity: 4,
  preset: "heute",
};

export function meetup(overrides: Partial<Meetup> = {}): Meetup {
  return {
    id: "m1",
    hobbyId: "fussball",
    localityId: "berlin",
    placeName: "Tempelhofer Feld, Eingang Oderstraße",
    startsAt: new Date(2026, 10, 7, 18, 0).toISOString(),
    endsAt: new Date(2026, 10, 7, 20, 0).toISOString(),
    capacity: 4,
    note: "",
    organizerId: mira.id,
    participants: [{ id: mira.id, displayName: mira.displayName }],
    status: "open",
    synthetic: false,
    scheduleKey: null,
    createdAt: noon.toISOString(),
    ...overrides,
  };
}

export function domain(meetups: Meetup[] = [], extras: Partial<DomainState> = {}): DomainState {
  return {
    meetups,
    reports: [],
    blocks: [],
    ...extras,
  };
}
