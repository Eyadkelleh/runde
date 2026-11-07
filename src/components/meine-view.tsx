"use client";

import { useState } from "react";
import Link from "next/link";
import { listMine } from "@/domain/filter";
import { LoadingState } from "@/components/app-shell";
import { NameDialog } from "@/components/dialogs";
import { useDemo } from "@/components/demo-provider";
import { MeetupCard } from "@/components/meetup-card";
import { Button } from "@/components/ui/button";

export function MeineView() {
  const { snapshot, saveName } = useDemo();
  const [nameOpen, setNameOpen] = useState(false);
  if (!snapshot) return <LoadingState label="Deine Treffen werden geladen." />;

  const now = new Date(snapshot.now);
  const actor = snapshot.actor;
  const mine = actor
    ? listMine(
        { meetups: snapshot.meetups, reports: snapshot.reports, blocks: snapshot.blocks },
        actor.id,
        now,
      )
    : { upcoming: [], past: [] };
  const empty = mine.upcoming.length === 0 && mine.past.length === 0;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-serif text-3xl tracking-tight md:hidden">
          <Link href="/">Runde</Link>
        </p>
        <h1 className="font-serif text-4xl tracking-tight">Meine Treffen</h1>
        {actor ? (
          <p className="text-sm">
            Anzeigename: <span className="font-medium">{actor.displayName}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Noch kein Anzeigename auf diesem Gerät.</p>
        )}
        <Button type="button" variant="outline" onClick={() => setNameOpen(true)}>
          {actor ? "Name ändern" : "Name festlegen"}
        </Button>
      </header>

      {empty ? (
        <div className="rounded-xl border border-dashed border-border px-5 py-10">
          <h2 className="font-serif text-2xl tracking-tight">Noch nichts zugesagt</h2>
          <p className="mt-2 text-muted-foreground">Keine Zusage und kein eigenes Treffen.</p>
          <Button nativeButton={false} render={<Link href="/" />} className="mt-6">
            Offene Treffen ansehen
          </Button>
        </div>
      ) : (
        <div className="space-y-8" data-testid="meine-list">
          {mine.upcoming.length > 0 ? (
            <section>
              <h2 className="text-sm font-medium">Offen</h2>
              <ul className="mt-3 space-y-3">
                {mine.upcoming.map((meetup) => (
                  <MeetupCard key={meetup.id} meetup={meetup} now={now} />
                ))}
              </ul>
            </section>
          ) : null}
          {mine.past.length > 0 ? (
            <section>
              <h2 className="text-sm font-medium">Vorbei oder abgesagt</h2>
              <ul className="mt-3 space-y-3">
                {mine.past.map((meetup) => (
                  <MeetupCard key={meetup.id} meetup={meetup} now={now} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      <NameDialog
        idPrefix="meine"
        open={nameOpen}
        onOpenChange={setNameOpen}
        onSave={(name) => {
          const saved = saveName(name);
          if (!saved.ok) return saved.error.message;
          setNameOpen(false);
          return null;
        }}
      />
    </div>
  );
}
