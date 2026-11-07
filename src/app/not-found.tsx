import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-4xl tracking-tight">Diese Seite gibt es nicht.</h1>
      <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">
        Zur Liste
      </Link>
    </div>
  );
}
