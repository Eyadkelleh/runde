import type { Meetup, Participant } from "@/domain/catalog";

const mira: Participant = { id: "seed-mira", displayName: "Mira" };
const jonas: Participant = { id: "seed-jonas", displayName: "Jonas" };
const leila: Participant = { id: "seed-leila", displayName: "Leila" };
const sven: Participant = { id: "seed-sven", displayName: "Sven" };
const noor: Participant = { id: "seed-noor", displayName: "Noor" };
const emil: Participant = { id: "seed-emil", displayName: "Emil" };

const PLACEHOLDER_START = "1970-01-01T00:00:00.000Z";
const PLACEHOLDER_END = "1970-01-01T01:00:00.000Z";

function example(
  meetup: Pick<Meetup, "id" | "hobbyId" | "localityId" | "placeName" | "capacity" | "scheduleKey" | "note"> & {
    organizer: Participant;
    others?: Participant[];
  },
): Meetup {
  return {
    id: meetup.id,
    hobbyId: meetup.hobbyId,
    localityId: meetup.localityId,
    placeName: meetup.placeName,
    startsAt: PLACEHOLDER_START,
    endsAt: PLACEHOLDER_END,
    capacity: meetup.capacity,
    note: meetup.note,
    organizerId: meetup.organizer.id,
    participants: [meetup.organizer, ...(meetup.others ?? [])],
    status: "open",
    synthetic: true,
    scheduleKey: meetup.scheduleKey,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

export function buildSeedMeetups(): Meetup[] {
  return [
    example({
      id: "seed-berlin-fussball",
      hobbyId: "fussball",
      localityId: "berlin",
      placeName: "Tempelhofer Feld, Eingang Oderstraße",
      capacity: 6,
      scheduleKey: "soon",
      note: "Ball ist da. Kleines Tor auf der linken Seite.",
      organizer: mira,
      others: [jonas, leila],
    }),
    example({
      id: "seed-berlin-kaffee",
      hobbyId: "kaffee",
      localityId: "berlin",
      placeName: "Café am Neuen See",
      capacity: 2,
      scheduleKey: "soon",
      note: "",
      organizer: noor,
      others: [emil],
    }),
    example({
      id: "seed-berlin-spazieren",
      hobbyId: "spazieren",
      localityId: "berlin",
      placeName: "Volkspark Friedrichshain, Märchenbrunnen",
      capacity: 4,
      scheduleKey: "today",
      note: "Lockere Runde, etwa eine Stunde.",
      organizer: sven,
    }),
    example({
      id: "seed-berlin-brett",
      hobbyId: "brettspiele",
      localityId: "berlin",
      placeName: "Café Einstein, Unter den Linden",
      capacity: 4,
      scheduleKey: "tomorrow",
      note: "Zwei Spiele sind schon da. Weitere gerne mitbringen.",
      organizer: leila,
      others: [jonas],
    }),
    example({
      id: "seed-berlin-rad",
      hobbyId: "radfahren",
      localityId: "berlin",
      placeName: "Gleisdreieckpark, Eingang Yorkstraße",
      capacity: 4,
      scheduleKey: "tomorrow",
      note: "",
      organizer: sven,
    }),
    example({
      id: "seed-hamburg-laufen",
      hobbyId: "laufen",
      localityId: "hamburg",
      placeName: "Stadtpark, Freilichtbühne",
      capacity: 4,
      scheduleKey: "soon",
      note: "Ruhiges Tempo, kein Wettkampf.",
      organizer: noor,
      others: [mira],
    }),
    example({
      id: "seed-hamburg-kaffee",
      hobbyId: "kaffee",
      localityId: "hamburg",
      placeName: "Café Paris, Rathausstraße",
      capacity: 3,
      scheduleKey: "today",
      note: "",
      organizer: emil,
    }),
    example({
      id: "seed-muenchen-spazieren",
      hobbyId: "spazieren",
      localityId: "muenchen",
      placeName: "Englischer Garten, Monopteros",
      capacity: 4,
      scheduleKey: "today",
      note: "",
      organizer: leila,
      others: [jonas],
    }),
    example({
      id: "seed-muenchen-brett",
      hobbyId: "brettspiele",
      localityId: "muenchen",
      placeName: "Café Luitpold",
      capacity: 4,
      scheduleKey: "tomorrow",
      note: "",
      organizer: sven,
    }),
    example({
      id: "seed-koeln-fussball",
      hobbyId: "fussball",
      localityId: "koeln",
      placeName: "Rheinpark, Tanzbrunnen",
      capacity: 6,
      scheduleKey: "soon",
      note: "",
      organizer: jonas,
      others: [leila, noor, emil],
    }),
    example({
      id: "seed-koeln-rad",
      hobbyId: "radfahren",
      localityId: "koeln",
      placeName: "Volksgarten, Eingang Vorgebirgstraße",
      capacity: 3,
      scheduleKey: "tomorrow",
      note: "",
      organizer: mira,
    }),
    example({
      id: "seed-leipzig-brett",
      hobbyId: "brettspiele",
      localityId: "leipzig",
      placeName: "Café Grundmann",
      capacity: 4,
      scheduleKey: "today",
      note: "",
      organizer: noor,
      others: [emil],
    }),
    example({
      id: "seed-leipzig-spazieren",
      hobbyId: "spazieren",
      localityId: "leipzig",
      placeName: "Clara-Zetkin-Park, Musikpavillon",
      capacity: 4,
      scheduleKey: "tomorrow",
      note: "",
      organizer: leila,
    }),
  ];
}
