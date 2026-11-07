"use client";

import { useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/dialogs";
import { useDemo } from "@/components/demo-provider";
import { Button } from "@/components/ui/button";

export function SafetyView() {
  const { reset } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-serif text-3xl tracking-tight md:hidden">
          <Link href="/">Runde</Link>
        </p>
        <h1 className="font-serif text-4xl tracking-tight">Bevor du hingehst</h1>
        <p className="max-w-prose text-lg leading-8">
          Ein öffentlicher Ort ist besser als eine Wohnung. Sicher ist er davon nicht.
        </p>
      </header>
      <ul className="max-w-prose space-y-4 leading-7">
        <li>Verabredet euch dort, wo andere Leute auch hingehen können.</li>
        <li>Diese Demo prüft keine Namen. Ein Anzeigename ist kein Ausweis.</li>
        <li>Melden und Ausblenden gelten nur auf diesem Gerät. Es gibt keine Moderation.</li>
        <li>
          Den Standort fragt die App nur, wenn du eine Stadt vorschlagen lässt. Die Koordinaten werden
          nicht gespeichert.
        </li>
        <li>Wenn sich ein Treffen falsch anfühlt, sag ab und geh nicht hin.</li>
      </ul>
      <section className="max-w-prose space-y-3 border-t border-border pt-8">
        <h2 className="font-serif text-2xl tracking-tight">Demo zurücksetzen</h2>
        <p className="text-muted-foreground">
          Löscht Zusagen, eigene Treffen, Meldungen und den Namen in diesem Browser.
        </p>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Demo zurücksetzen
        </Button>
      </section>
      <ConfirmDialog
        open={open}
        title="Demo zurücksetzen"
        body="Zusagen, eigene Treffen, Meldungen und der Name werden in diesem Browser gelöscht."
        confirmLabel="Zurücksetzen"
        destructive
        onOpenChange={setOpen}
        onConfirm={reset}
      />
    </div>
  );
}
