"use client";

import Link from "next/link";
import { findLocality, HOBBIES, WHEN_FILTERS, type Preferences, type WhenFilter } from "@/domain/catalog";
import { filterExplore } from "@/domain/filter";
import { CityField } from "@/components/city-field";
import { LoadingState } from "@/components/app-shell";
import { MeetupCard } from "@/components/meetup-card";
import { useDemo } from "@/components/demo-provider";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

const WHEN_LABELS: Record<WhenFilter, string> = {
  jetzt: "Jetzt",
  heute: "Heute",
  morgen: "Morgen",
  alle: "Alle",
};

export function ExploreView() {
  const { snapshot, setPreferences } = useDemo();
  if (!snapshot) return <LoadingState label="Treffen werden geladen." />;

  const now = new Date(snapshot.now);
  const { preferences } = snapshot;
  const meetups = filterExplore(
    { meetups: snapshot.meetups, reports: snapshot.reports, blocks: snapshot.blocks },
    {
      localityId: preferences.localityId,
      hobbyId: preferences.hobbyId,
      when: preferences.when,
      actorId: snapshot.actor?.id ?? null,
      now,
    },
  );
  const cityLabel = findLocality(preferences.localityId)?.label ?? "dieser Stadt";
  const narrowed = preferences.hobbyId !== "alle" || preferences.when !== "alle";

  function patch(next: Partial<Preferences>) {
    setPreferences({ ...preferences, ...next });
  }

  return (
    <div className="min-w-0 max-w-full space-y-8">
      <header className="space-y-2">
        <p className="font-serif text-3xl tracking-tight md:hidden">
          <Link href="/">Runde</Link>
        </p>
        <h1 className="font-serif text-4xl tracking-tight">Was ist offen?</h1>
        <p className="max-w-md text-muted-foreground">Tätigkeit, öffentlicher Ort, naher Zeitpunkt.</p>
      </header>

      <CityField
        idPrefix="entdecken"
        value={preferences.localityId}
        onChange={(localityId) => patch({ localityId })}
      />

      <fieldset>
        <legend className="text-sm font-medium">Zeit</legend>
        <div className="mt-2 grid w-full grid-cols-4 gap-2">
          {WHEN_FILTERS.map((when) => {
            const selected = preferences.when === when;
            return (
              <label
                key={when}
                className={cn(
                  "flex min-h-11 min-w-0 cursor-pointer items-center justify-center rounded-full border px-2 text-center text-sm",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                )}
              >
                <input
                  type="radio"
                  name="entdecken-zeit"
                  className="sr-only"
                  value={when}
                  checked={selected}
                  onChange={() => patch({ when })}
                />
                {WHEN_LABELS[when]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="min-w-0 max-w-full">
        <legend className="text-sm font-medium">Tätigkeit</legend>
        <div className="mt-2 flex w-full min-w-0 max-w-full flex-wrap gap-2">
          <HobbyChip
            name="entdecken-taetigkeit"
            label="Alle"
            checked={preferences.hobbyId === "alle"}
            onChange={() => patch({ hobbyId: "alle" })}
          />
          {HOBBIES.map((hobby) => (
            <HobbyChip
              key={hobby.id}
              name="entdecken-taetigkeit"
              label={hobby.label}
              checked={preferences.hobbyId === hobby.id}
              onChange={() => patch({ hobbyId: hobby.id })}
            />
          ))}
        </div>
      </fieldset>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {meetups.length === 1 ? "1 Treffen" : `${meetups.length} Treffen`}
      </p>

      {meetups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-5 py-10">
          <h2 className="font-serif text-2xl tracking-tight">Nichts offen</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">
            {narrowed
              ? `Dazu ist in ${cityLabel} gerade nichts offen.`
              : `In ${cityLabel} ist gerade nichts offen.`}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {preferences.when !== "alle" ? (
              <Button type="button" variant="outline" onClick={() => patch({ when: "alle" })}>
                Alle Zeiten
              </Button>
            ) : null}
            {preferences.hobbyId !== "alle" ? (
              <Button type="button" variant="outline" onClick={() => patch({ hobbyId: "alle" })}>
                Alle Tätigkeiten
              </Button>
            ) : null}
            <Button
              nativeButton={false}
              render={<Link href="/neu" />}
            >
              Selbst anlegen
            </Button>
          </div>
        </div>
      ) : (
        <ul className="space-y-3" data-testid="meetup-list">
          {meetups.map((meetup) => (
            <MeetupCard key={meetup.id} meetup={meetup} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}

function HobbyChip({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm",
        checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
      )}
    >
      <input type="radio" name={name} className="sr-only" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

