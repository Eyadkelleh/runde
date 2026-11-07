export const HOBBIES = [
  { id: "fussball", label: "Fußball" },
  { id: "spazieren", label: "Spazieren" },
  { id: "brettspiele", label: "Brettspiele" },
  { id: "laufen", label: "Laufen" },
  { id: "kaffee", label: "Kaffee" },
  { id: "radfahren", label: "Radfahren" },
] as const;

export const LOCALITIES = [
  {
    id: "berlin",
    label: "Berlin",
    places: [
      "Tempelhofer Feld, Eingang Oderstraße",
      "Mauerpark, Eingang Schwedter Straße",
      "Volkspark Friedrichshain, Märchenbrunnen",
      "Café am Neuen See",
      "Gleisdreieckpark, Eingang Yorkstraße",
    ],
  },
  {
    id: "hamburg",
    label: "Hamburg",
    places: [
      "Stadtpark, Freilichtbühne",
      "Planten un Blomen, Eingang Jungiusstraße",
      "Elbstrand Övelgönne",
      "Café Paris, Rathausstraße",
    ],
  },
  {
    id: "muenchen",
    label: "München",
    places: [
      "Englischer Garten, Monopteros",
      "Hirschgarten",
      "Olympiapark, Eingang Coubertinplatz",
      "Café Luitpold",
    ],
  },
  {
    id: "koeln",
    label: "Köln",
    places: [
      "Rheinpark, Tanzbrunnen",
      "Hiroshima-Nagasaki-Park",
      "Volksgarten, Eingang Vorgebirgstraße",
      "Café Reichard",
    ],
  },
  {
    id: "leipzig",
    label: "Leipzig",
    places: [
      "Clara-Zetkin-Park, Musikpavillon",
      "Cospudener See, Eingang Nord",
      "Karl-Heine-Kanal, Stelzenhaus",
      "Café Grundmann",
    ],
  },
] as const;

export const CAPACITIES = [2, 3, 4, 6] as const;

export const PRESETS = ["jetzt", "heute", "morgen"] as const;

export const WHEN_FILTERS = ["jetzt", "heute", "morgen", "alle"] as const;

export const REPORT_REASONS = [
  { id: "privatort", label: "Wirkt wie ein privater Ort" },
  { id: "belaestigung", label: "Belästigung oder Druck" },
  { id: "spam", label: "Werbung oder Unsinn" },
  { id: "sonstiges", label: "Etwas anderes" },
] as const;

export const DEFAULT_PREFERENCES = {
  localityId: "berlin",
  hobbyId: "alle",
  when: "heute",
} as const;

/** City centers used only to suggest one of the fixed cities. Never a person's position. */
const CITY_CENTERS: Record<string, { latitude: number; longitude: number }> = {
  berlin: { latitude: 52.52, longitude: 13.405 },
  hamburg: { latitude: 53.551, longitude: 9.993 },
  muenchen: { latitude: 48.137, longitude: 11.575 },
  koeln: { latitude: 50.938, longitude: 6.96 },
  leipzig: { latitude: 51.34, longitude: 12.375 },
};

export type HobbyId = (typeof HOBBIES)[number]["id"];
export type LocalityId = (typeof LOCALITIES)[number]["id"];
export type Capacity = (typeof CAPACITIES)[number];
export type TimePreset = (typeof PRESETS)[number];
export type WhenFilter = (typeof WHEN_FILTERS)[number];
export type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];
export type ScheduleKey = "soon" | "today" | "tomorrow";

export type Actor = {
  id: string;
  displayName: string;
};

export type Participant = {
  id: string;
  displayName: string;
};

export type Meetup = {
  id: string;
  hobbyId: HobbyId;
  localityId: LocalityId;
  placeName: string;
  startsAt: string;
  endsAt: string;
  capacity: Capacity;
  note: string;
  organizerId: string;
  participants: Participant[];
  status: "open" | "cancelled";
  synthetic: boolean;
  scheduleKey: ScheduleKey | null;
  createdAt: string;
};

export type Report = {
  id: string;
  meetupId: string;
  reporterId: string;
  reasonId: ReportReasonId;
  createdAt: string;
  scope: "local-demo";
};

export type Block = {
  blockerId: string;
  blockedParticipantId: string;
  createdAt: string;
  scope: "local-demo";
};

export type Preferences = {
  localityId: LocalityId;
  hobbyId: HobbyId | "alle";
  when: WhenFilter;
};

export type DomainState = {
  meetups: Meetup[];
  reports: Report[];
  blocks: Block[];
};

export type FieldKey =
  | "hobbyId"
  | "localityId"
  | "placeName"
  | "note"
  | "capacity"
  | "preset"
  | "name";

export type DomainErrorCode =
  | "invalid-name"
  | "invalid-hobby"
  | "invalid-locality"
  | "invalid-place"
  | "invalid-note"
  | "invalid-capacity"
  | "invalid-preset"
  | "preset-unavailable"
  | "too-many-open"
  | "not-found"
  | "cancelled"
  | "expired"
  | "full"
  | "already-joined"
  | "not-participant"
  | "organizer-must-cancel"
  | "not-organizer"
  | "already-cancelled"
  | "invalid-reason"
  | "cannot-block-self"
  | "hidden"
  | "storage"
  | "shared-unavailable";

export type DomainError = {
  code: DomainErrorCode;
  message: string;
  fields?: Partial<Record<FieldKey, string>>;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: DomainError };

export type Mutation<T> =
  | { ok: true; state: DomainState; value: T }
  | { ok: false; error: DomainError };

export type CreateInput = {
  hobbyId: string;
  localityId: string;
  placeName: string;
  note: string;
  capacity: number;
  preset: string;
};

export function findHobby(id: string) {
  return HOBBIES.find((hobby) => hobby.id === id) ?? null;
}

export function findLocality(id: string) {
  return LOCALITIES.find((locality) => locality.id === id) ?? null;
}

export function findReason(id: string) {
  return REPORT_REASONS.find((reason) => reason.id === id) ?? null;
}

export function isHobbyId(value: string): value is HobbyId {
  return findHobby(value) !== null;
}

export function isLocalityId(value: string): value is LocalityId {
  return findLocality(value) !== null;
}

export function isCapacity(value: number): value is Capacity {
  return (CAPACITIES as readonly number[]).includes(value);
}

export function isPreset(value: string): value is TimePreset {
  return (PRESETS as readonly string[]).includes(value);
}

export function isWhenFilter(value: string): value is WhenFilter {
  return (WHEN_FILTERS as readonly string[]).includes(value);
}

function distanceKm(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const earth = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLon = ((toLon - fromLon) * Math.PI) / 180;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function nearestLocality(latitude: number, longitude: number): LocalityId {
  let best: LocalityId = "berlin";
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const locality of LOCALITIES) {
    const center = CITY_CENTERS[locality.id];
    if (!center) continue;
    const distance = distanceKm(
      latitude,
      longitude,
      center.latitude,
      center.longitude,
    );
    if (distance < bestDistance) {
      best = locality.id;
      bestDistance = distance;
    }
  }
  return best;
}
