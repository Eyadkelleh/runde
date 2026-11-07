"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4" role="alert">
      <h1 className="font-serif text-4xl tracking-tight">Das hat nicht geladen.</h1>
      <p>Lad die Seite neu. Wenn es wieder passiert, setz die Demo zurück.</p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground"
      >
        Nochmal versuchen
      </button>
    </div>
  );
}
