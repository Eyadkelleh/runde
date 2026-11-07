import type {
  Actor,
  Block,
  CreateInput,
  Meetup,
  Preferences,
  Report,
  Result,
} from "@/domain/catalog";

export type RepositoryMode = "local-demo" | "shared";

export type DemoSnapshot = {
  mode: RepositoryMode;
  availability: "ready" | "unavailable";
  availabilityMessage: string | null;
  actor: Actor | null;
  meetups: Meetup[];
  reports: Report[];
  blocks: Block[];
  preferences: Preferences;
  now: string;
};

/**
 * Persistence seam. The browser demo and a future shared store must both
 * enforce the rules in src/domain, not a second copy of them.
 */
export interface MeetupRepository {
  readonly mode: RepositoryMode;
  read(now: Date): DemoSnapshot;
  setPreferences(preferences: Preferences, now: Date): Result<DemoSnapshot>;
  setDisplayName(name: string, now: Date): Result<DemoSnapshot>;
  create(input: CreateInput, now: Date): Result<Meetup>;
  join(id: string, now: Date): Result<Meetup>;
  leave(id: string, now: Date): Result<Meetup>;
  cancel(id: string, now: Date): Result<Meetup>;
  report(id: string, reasonId: string, now: Date): Result<Report>;
  block(participantId: string, now: Date): Result<Block>;
  reset(now: Date): DemoSnapshot;
}
