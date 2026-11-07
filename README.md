# Runde

Kleine Treffen um eine Tätigkeit. Du wählst eine Stadt, siehst was bald offen ist, und sagst zu. Oder du legst selbst eines an: Tätigkeit, öffentlicher Ort, jetzt, heute oder morgen.

Es gibt keine Profile, keine Personensuche und keinen Swipe.

Die laufende Fassung ist eine lokale Demo. Was du anlegst oder zusagst, liegt in diesem Browser. Ein zweiter Browser sieht es nicht. Beispieldatensätze sind mit „Beispiel“ markiert.

## Start

```bash
npm install
npm run dev -- -p 4317
```

Dann `http://127.0.0.1:4317` öffnen.

## Prüfen

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Speicher

Die Regeln für Anlegen, Zusage, Kapazität, Absage, Ablauf, Melden und Ausblenden stehen in `src/domain`. Beide Adapter müssen diese Funktionen benutzen.

`LocalDemoRepository` schreibt nach `localStorage` (`runde-demo-v1`). `createSharedRepository` hat dieselbe Schnittstelle und lehnt jeden Schreibzugriff ab.

Für einen gemeinsamen Betrieb fehlt:

- ein eigenes Datenprojekt. Vorhandene Supabase-Projekte gehören zu anderen Anwendungen und werden hier nicht benutzt.
- eine Anmeldung, die eine Person an ein Konto bindet. Ein Anzeigename reicht dafür nicht.
- die Prüfung der Regeln auf dem Server, plus Zugriffsschutz.
- ein Weg, auf dem ein Mensch Meldungen sieht. In der Demo bleiben sie auf dem Gerät.

## Vercel

Next.js, keine Umgebungsvariablen, kein Secret.

- Install: `npm install`
- Build: `npm run build`
- Node: 20.9 oder neuer

Dieses Repository ist ein Origin-Entwurf. Es wird hier nicht nach GitHub gespiegelt und nicht selbst benannt oder veröffentlicht. Vercel braucht eine Verbindung zu diesem Origin-Repository. Im verbundenen Konto liegt das Team `ios-agent`. Projekt und Verbindung legt die übergeordnete Koordination an.

Die Seiten sind `noindex`, weil die Demo kein gemeinsames Verzeichnis ist.

## Sicherheit

Öffentliche Orte sind Pflicht. Formulierungen wie Wohnung oder „bei mir“ werden abgelehnt. Der Standort wird nur auf Wunsch abgefragt, um eine der fünf Städte vorzuschlagen, und nicht gespeichert. Melden und Ausblenden gelten nur lokal. Die Oberfläche behauptet keine Moderation.
