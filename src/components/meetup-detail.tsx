"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { findHobby, findLocality, type Participant } from "@/domain/catalog";
import { viewMeetup, visibleParticipants } from "@/domain/filter";
import { isParticipant, organizerName, placesLeft, seatsLabel } from "@/domain/meetups";
import { effectiveStatus, formatMeetupWhen } from "@/domain/time";
import { LoadingState } from "@/components/app-shell";
import { ConfirmDialog, NameDialog, ReportDialog } from "@/components/dialogs";
import { useDemo } from "@/components/demo-provider";
import { Button } from "@/components/ui/button";

export function MeetupDetail() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { snapshot, join, leave, cancel, report, block, saveName } = useDemo();
  const pending = useRef<(() => void) | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<Participant | null>(null);

  const meetup = snapshot
    ? viewMeetup(
        { meetups: snapshot.meetups, reports: snapshot.reports, blocks: snapshot.blocks },
        id,
        snapshot.actor?.id ?? null,
      )
    : null;
  const hobbyLabel =
    meetup && meetup.kind !== "missing" ? (findHobby(meetup.meetup.hobbyId)?.label ?? "Treffen") : "Treffen";

  useEffect(() => {
    document.title = `${hobbyLabel} · Runde`;
  }, [hobbyLabel]);

  if (!snapshot || !meetup) return <LoadingState label="Treffen wird geladen." />;
  if (snapshot.availability !== "ready") {
    return (
      <div role="alert">
        <h1 className="font-serif text-4xl tracking-tight">Kein gemeinsamer Speicher</h1>
        <p className="mt-3">{snapshot.availabilityMessage}</p>
      </div>
    );
  }
  if (meetup.kind === "missing") {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-4xl tracking-tight">Nicht gefunden</h1>
        <p>Dieses Treffen gibt es hier nicht.</p>
        <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Zurück zur Liste
        </Link>
      </div>
    );
  }
  if (meetup.kind === "hidden") {
    const text =
      meetup.reason === "reported"
        ? "Du hast dieses Treffen auf diesem Gerät gemeldet. Niemand sonst sieht die Meldung."
        : "Die veranstaltende Person ist auf diesem Gerät ausgeblendet.";
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-4xl tracking-tight">Ausgeblendet</h1>
        <p>{text}</p>
        <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Zurück zur Liste
        </Link>
      </div>
    );
  }

  const item = meetup.meetup;
  const now = new Date(snapshot.now);
  const hobby = findHobby(item.hobbyId);
  const locality = findLocality(item.localityId);
  const actorId = snapshot.actor?.id ?? null;
  const joined = isParticipant(item, actorId);
  const organizer = actorId !== null && item.organizerId === actorId;
  const status = effectiveStatus(item, now);
  const people = visibleParticipants(item, actorId, snapshot.blocks);
  const when = formatMeetupWhen(new Date(item.startsAt), new Date(item.endsAt), now);

  function requireName(action: () => void) {
    if (snapshot?.actor) {
      action();
      return;
    }
    pending.current = action;
    setNameOpen(true);
  }

  function onSaveName(name: string) {
    const saved = saveName(name);
    if (!saved.ok) return saved.error.message;
    setNameOpen(false);
    pending.current?.();
    pending.current = null;
    return null;
  }

  return (
    <article className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">{locality?.label}</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight">{hobby?.label ?? "Treffen"}</h1>
        {item.synthetic ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Beispieldaten. Keine echten Personen und kein echtes Treffen.
          </p>
        ) : (
          <p className="mt-4 text-sm">Nur in diesem Browser gespeichert.</p>
        )}
      </header>

      <div>
        <p className="text-lg font-medium">{when}</p>
        <p className="mt-2 text-lg">{item.placeName}</p>
        {item.note ? <p className="mt-4 max-w-prose text-muted-foreground">{item.note}</p> : null}
        <p className="mt-6 font-serif text-3xl tracking-tight">{seatsLabel(item, now)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.participants.length} von {item.capacity}
        </p>
      </div>

      <section aria-labelledby="vor-ort">
        <h2 id="vor-ort" className="text-sm font-medium">
          Vor Ort
        </h2>
        {joined ? (
          <ul className="mt-3 divide-y divide-border">
            {people.map((person) => (
              <li key={person.id} className="flex min-h-11 items-center justify-between gap-3 py-2">
                <span>
                  {person.displayName}
                  {person.id === actorId ? " (du)" : ""}
                  {person.id === item.organizerId ? " (veranstaltet)" : ""}
                </span>
                {person.id !== actorId ? (
                  <Button type="button" variant="ghost" className="h-9 px-3" onClick={() => setBlockTarget(person)}>
                    Ausblenden
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 space-y-3">
            <p>Veranstaltet von {organizerName(item)}. Weitere Namen nach der Zusage.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                requireName(() =>
                  setBlockTarget({
                    id: item.organizerId,
                    displayName: organizerName(item),
                  }),
                )
              }
            >
              Diese Person ausblenden
            </Button>
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3">
        {status === "cancelled" ? <p>Abgesagt.</p> : null}
        {status === "expired" ? <p>Vorbei.</p> : null}
        {status === "open" && !joined && placesLeft(item) === 0 ? <p>Voll.</p> : null}
        {status === "open" && !joined && placesLeft(item) > 0 ? (
          <Button type="button" data-testid="join-button" onClick={() => requireName(() => join(id))}>
            Ich komme
          </Button>
        ) : null}
        {status === "open" && joined && !organizer ? (
          <Button type="button" variant="outline" onClick={() => leave(id)}>
            Doch nicht
          </Button>
        ) : null}
        {organizer && status !== "cancelled" ? (
          <Button type="button" variant="destructive" onClick={() => setCancelOpen(true)}>
            Treffen absagen
          </Button>
        ) : null}
        {!organizer ? (
          <Button type="button" variant="ghost" onClick={() => requireName(() => setReportOpen(true))}>
            Melden
          </Button>
        ) : null}
        <Link href="/" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">
          Zurück zur Liste
        </Link>
      </div>

      <NameDialog idPrefix="detail" open={nameOpen} onOpenChange={setNameOpen} onSave={onSaveName} />
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        onReport={(reasonId) => report(id, reasonId)}
      />
      <ConfirmDialog
        open={cancelOpen}
        title="Treffen absagen"
        body="Die Absage gilt in diesem Browser. Andere Geräte sehen sie nicht."
        confirmLabel="Absagen"
        destructive
        onOpenChange={setCancelOpen}
        onConfirm={() => cancel(id)}
      />
      <ConfirmDialog
        open={blockTarget !== null}
        title="Person ausblenden"
        body={
          blockTarget
            ? `${blockTarget.displayName} wird auf diesem Gerät ausgeblendet. Keine Nachricht, keine Prüfung.`
            : ""
        }
        confirmLabel="Ausblenden"
        onOpenChange={(open) => {
          if (!open) setBlockTarget(null);
        }}
        onConfirm={() => {
          if (blockTarget) block(blockTarget.id);
        }}
      />
    </article>
  );
}
