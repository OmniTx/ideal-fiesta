import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Coffee, ShieldCheck } from "lucide-react";

import { GLUTEN_FREE_CLAIM, GLUTEN_FREE_HEADLINE } from "@/lib/copy";

export const metadata: Metadata = {
  title: "Our Story · Foundry Artisan Coffee",
  description:
    "How Foundry Artisan Coffee became a dedicated 100% gluten-free kitchen on Level 3 of Indooroopilly Shopping Centre.",
};

/**
 * The long-form brand story, moved off the homepage so the homepage can get
 * customers to the menu, the rewards signup and the location quickly.
 */
export default function ShopStoryPage() {
  return (
    <div className="bg-background pb-24">
      {/* Photo band */}
      <section className="relative border-b border-border bg-foreground text-background/85">
        <div className="relative h-56 w-full sm:h-80 md:h-[380px]">
          <Image
            src="/images/cafe-band.jpg"
            alt="Foundry Artisan Coffee bench and barista"
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-90"
          />
        </div>
        <div className="px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <p className="text-base leading-relaxed sm:text-lg">
              <strong className="font-semibold text-primary-foreground">
                Timber panelling, live plants above the machine, and a Synesso
                running all day.
              </strong>{" "}
              Foundry sits on Level 3 of Indooroopilly Shopping Centre. Pull up a
              stool at the bench or grab a table for a relaxed morning coffee.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 sm:pt-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Foundry Home</span>
        </Link>

        <div className="mt-4 flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
          <ShieldCheck className="h-4 w-4" />
          <span>{GLUTEN_FREE_HEADLINE}</span>
        </div>

        <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-foreground sm:text-6xl">
          Built around the bench
        </h1>

        <div className="mt-8 flex flex-col gap-5 text-base leading-relaxed text-muted-foreground">
          <p>
            Foundry sits on Level 3 of Indooroopilly Shopping Centre. Natural
            timber panelling, live greenery climbing above the cup racks, and our
            custom Synesso espresso machine pulling rich double ristretto shots
            from morning until afternoon.
          </p>
          <p>
            Going gluten free was not a marketing angle — it was an intentional
            kitchen decision. {GLUTEN_FREE_CLAIM} It means that someone living
            with Coeliac disease or gluten intolerance can walk up, pick anything
            off the menu, and enjoy good food without having to interview the
            barista.
          </p>
          <p>
            We source our dairy locally, offer five specialty plant milks, and
            make our hollandaise, dressings and savoury toasties to order every
            single day.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-border shadow-sm sm:h-80">
            <Image
              src="/images/cafe-story.jpg"
              alt="Foundry cafe interior and coffee bench"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col justify-center gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-primary">
              <Coffee className="h-5 w-5" />
            </span>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Artisan specialty coffee
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Double ristretto extractions, ceremonial Japanese matcha,
              single-origin cold brews and house iced teas. Full dairy, oat,
              almond, soy and lactose-free milk options, every day.
            </p>
            <Link
              href="/menu"
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:bg-foreground/85"
            >
              Explore the full menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
