import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, WheatOff } from "lucide-react";

import { GLUTEN_FREE_HEADLINE } from "@/lib/copy";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Allergens & Dietary · Foundry Artisan Coffee",
  description:
    "What our dedicated gluten free kitchen does and does not guarantee, and which allergens are present.",
};

const PRESENT = [
  "Dairy (milk, butter, cheese, cream)",
  "Egg",
  "Tree nuts (almond milk, pesto)",
  "Sesame (seeded bagels)",
  "Soy",
];

const FREE_FROM = [
  "Wheat flour and gluten-containing grains",
  "Barley and rye",
  "Wheat-based bread, pastries and pasta",
];

export default function AllergensPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Foundry Home</span>
      </Link>

      <h1 className="mt-4 font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl">
        Allergens &amp; Dietary
      </h1>

      <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground">
        <strong className="font-semibold">{GLUTEN_FREE_HEADLINE}.</strong> No
        wheat ingredients are used on premises.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
            <WheatOff className="h-4 w-4" />
            <span>What we do</span>
          </div>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            {FREE_FROM.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            We do not buy standard wheat bread or pastries, and we do not run a
            shared sandwich press or a shared toaster.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
            <AlertTriangle className="h-4 w-4" />
            <span>What we can&apos;t promise</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Our kitchen is a working café kitchen, not a medical facility. We
            cannot guarantee that any dish is completely free of traces of every
            allergen, and ingredients come from suppliers whose own facilities we
            do not control.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            If you have a serious allergy, please speak to a staff member before
            ordering so we can tell you exactly what is in a dish.
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-foreground">
          Allergens present in our kitchen
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {PRESENT.map((item) => (
            <li
              key={item}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Many dishes can be adjusted. Several plant milks are available, and the
          menu notes where a swap is possible. Ask and we will do what we can.
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-muted/60 p-5">
        <h2 className="font-display text-base font-semibold text-foreground">
          Coeliac and gluten intolerance
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We created Foundry as a dedicated gluten free kitchen rather than adding
          gluten free options to an existing one, because we wanted customers to
          be able to order without an interrogation. That said, we are a café and
          not a medical service, so we describe what we do rather than making a
          medical guarantee. If you need certainty about a specific ingredient,
          ask us and we will check the packaging with you.
        </p>
      </section>

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        Questions? See the{" "}
        <Link href="/contact" className="font-medium text-foreground underline">
          contact page
        </Link>{" "}
        or ask at our bench at {SITE.addressLine1}.
      </p>
    </div>
  );
}
