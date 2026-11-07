"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo-provider";
import { cn } from "cn";

const LINKS = [
  { href: "/", label: "Entdecken" },
  { href: "/neu", label: "Anlegen" },
  { href: "/meine", label: "Meine" },
  { href: "/sicherheit", label: "Sicherheit" },
] as const;

function current(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/treffen");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const items = compact ? LINKS.filter((link) => link.href !== "/sicherheit") : LINKS;
  return (
    <nav
      aria-label="Hauptnavigation"
      className={cn(compact ? "flex h-14" : "mt-8 flex flex-col gap-1")}
    >
      {items.map((link) => {
        const active = current(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center rounded-lg text-sm",
              compact
                ? "min-h-14 flex-1 justify-center"
                : "min-h-11 px-3",
              active ? "font-medium text-primary" : "text-foreground",
              !compact && active && "bg-accent",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DemoBanner() {
  return (
    <aside
      aria-label="Hinweis zur Demo"
      className="rounded-xl border border-border bg-card px-4 py-3 text-sm leading-6"
    >
      <p>Lokale Demo. Zusagen und neue Treffen bleiben in diesem Browser.</p>
      <Link href="/sicherheit" className="mt-1 inline-flex min-h-11 items-center underline underline-offset-4">
        Was das bedeutet
      </Link>
    </aside>
  );
}

export function FlashMessage() {
  const { flash, dismissFlash } = useDemo();
  if (!flash) return null;
  return (
    <div
      role={flash.tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
        flash.tone === "error" ? "border-destructive/30 text-destructive" : "border-border bg-card",
      )}
    >
      <p>{flash.text}</p>
      <Button type="button" variant="ghost" className="h-9 shrink-0 px-3" onClick={dismissFlash}>
        Schließen
      </Button>
    </div>
  );
}

export function AppFrame({
  side,
  bottom,
  children,
}: {
  side: ReactNode;
  bottom: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <a href="#inhalt" className="skip-link">
        Zum Inhalt
      </a>
      <div className="mx-auto grid w-full max-w-6xl md:grid-cols-[14rem_minmax(0,40rem)] md:justify-center md:gap-16 md:px-8">
        <div className="hidden md:block">{side}</div>
        <div className="min-w-0 px-5 pb-28 pt-5 md:px-0 md:pb-16 md:pt-10">
          <div className="space-y-4">
            <DemoBanner />
            <FlashMessage />
            <main id="inhalt" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <p className="pt-6 text-sm text-[#3a342c]">Speicher: nur dieser Browser</p>
          </div>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] md:hidden">
        {bottom}
      </div>
    </>
  );
}

export function SideNav() {
  return (
    <div className="sticky top-8 pt-10">
      <Link href="/" className="font-serif text-4xl tracking-tight">
        Runde
      </Link>
      <p className="mt-2 text-sm text-muted-foreground">Tätigkeit, Ort, Zeit.</p>
      <NavLinks />
    </div>
  );
}

export function BottomNav() {
  return <NavLinks compact />;
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="space-y-3">
      <p className="sr-only">{label}</p>
      <div className="h-36 rounded-xl border border-border bg-card" />
      <div className="h-36 rounded-xl border border-border bg-card" />
      <div className="h-36 rounded-xl border border-border bg-card" />
    </div>
  );
}
