import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Foundry Artisan Coffee
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
          Back of house is ready
        </h1>
        <p className="mt-3 text-muted-foreground">
          The public storefront arrives in the next phase. For now, head into
          the admin to manage the menu.
        </p>
      </div>

      <Link
        href="/admin"
        className="touch-target inline-flex w-fit items-center justify-center rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground"
      >
        Open admin
      </Link>
    </main>
  );
}
