"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CAPACITIES,
  HOBBIES,
  findLocality,
  type Capacity,
  type DomainError,
  type LocalityId,
  type TimePreset,
} from "@/domain/catalog";
import { formatMeetupWhen, presetLabel, resolvePreset } from "@/domain/time";
import { LoadingState } from "@/components/app-shell";
import { CityField } from "@/components/city-field";
import { choiceClass } from "@/components/dialogs";
import { useDemo } from "@/components/demo-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const PRESET_OPTIONS: TimePreset[] = ["jetzt", "heute", "morgen"];

export function CreateForm() {
  const { snapshot } = useDemo();
  if (!snapshot) return <LoadingState label="Formular wird geladen." />;
  if (snapshot.availability !== "ready") {
    return (
      <div role="alert">
        <h1 className="font-serif text-4xl tracking-tight">Kein gemeinsamer Speicher</h1>
        <p className="mt-3 text-muted-foreground">{snapshot.availabilityMessage}</p>
      </div>
    );
  }
  return <CreateFields localityId={snapshot.preferences.localityId} nowIso={snapshot.now} />;
}

function CreateFields({ localityId: initialLocality, nowIso }: { localityId: LocalityId; nowIso: string }) {
  const router = useRouter();
  const { snapshot, saveName, create, setPreferences } = useDemo();
  const now = new Date(nowIso);
  const lock = useRef(false);
  const heute = resolvePreset("heute", now);
  const [hobbyId, setHobbyId] = useState("");
  const [localityId, setLocalityId] = useState<LocalityId>(initialLocality);
  const [placeName, setPlaceName] = useState("");
  const [preset, setPreset] = useState<TimePreset>(heute.ok ? "heute" : "jetzt");
  const [capacity, setCapacity] = useState<Capacity>(4);
  const [note, setNote] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<DomainError | null>(null);
  const actor = snapshot?.actor ?? null;
  const places = findLocality(localityId)?.places ?? [];

  function describedBy(id: string, hasError: boolean) {
    return hasError ? `${id}-hint ${id}-error` : `${id}-hint`;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !snapshot) return;
    lock.current = true;
    setError(null);
    setNameError(null);
    if (!actor) {
      const named = saveName(displayName);
      if (!named.ok) {
        setNameError(named.error.message);
        lock.current = false;
        return;
      }
    }
    const result = create({ hobbyId, localityId, placeName, note, capacity, preset });
    if (!result.ok) {
      setError(result.error);
      lock.current = false;
      return;
    }
    setPreferences({ ...snapshot.preferences, localityId: result.value.localityId });
    router.push(`/treffen/${result.value.id}`);
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-8">
      <header className="space-y-2">
        <p className="font-serif text-3xl tracking-tight md:hidden">
          <Link href="/">Runde</Link>
        </p>
        <h1 className="font-serif text-4xl tracking-tight">Treffen anlegen</h1>
        <p className="text-muted-foreground">Tätigkeit, öffentlicher Ort, naher Zeitpunkt.</p>
      </header>

      {error && !error.fields ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      <fieldset aria-describedby={error?.fields?.hobbyId ? "hobby-error" : undefined}>
        <legend className="text-sm font-medium">Tätigkeit</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {HOBBIES.map((hobby) => (
            <label key={hobby.id} className={choiceClass(hobbyId === hobby.id)}>
              <input
                type="radio"
                className="sr-only"
                name="anlegen-taetigkeit"
                value={hobby.id}
                checked={hobbyId === hobby.id}
                onChange={() => setHobbyId(hobby.id)}
              />
              {hobby.label}
            </label>
          ))}
        </div>
        {error?.fields?.hobbyId ? (
          <p id="hobby-error" role="alert" className="mt-2 text-sm text-destructive">
            {error.fields.hobbyId}
          </p>
        ) : null}
      </fieldset>

      <CityField idPrefix="anlegen" value={localityId} onChange={setLocalityId} />
      {error?.fields?.localityId ? (
        <p role="alert" className="text-sm text-destructive">
          {error.fields.localityId}
        </p>
      ) : null}

      <div>
        <Label htmlFor="treffpunkt">Treffpunkt</Label>
        <Input
          id="treffpunkt"
          className="mt-2"
          value={placeName}
          onChange={(event) => setPlaceName(event.target.value)}
          autoComplete="off"
          aria-invalid={error?.fields?.placeName ? true : undefined}
          aria-describedby={describedBy("treffpunkt", Boolean(error?.fields?.placeName))}
        />
        <p id="treffpunkt-hint" className="mt-2 text-sm leading-6 text-muted-foreground">
          Öffentlicher Ort. Keine Wohnung, keine private Adresse.
        </p>
        {error?.fields?.placeName ? (
          <p id="treffpunkt-error" role="alert" className="mt-2 text-sm text-destructive">
            {error.fields.placeName}
          </p>
        ) : null}
        <div className="mt-3 flex flex-col gap-2">
          {places.map((place) => (
            <button
              key={place}
              type="button"
              className="min-h-11 rounded-lg border border-border bg-card px-3 text-left text-sm"
              onClick={() => setPlaceName(place)}
            >
              {place}
            </button>
          ))}
        </div>
      </div>

      <fieldset aria-describedby={error?.fields?.preset ? "zeit-error" : undefined}>
        <legend className="text-sm font-medium">Wann</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {PRESET_OPTIONS.map((option) => {
            const resolved = resolvePreset(option, now);
            const disabled = !resolved.ok;
            const hint = resolved.ok
              ? formatMeetupWhen(resolved.value.startsAt, resolved.value.endsAt, now)
              : "Heute zu spät";
            return (
              <label key={option} className={choiceClass(preset === option, disabled)}>
                <input
                  type="radio"
                  className="sr-only"
                  name="anlegen-wann"
                  value={option}
                  disabled={disabled}
                  checked={preset === option}
                  onChange={() => setPreset(option)}
                />
                <span className="block text-center">
                  <span className="block font-medium">{presetLabel(option)}</span>
                  <span className="mt-1 block text-xs">{hint}</span>
                </span>
              </label>
            );
          })}
        </div>
        {error?.fields?.preset ? (
          <p id="zeit-error" role="alert" className="mt-2 text-sm text-destructive">
            {error.fields.preset}
          </p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Plätze</legend>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {CAPACITIES.map((option) => (
            <label key={option} className={choiceClass(capacity === option)}>
              <input
                type="radio"
                className="sr-only"
                name="anlegen-plaetze"
                value={option}
                checked={capacity === option}
                onChange={() => setCapacity(option)}
              />
              {option}
            </label>
          ))}
        </div>
        <p id="plaetze-hint" className="mt-2 text-sm text-muted-foreground">
          Dich eingeschlossen.
        </p>
        {error?.fields?.capacity ? (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error.fields.capacity}
          </p>
        ) : null}
      </fieldset>

      <div>
        <Label htmlFor="notiz">Notiz, optional</Label>
        <Textarea
          id="notiz"
          className="mt-2"
          value={note}
          maxLength={140}
          onChange={(event) => setNote(event.target.value)}
          aria-invalid={error?.fields?.note ? true : undefined}
          aria-describedby={describedBy("notiz", Boolean(error?.fields?.note))}
        />
        <p id="notiz-hint" className="mt-2 text-sm text-muted-foreground">
          Woran man euch erkennt. Kein Link. {note.length}/140
        </p>
        {error?.fields?.note ? (
          <p id="notiz-error" role="alert" className="mt-2 text-sm text-destructive">
            {error.fields.note}
          </p>
        ) : null}
      </div>

      {actor ? (
        <p className="text-sm">
          Dein Name auf diesem Gerät: <span className="font-medium">{actor.displayName}</span>
        </p>
      ) : (
        <div>
          <Label htmlFor="anlegen-name">Anzeigename</Label>
          <Input
            id="anlegen-name"
            className="mt-2"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="nickname"
            aria-invalid={nameError || error?.fields?.name ? true : undefined}
            aria-describedby="anlegen-name-hint"
          />
          <p id="anlegen-name-hint" className="mt-2 text-sm leading-6 text-muted-foreground">
            Nur ein Name für diese Demo auf diesem Gerät. Kein Konto, keine Prüfung.
          </p>
          {nameError || error?.fields?.name ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {nameError ?? error?.fields?.name}
            </p>
          ) : null}
        </div>
      )}

      <Button type="submit" className="w-full" data-testid="create-submit">
        Treffen anlegen
      </Button>
    </form>
  );
}
